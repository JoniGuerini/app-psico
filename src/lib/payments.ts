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
