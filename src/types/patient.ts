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

export type StatusPagamento = "Pago" | "Pendente";

export type MetodoPagamento =
  | "PIX"
  | "Dinheiro"
  | "Cartão"
  | "Transferência"
  | "Boleto"
  | "Outro";

export interface Pagamento {
  id: string;
  /** Data da sessão (ISO yyyy-mm-dd). Junto com `horario` identifica unicamente. */
  data: string;
  horario: string; // "HH:mm"
  /** Valor cobrado naquela sessão. Pode diferir do valorSessao do paciente. */
  valor: number;
  status: StatusPagamento;
  /** Timestamp em que foi marcado como pago. */
  pagoEm?: string;
  metodo?: MetodoPagamento;
  observacao?: string;
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
  pagamentos?: Pagamento[];
  observacoes?: string;

  // Metadata
  criadoEm: string; // ISO
  atualizadoEm?: string; // ISO
}

export type PacienteInput = Omit<Paciente, "id" | "criadoEm" | "atualizadoEm">;
