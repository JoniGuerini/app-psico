import type { Modalidade, Paciente } from "../types/patient";
import { timeToMinutes } from "./time";

export interface SessionInstance {
  date: Date; // data real da sessão (00:00 daquele dia)
  horario: string; // "HH:mm"
  duracao: number;
  patient: Paciente;
  /** Modalidade resolvida (do agendamento ou, em fallback, do paciente). */
  modalidade?: Modalidade;
}

/**
 * Retorna o início do dia (00:00:00 local).
 */
export const startOfDay = (d: Date): Date => {
  const next = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return next;
};

export const isSameDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export const addDays = (d: Date, days: number): Date => {
  const next = new Date(d);
  next.setDate(next.getDate() + days);
  return next;
};

export const addMonths = (d: Date, months: number): Date => {
  const next = new Date(d);
  next.setMonth(next.getMonth() + months);
  return next;
};

/**
 * Início da semana (segunda-feira, ISO-like) para qualquer data.
 */
export const startOfWeekMonday = (d: Date): Date => {
  const day = d.getDay(); // 0=Dom, 1=Seg, ...
  // Quantos dias voltar para chegar na segunda
  const diff = day === 0 ? -6 : 1 - day;
  return startOfDay(addDays(d, diff));
};

/**
 * Retorna 7 datas começando na segunda-feira da semana de `d`.
 */
export const weekDaysMonday = (d: Date): Date[] => {
  const start = startOfWeekMonday(d);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
};

/**
 * Retorna a matriz 6x7 (42 dias) de uma visão mensal,
 * começando na segunda-feira da semana que contém o dia 1 do mês.
 */
export const monthMatrix = (year: number, month: number): Date[] => {
  const firstOfMonth = new Date(year, month, 1);
  const start = startOfWeekMonday(firstOfMonth);
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
};

/**
 * Sessões para um determinado dia, considerando os agendamentos
 * recorrentes por diaSemana.
 */
export const sessionsForDate = (
  patients: Paciente[],
  date: Date
): SessionInstance[] => {
  const weekday = date.getDay();
  const day = startOfDay(date);
  const events: SessionInstance[] = [];
  patients.forEach((p) => {
    if (!Array.isArray(p.agendamentos)) return;
    p.agendamentos.forEach((a) => {
      if (Number(a.diaSemana) === weekday && a.horario && a.duracao) {
        events.push({
          date: day,
          horario: a.horario,
          duracao: Number(a.duracao),
          patient: p,
          modalidade: a.modalidade ?? p.modalidade,
        });
      }
    });
  });
  events.sort((a, b) => timeToMinutes(a.horario) - timeToMinutes(b.horario));
  return events;
};

/**
 * Próximas N sessões a partir de "now", varrendo os próximos `lookaheadDays`.
 * Sessões do dia de hoje que já passaram são descartadas.
 */
export const upcomingSessions = (
  patients: Paciente[],
  now: Date,
  limit = 6,
  lookaheadDays = 14
): SessionInstance[] => {
  const today = startOfDay(now);
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const result: SessionInstance[] = [];

  for (let i = 0; i < lookaheadDays && result.length < limit * 4; i++) {
    const date = addDays(today, i);
    const sessoes = sessionsForDate(patients, date);
    for (const s of sessoes) {
      if (i === 0 && timeToMinutes(s.horario) < nowMin) continue;
      result.push(s);
    }
  }

  return result.slice(0, limit);
};

/**
 * Conta sessões por data (chave "yyyy-mm-dd") para todas as datas dadas.
 * Útil pra renderizar os pontinhos do calendário mensal.
 */
export const dateKey = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

/**
 * Mapa diaSemana (0-6) -> quantos pacientes têm agendamento naquele dia.
 * Útil pra contagem rápida sem montar a matriz inteira.
 */
export const sessionsCountByWeekday = (
  patients: Paciente[]
): Record<number, number> => {
  const map: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  patients.forEach((p) => {
    if (!Array.isArray(p.agendamentos)) return;
    p.agendamentos.forEach((a) => {
      if (a.horario && a.duracao && a.diaSemana != null) {
        map[Number(a.diaSemana)]++;
      }
    });
  });
  return map;
};

export const formatMonthYear = (d: Date): string =>
  d
    .toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
    .replace(/^./, (c) => c.toUpperCase())
    .replace(/de /, "");

export const formatLongDate = (d: Date): string =>
  d.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

export const formatShortDate = (d: Date): string =>
  d.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "short",
  });

export const formatWeekRange = (start: Date, end: Date): string => {
  const sameMonth =
    start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  if (sameMonth) {
    const month = start.toLocaleDateString("pt-BR", { month: "long" });
    return `${start.getDate()} a ${end.getDate()} de ${month}`;
  }
  return `${formatShortDate(start)} – ${formatShortDate(end)}`;
};
