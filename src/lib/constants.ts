import type { DiaSemana } from "../types/patient";

export interface DiaSemanaInfo {
  val: DiaSemana;
  label: string;
  short: string;
}

export const DIAS_SEMANA: DiaSemanaInfo[] = [
  { val: 0, label: "Domingo", short: "Dom" },
  { val: 1, label: "Segunda-feira", short: "Seg" },
  { val: 2, label: "Terça-feira", short: "Ter" },
  { val: 3, label: "Quarta-feira", short: "Qua" },
  { val: 4, label: "Quinta-feira", short: "Qui" },
  { val: 5, label: "Sexta-feira", short: "Sex" },
  { val: 6, label: "Sábado", short: "Sáb" },
];

export const DURACOES = [30, 45, 50, 60, 75, 90, 120] as const;

export const SLOT_START_HOUR = 7;
export const SLOT_END_HOUR = 22;
export const SLOT_MINUTES = 30;
export const TOTAL_SLOTS =
  ((SLOT_END_HOUR - SLOT_START_HOUR) * 60) / SLOT_MINUTES;

export const GENERO_OPTIONS = [
  "Feminino",
  "Masculino",
  "Não-binário",
  "Mulher trans",
  "Homem trans",
  "Prefiro não informar",
] as const;

export const INDICACAO_OPTIONS = [
  "Amigo",
  "Familiar",
  "Rede social",
  "Médico",
  "Outro profissional de saúde",
  "Convênio",
  "Busca na internet",
] as const;

export const MODALIDADE_OPTIONS = ["Presencial", "Remoto", "Híbrido"] as const;

export const TIPO_PACIENTE_OPTIONS = [
  "Primeira entrevista",
  "Recorrente",
] as const;

export const STATUS_OPTIONS = ["Ativo", "Inativo"] as const;
