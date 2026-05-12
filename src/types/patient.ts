export type DiaSemana = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type Modalidade = "Presencial" | "Remoto" | "Híbrido";

export type StatusPaciente = "Ativo" | "Inativo";

export type TipoPaciente = "Primeira entrevista" | "Recorrente";

export interface Agendamento {
  diaSemana: DiaSemana;
  horario: string; // "HH:mm"
  duracao: number; // minutos
  modalidade?: Modalidade; // modalidade individual; se ausente, herda a do paciente
}

export interface Paciente {
  id: string;

  // Dados pessoais
  nome: string;
  dataNascimento: string; // ISO yyyy-mm-dd
  cpf: string; // formatado 000.000.000-00
  genero: string;

  // Endereço
  cep: string;
  rua: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;

  // Contato
  celular: string;
  email?: string;
  contatoNome?: string;
  contatoTelefone?: string;
  contatoRelacao?: string;

  // Terapia
  tipoPaciente: TipoPaciente;
  status: StatusPaciente;
  dataInicioTerapia: string; // ISO yyyy-mm-dd
  valorSessao: number;
  indicacao: string;
  modalidade: Modalidade;
  agendamentos: Agendamento[];
  observacoes?: string;

  // Metadata
  criadoEm: string; // ISO
  atualizadoEm?: string; // ISO
}

export type PacienteInput = Omit<Paciente, "id" | "criadoEm" | "atualizadoEm">;
