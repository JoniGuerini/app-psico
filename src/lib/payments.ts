import type { Pagamento, Paciente } from "../types/patient";
import { addDays, dateKey, startOfDay } from "./calendar";

/**
 * Status exibido em UI para uma sessão.
 *
 * Diferente de `StatusPagamento` (persistido como "Pago" | "Pendente"),
 * aqui temos dois estados computados em runtime:
 *  - `Agendada`: sessão cuja data ainda não chegou (data > hoje).
 *  - `Atrasado`: sessão já passada cujo mês já virou sem pagamento.
 * Esses estados nunca são gravados em `Pagamento.status` — são sempre
 * derivados pela `generatePaymentRows`.
 */
export type PaymentRowStatus = "Pago" | "Pendente" | "Atrasado" | "Agendada";

/** Sessões "a receber" — já aconteceram e ainda não foram pagas. */
export const isReceivable = (status: PaymentRowStatus): boolean =>
  status === "Pendente" || status === "Atrasado";

export interface PendingEntry {
  patient: Paciente;
  row: PaymentRow;
}

export interface PaymentRow {
  /** chave única "yyyy-mm-dd-HH:mm" */
  key: string;
  date: Date;
  horario: string;
  duracao: number;
  /** valor cobrado (do pagamento, se existir; senão o valorSessao do paciente) */
  valor: number;
  status: PaymentRowStatus;
  pagamento?: Pagamento;
}

/** Início e fim (inclusivo) do mês de `cursor`. */
export const monthRange = (cursor: Date): { from: Date; to: Date } => {
  const from = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const to = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
  return { from: startOfDay(from), to: startOfDay(to) };
};

/** Visão financeira agregada (totais em valor + contagem por status). */
export interface FinancialOverview extends PaymentTotals {
  /** Top pacientes em atraso (ordenados por valor atrasado, decrescente). */
  topAtrasados: Array<{ patient: Paciente; valor: number; count: number }>;
  /** Distribuição de pagamentos pagos por método de pagamento. */
  porMetodo: Array<{ metodo: string; valor: number; count: number }>;
  /** Série mensal — últimos N meses do intervalo, em ordem cronológica. */
  serieMensal: Array<{
    label: string;
    year: number;
    month: number;
    pago: number;
    pendente: number;
    atrasado: number;
    agendada: number;
  }>;
}

/**
 * Calcula a visão financeira consolidada (todos os pacientes ativos)
 * dentro do intervalo. A série mensal é uma agregação por mês entre
 * `from` e `to`, útil pra renderizar gráfico de barras.
 */
export const computeFinancialOverview = (
  patients: Paciente[],
  from: Date,
  to: Date
): FinancialOverview => {
  const allRows: { row: PaymentRow; patient: Paciente }[] = [];
  patients.forEach((p) => {
    if (p.status !== "Ativo") return;
    generatePaymentRows(p, from, to).forEach((row) => {
      allRows.push({ row, patient: p });
    });
  });

  const totals = computeTotals(allRows.map((r) => r.row));

  // Top atrasados por paciente
  const atrasadosByPatient = new Map<
    string,
    { patient: Paciente; valor: number; count: number }
  >();
  allRows.forEach(({ row, patient }) => {
    if (row.status !== "Atrasado") return;
    const cur = atrasadosByPatient.get(patient.id) ?? {
      patient,
      valor: 0,
      count: 0,
    };
    cur.valor += row.valor;
    cur.count += 1;
    atrasadosByPatient.set(patient.id, cur);
  });
  const topAtrasados = Array.from(atrasadosByPatient.values()).sort(
    (a, b) => b.valor - a.valor
  );

  // Distribuição por método (apenas Pago, com método informado)
  const metodoMap = new Map<string, { valor: number; count: number }>();
  allRows.forEach(({ row }) => {
    if (row.status !== "Pago") return;
    const metodo = row.pagamento?.metodo ?? "Não informado";
    const cur = metodoMap.get(metodo) ?? { valor: 0, count: 0 };
    cur.valor += row.valor;
    cur.count += 1;
    metodoMap.set(metodo, cur);
  });
  const porMetodo = Array.from(metodoMap.entries())
    .map(([metodo, v]) => ({ metodo, ...v }))
    .sort((a, b) => b.valor - a.valor);

  // Série mensal — varre meses entre from e to (inclusivo)
  const serieMensal: FinancialOverview["serieMensal"] = [];
  const startCursor = new Date(from.getFullYear(), from.getMonth(), 1);
  const endCursor = new Date(to.getFullYear(), to.getMonth(), 1);
  const monthLabels = [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
  ];
  for (
    let m = new Date(startCursor);
    m.getTime() <= endCursor.getTime();
    m = new Date(m.getFullYear(), m.getMonth() + 1, 1)
  ) {
    serieMensal.push({
      label: `${monthLabels[m.getMonth()]}/${String(m.getFullYear()).slice(-2)}`,
      year: m.getFullYear(),
      month: m.getMonth(),
      pago: 0,
      pendente: 0,
      atrasado: 0,
      agendada: 0,
    });
  }
  const findMonth = (d: Date) =>
    serieMensal.find(
      (s) => s.year === d.getFullYear() && s.month === d.getMonth()
    );
  allRows.forEach(({ row }) => {
    const bucket = findMonth(row.date);
    if (!bucket) return;
    if (row.status === "Pago") bucket.pago += row.valor;
    else if (row.status === "Pendente") bucket.pendente += row.valor;
    else if (row.status === "Atrasado") bucket.atrasado += row.valor;
    else if (row.status === "Agendada") bucket.agendada += row.valor;
  });

  return {
    ...totals,
    topAtrasados,
    porMetodo,
    serieMensal,
  };
};

/**
 * Gera linhas de sessões previstas para um paciente, no intervalo [from..to]
 * (inclusivo nos dois lados), com base nos agendamentos recorrentes
 * por diaSemana. Cruza com `patient.pagamentos` pra atribuir status.
 *
 * Sessões anteriores à `dataInicioTerapia` são puladas — o paciente nem
 * existia como cliente naquela data.
 */
export const generatePaymentRows = (
  patient: Paciente,
  from: Date,
  to: Date
): PaymentRow[] => {
  if (!patient.agendamentos?.length) return [];

  const inicio = patient.dataInicioTerapia
    ? startOfDay(new Date(patient.dataInicioTerapia + "T00:00:00"))
    : null;

  // Indexa pagamentos por chave "data-horario" pra lookup O(1)
  const byKey = new Map<string, Pagamento>();
  (patient.pagamentos ?? []).forEach((p) => {
    byKey.set(`${p.data}-${p.horario}`, p);
  });

  const valorBase = Number(patient.valorSessao) || 0;
  const rows: PaymentRow[] = [];
  const start = startOfDay(from);
  const end = startOfDay(to);
  const today = startOfDay(new Date());

  // Uma sessão é "atrasada" quando o mês dela já virou — ou seja,
  // ano da sessão < ano atual, ou (mesmo ano e mês da sessão < mês atual).
  const isLateMonth = (sessionDate: Date): boolean => {
    if (sessionDate.getFullYear() < today.getFullYear()) return true;
    if (
      sessionDate.getFullYear() === today.getFullYear() &&
      sessionDate.getMonth() < today.getMonth()
    ) {
      return true;
    }
    return false;
  };

  for (
    let cursor = start;
    cursor.getTime() <= end.getTime();
    cursor = addDays(cursor, 1)
  ) {
    if (inicio && cursor.getTime() < inicio.getTime()) continue;
    const weekday = cursor.getDay();
    const dKey = dateKey(cursor);

    patient.agendamentos.forEach((a) => {
      if (Number(a.diaSemana) !== weekday) return;
      if (!a.horario || !a.duracao) return;
      const lookup = byKey.get(`${dKey}-${a.horario}`);

      let rowStatus: PaymentRowStatus;
      if (lookup?.status === "Pago") {
        rowStatus = "Pago";
      } else if (cursor.getTime() > today.getTime()) {
        // Sessão futura — ainda não aconteceu, está apenas agendada.
        rowStatus = "Agendada";
      } else if (isLateMonth(cursor)) {
        // Sessão já passada, mês virou sem pagamento.
        rowStatus = "Atrasado";
      } else {
        // Sessão já passada (ou hoje) no mês corrente.
        rowStatus = "Pendente";
      }

      rows.push({
        key: `${dKey}-${a.horario}`,
        date: new Date(cursor),
        horario: a.horario,
        duracao: Number(a.duracao),
        valor: lookup?.valor ?? valorBase,
        status: rowStatus,
        pagamento: lookup,
      });
    });
  }

  rows.sort((a, b) => {
    if (a.date.getTime() !== b.date.getTime()) {
      return a.date.getTime() - b.date.getTime();
    }
    return a.horario.localeCompare(b.horario);
  });
  return rows;
};

/**
 * Junta sessões não pagas (Pendente + Atrasado) de todos os pacientes
 * ativos no intervalo dado. Retorna em ordem cronológica decrescente
 * (mais recente primeiro).
 */
export const collectPendingPayments = (
  patients: Paciente[],
  from: Date,
  to: Date
): PendingEntry[] => {
  const result: PendingEntry[] = [];
  patients.forEach((p) => {
    if (p.status !== "Ativo") return;
    const rows = generatePaymentRows(p, from, to);
    rows.forEach((row) => {
      if (isReceivable(row.status)) {
        result.push({ patient: p, row });
      }
    });
  });
  result.sort((a, b) => {
    if (a.row.date.getTime() !== b.row.date.getTime()) {
      return b.row.date.getTime() - a.row.date.getTime();
    }
    return b.row.horario.localeCompare(a.row.horario);
  });
  return result;
};

export interface PaymentTotals {
  pendente: number;
  pendenteCount: number;
  atrasado: number;
  atrasadoCount: number;
  agendada: number;
  agendadaCount: number;
  pagoMes: number;
  pagoMesCount: number;
  total: number;
  totalCount: number;
}

/**
 * Totais a partir das linhas geradas. "Total" e "Pago no mês" usam as
 * próprias linhas (que já estão filtradas pelo período exibido).
 */
export const computeTotals = (rows: PaymentRow[]): PaymentTotals => {
  let pendente = 0;
  let pendenteCount = 0;
  let atrasado = 0;
  let atrasadoCount = 0;
  let agendada = 0;
  let agendadaCount = 0;
  let pagoMes = 0;
  let pagoMesCount = 0;
  let total = 0;
  rows.forEach((r) => {
    total += r.valor;
    if (r.status === "Pago") {
      pagoMes += r.valor;
      pagoMesCount += 1;
    } else if (r.status === "Atrasado") {
      atrasado += r.valor;
      atrasadoCount += 1;
    } else if (r.status === "Agendada") {
      agendada += r.valor;
      agendadaCount += 1;
    } else {
      pendente += r.valor;
      pendenteCount += 1;
    }
  });
  return {
    pendente,
    pendenteCount,
    atrasado,
    atrasadoCount,
    agendada,
    agendadaCount,
    pagoMes,
    pagoMesCount,
    total,
    totalCount: rows.length,
  };
};
