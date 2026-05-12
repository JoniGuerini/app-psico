import type {
  Paciente,
  Agendamento,
  DiaSemana,
  Modalidade,
  Pagamento,
  TipoPaciente,
  StatusPaciente,
  MetodoPagamento,
} from "../types/patient";
import { uid } from "./format";

interface EnderecoSeed {
  bairro: string;
  cidade: string;
  uf: string;
  cep: string;
  rua: string;
}

const NOMES: Array<[string, string]> = [
  ["Isadora Rossi", "Feminino"],
  ["Lucas Almeida Santos", "Masculino"],
  ["Mariana Silva Costa", "Feminino"],
  ["Pedro Henrique Souza", "Masculino"],
  ["Camila Ferreira Lima", "Feminino"],
  ["Rafael Souza Pereira", "Masculino"],
  ["Beatriz Lima Oliveira", "Feminino"],
  ["Gabriel Carvalho Mendes", "Masculino"],
  ["Larissa Oliveira Santos", "Feminino"],
  ["André Costa Martins", "Masculino"],
  ["Julia Pereira Rocha", "Feminino"],
  ["Felipe Martins Dias", "Masculino"],
  ["Ana Santos Cardoso", "Feminino"],
  ["Bruno Ribeiro Alves", "Masculino"],
  ["Carolina Gomes Ferreira", "Feminino"],
  ["Diego Rodrigues Lopes", "Masculino"],
  ["Eduarda Cardoso Pinto", "Feminino"],
  ["Fernando Barbosa Castro", "Masculino"],
  ["Helena Mendes Araújo", "Feminino"],
  ["Igor Araújo Costa", "Masculino"],
  ["Juliana Castro Sousa", "Não-binário"],
  ["Leonardo Rocha Vieira", "Masculino"],
  ["Marina Dias Borges", "Feminino"],
  ["Nicolas Cunha Faria", "Masculino"],
  ["Patricia Moreira Lima", "Feminino"],
  ["Vinícius Ramos Castro", "Masculino"],
  ["Bianca Tavares Soares", "Feminino"],
  ["Thiago Nunes Almeida", "Masculino"],
  ["Letícia Vasconcelos Lima", "Feminino"],
  ["Matheus Cordeiro Pinto", "Masculino"],
  ["Sofia Brandão Reis", "Feminino"],
  ["Henrique Vieira Aragão", "Masculino"],
  ["Yasmin Borges Carvalho", "Feminino"],
  ["Rodrigo Oliveira Tavares", "Masculino"],
  ["Manuela Câmara Souza", "Feminino"],
  ["Otávio Pacheco Mello", "Masculino"],
  ["Valentina Andrade Lopes", "Feminino"],
  ["Caio Marinho Duarte", "Masculino"],
  ["Antonia Furtado Rocha", "Feminino"],
  ["Bernardo Pinto Cunha", "Masculino"],
  ["Lívia Cardoso Brandão", "Feminino"],
  ["Murilo Antunes Maia", "Masculino"],
  ["Sara Nogueira Britto", "Feminino"],
  ["Davi Macedo Teixeira", "Masculino"],
  ["Cecília Ramos Negrão", "Feminino"],
];

const ENDERECOS: EnderecoSeed[] = [
  { bairro: "Pinheiros", cidade: "São Paulo", uf: "SP", cep: "05422-001", rua: "Rua dos Pinheiros" },
  { bairro: "Vila Madalena", cidade: "São Paulo", uf: "SP", cep: "05435-000", rua: "Rua Aspicuelta" },
  { bairro: "Moema", cidade: "São Paulo", uf: "SP", cep: "04546-000", rua: "Avenida Ibirapuera" },
  { bairro: "Brooklin", cidade: "São Paulo", uf: "SP", cep: "04564-001", rua: "Rua Bandeirantes" },
  { bairro: "Itaim Bibi", cidade: "São Paulo", uf: "SP", cep: "04532-001", rua: "Rua Pequetita" },
  { bairro: "Jardim Paulista", cidade: "São Paulo", uf: "SP", cep: "01404-001", rua: "Alameda Santos" },
  { bairro: "Perdizes", cidade: "São Paulo", uf: "SP", cep: "05015-002", rua: "Rua Cardoso de Almeida" },
  { bairro: "Vila Mariana", cidade: "São Paulo", uf: "SP", cep: "04101-001", rua: "Rua Domingos de Morais" },
  { bairro: "Ipanema", cidade: "Rio de Janeiro", uf: "RJ", cep: "22420-040", rua: "Rua Visconde de Pirajá" },
  { bairro: "Botafogo", cidade: "Rio de Janeiro", uf: "RJ", cep: "22250-040", rua: "Rua São Clemente" },
  { bairro: "Savassi", cidade: "Belo Horizonte", uf: "MG", cep: "30130-000", rua: "Rua da Bahia" },
  { bairro: "Centro", cidade: "Curitiba", uf: "PR", cep: "80020-300", rua: "Rua XV de Novembro" },
];

const INDICACOES = [
  "Amigo",
  "Familiar",
  "Médico",
  "Convênio",
  "Rede social",
  "Busca na internet",
  "Outro profissional de saúde",
];
const RELACOES = ["Mãe", "Pai", "Irmã", "Irmão", "Esposa", "Marido", "Amigo", "Filha"];
const CONT_NOMES = [
  "Maria Silva",
  "João Santos",
  "Ana Costa",
  "Pedro Lima",
  "Júlia Souza",
  "Carlos Mendes",
];
const MODALIDADES: Modalidade[] = ["Presencial", "Remoto", "Híbrido"];
const TIPOS: TipoPaciente[] = [
  "Recorrente",
  "Recorrente",
  "Recorrente",
  "Recorrente",
  "Primeira entrevista",
];

// Slots disponíveis: segunda a sexta, horários redondos das 08h às 19h.
// (Sem 12-13, intervalo de almoço.)
const HORARIOS = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
];
const DIAS_UTEIS: DiaSemana[] = [1, 2, 3, 4, 5];

const DURACOES_M = [50, 50, 50, 50, 45, 60];
const VALORES = [200, 250, 300, 350, 400, 250, 300];
const OBS = [
  "Apresenta quadro de ansiedade leve. Foco no manejo de pensamentos automáticos.",
  "Boa adesão ao tratamento. Avançando bem nas sessões.",
  "Em processo de luto. Acompanhar sintomas depressivos.",
  "Conflitos familiares relacionados ao trabalho. Trabalhar comunicação.",
  "Sessões focadas em autoestima e autocuidado.",
  "Uso de medicação supervisionada por psiquiatra parceiro.",
];
const INATIVOS = new Set([8, 17, 22, 28, 33, 38, 42]);

const pad2 = (n: number): string => String(n).padStart(2, "0");

const genCpf = (): string => {
  const d: number[] = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10));
  let s = 0;
  for (let i = 0; i < 9; i++) s += d[i] * (10 - i);
  let v = 11 - (s % 11);
  if (v >= 10) v = 0;
  d.push(v);
  s = 0;
  for (let i = 0; i < 10; i++) s += d[i] * (11 - i);
  v = 11 - (s % 11);
  if (v >= 10) v = 0;
  d.push(v);
  return d.join("").replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
};

const genPhone = (): string => {
  const ddds = [11, 11, 11, 11, 21, 31, 41];
  const ddd = ddds[Math.floor(Math.random() * ddds.length)];
  const a = String(90000 + Math.floor(Math.random() * 9999)).slice(0, 5);
  const b = String(1000 + Math.floor(Math.random() * 9000)).slice(0, 4);
  return `(${ddd}) ${a}-${b}`;
};

const emailFromName = (nome: string): string => {
  const parts = nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/\s+/);
  return `${parts[0]}.${parts[parts.length - 1]}@email.com`;
};

const slotKey = (dia: DiaSemana, horario: string): string => `${dia}-${horario}`;

/**
 * Gera N agendamentos pra um paciente, garantindo que nenhum (dia, horário)
 * já esteja em uso pelo conjunto global `usedSlots`. Determinístico por `seedI`.
 */
const makeAgendamentos = (
  seedI: number,
  modalidadeBase: Modalidade,
  usedSlots: Set<string>
): Agendamento[] => {
  // Distribuição: 60% com 1 sessão/sem, 30% com 2, 10% com 3
  const r = seedI % 10;
  const n = r < 6 ? 1 : r < 9 ? 2 : 3;

  const result: Agendamento[] = [];
  for (let s = 0; s < n; s++) {
    let found: { dia: DiaSemana; horario: string } | null = null;
    const total = HORARIOS.length * DIAS_UTEIS.length;
    for (let attempt = 0; attempt < total; attempt++) {
      const di = (seedI * 3 + s * 7 + attempt * 11) % DIAS_UTEIS.length;
      const hi = (seedI * 5 + s * 13 + attempt * 3) % HORARIOS.length;
      const dia = DIAS_UTEIS[di];
      const horario = HORARIOS[hi];
      const k = slotKey(dia, horario);
      if (!usedSlots.has(k)) {
        usedSlots.add(k);
        found = { dia, horario };
        break;
      }
    }
    if (!found) break; // pool esgotado

    // Algumas sessões variam a modalidade pra ficar realista
    const indivMod: Modalidade =
      s === 0
        ? modalidadeBase
        : (seedI + s) % 3 === 0
          ? MODALIDADES[(seedI + s * 2) % 3]
          : modalidadeBase;

    result.push({
      diaSemana: found.dia,
      horario: found.horario,
      duracao: DURACOES_M[(seedI + s) % DURACOES_M.length],
      modalidade: indivMod,
    });
  }

  // Ordena por dia/horário pra ficar mais limpo no perfil do paciente
  result.sort((a, b) => {
    if (a.diaSemana !== b.diaSemana) return Number(a.diaSemana) - Number(b.diaSemana);
    return a.horario.localeCompare(b.horario);
  });

  return result;
};

const METODOS_MOCK: MetodoPagamento[] = ["PIX", "Dinheiro", "Cartão", "Transferência"];

const dateKey = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

/**
 * Gera pagamentos para um paciente cobrindo os últimos 12 meses até hoje.
 *
 * Taxa de pagamento escalonada por idade da sessão:
 *  - 4+ meses atrás: 100% pago (clínica em dia há tempos)
 *  - 2-3 meses atrás: 99% pago (raros atrasos antigos)
 *  - 1 mês atrás: 92% pago (~8% das sessões viram atrasadas)
 *  - mês atual: 60% pago (~40% pendentes do mês corrente)
 *
 * Sessões futuras: sem registro (aparecem como "Agendada" via lógica
 * de `generatePaymentRows`, derivada por data).
 */
const generateMockPagamentos = (
  patient: Pick<Paciente, "agendamentos" | "valorSessao" | "dataInicioTerapia">,
  seedI: number,
  today: Date
): Pagamento[] => {
  if (!patient.agendamentos?.length) return [];

  const inicio = patient.dataInicioTerapia
    ? new Date(patient.dataInicioTerapia + "T00:00:00")
    : null;

  const start = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
  start.setHours(0, 0, 0, 0);

  const result: Pagamento[] = [];
  const cursor = new Date(start);
  let step = 0;

  while (cursor.getTime() <= today.getTime()) {
    if (!inicio || cursor.getTime() >= inicio.getTime()) {
      const weekday = cursor.getDay();
      for (const a of patient.agendamentos) {
        if (Number(a.diaSemana) !== weekday) continue;
        if (!a.horario || !a.duracao) continue;

        const monthsAgo =
          (today.getFullYear() - cursor.getFullYear()) * 12 +
          (today.getMonth() - cursor.getMonth());

        let paidRatio: number;
        if (monthsAgo >= 4) paidRatio = 1.0;
        else if (monthsAgo >= 2) paidRatio = 0.99;
        else if (monthsAgo === 1) paidRatio = 0.92;
        else paidRatio = 0.6;

        const pseudoRand = ((seedI * 17 + step * 31) % 100) / 100;
        const isPaid = pseudoRand < paidRatio;
        step += 1;

        if (!isPaid) continue; // sem registro = pendente/atrasado pela lógica de payments.ts

        const pagoEm = new Date(cursor);
        pagoEm.setHours(12 + (step % 6), 0, 0, 0);

        result.push({
          id: uid(),
          data: dateKey(cursor),
          horario: a.horario,
          valor: Number(patient.valorSessao) || 0,
          status: "Pago",
          pagoEm: pagoEm.toISOString(),
          metodo: METODOS_MOCK[(seedI + step) % METODOS_MOCK.length],
        });
      }
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return result;
};

export const seedMockData = (): Paciente[] => {
  const today = new Date();
  const yearNow = today.getFullYear();
  const usedSlots = new Set<string>();

  return NOMES.map(([nome, genero], i) => {
    const idade = 22 + ((i * 7) % 38);
    const dataNascimento = `${yearNow - idade}-${pad2(((i * 5) % 12) + 1)}-${pad2(((i * 11) % 27) + 1)}`;

    const e = ENDERECOS[i % ENDERECOS.length];
    const tipoPaciente = TIPOS[i % TIPOS.length];
    const status: StatusPaciente = INATIVOS.has(i) ? "Inativo" : "Ativo";
    const modalidade = MODALIDADES[i % 3];
    const valorSessao = VALORES[i % VALORES.length];
    const indicacao = INDICACOES[i % INDICACOES.length];

    const monthsAgo = (i % 12) + 1;
    const dInicio = new Date(today.getFullYear(), today.getMonth() - monthsAgo, today.getDate());
    const dataInicioTerapia = dInicio.toISOString().slice(0, 10);

    const agendamentos =
      status === "Ativo" ? makeAgendamentos(i, modalidade, usedSlots) : [];

    const pagamentos =
      status === "Ativo"
        ? generateMockPagamentos(
            { agendamentos, valorSessao, dataInicioTerapia },
            i,
            today
          )
        : [];

    const hasContato = i % 3 === 0;
    const criadoEm = new Date(
      today.getTime() - (NOMES.length - i) * 5 * 86_400_000
    ).toISOString();

    return {
      id: uid(),
      nome,
      dataNascimento,
      cpf: genCpf(),
      genero,
      cep: e.cep,
      rua: e.rua,
      numero: String(50 + ((i * 17) % 800)),
      complemento: i % 4 === 0 ? `Apto ${100 + i * 3}` : "",
      bairro: e.bairro,
      cidade: e.cidade,
      estado: e.uf,
      celular: genPhone(),
      email: emailFromName(nome),
      contatoNome: hasContato ? CONT_NOMES[i % CONT_NOMES.length] : "",
      contatoTelefone: hasContato ? genPhone() : "",
      contatoRelacao: hasContato ? RELACOES[i % RELACOES.length] : "",
      tipoPaciente,
      status,
      dataInicioTerapia,
      valorSessao,
      indicacao,
      modalidade,
      agendamentos,
      pagamentos,
      observacoes: i % 4 === 0 ? OBS[i % OBS.length] : "",
      criadoEm,
    };
  });
};
