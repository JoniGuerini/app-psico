import type { Pagamento, Paciente, StatusPagamento } from "../types/patient";
import { addDays, dateKey, startOfDay } from "./calendar";

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
  status: StatusPagamento;
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
      rows.push({
        key: `${dKey}-${a.horario}`,
        date: new Date(cursor),
        horario: a.horario,
        duracao: Number(a.duracao),
        valor: lookup?.valor ?? valorBase,
        status: lookup?.status ?? "Pendente",
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
 * Junta sessões pendentes de todos os pacientes ativos no intervalo dado.
 * Retorna em ordem cronológica decrescente (mais recente primeiro).
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
      if (row.status === "Pendente") {
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
  let pagoMes = 0;
  let pagoMesCount = 0;
  let total = 0;
  rows.forEach((r) => {
    total += r.valor;
    if (r.status === "Pago") {
      pagoMes += r.valor;
      pagoMesCount += 1;
    } else {
      pendente += r.valor;
      pendenteCount += 1;
    }
  });
  return {
    pendente,
    pendenteCount,
    pagoMes,
    pagoMesCount,
    total,
    totalCount: rows.length,
  };
};
