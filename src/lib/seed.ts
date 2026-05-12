import type { Paciente, DiaSemana, Modalidade, TipoPaciente, StatusPaciente } from "../types/patient";
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
const DURACOES_M = [50, 50, 50, 50, 60, 45];
const VALORES = [200, 250, 300, 350, 400, 250, 300];
const OBS = [
  "Apresenta quadro de ansiedade leve. Foco no manejo de pensamentos automáticos.",
  "Boa adesão ao tratamento. Avançando bem nas sessões.",
  "Em processo de luto. Acompanhar sintomas depressivos.",
  "Conflitos familiares relacionados ao trabalho. Trabalhar comunicação.",
  "Sessões focadas em autoestima e autocuidado.",
  "Uso de medicação supervisionada por psiquiatra parceiro.",
];
const INATIVOS = [8, 17, 22];

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

export const seedMockData = (): Paciente[] => {
  const today = new Date();
  const yearNow = today.getFullYear();

  return NOMES.map(([nome, genero], i) => {
    const idade = 22 + ((i * 7) % 38);
    const dataNascimento = `${yearNow - idade}-${pad2(((i * 5) % 12) + 1)}-${pad2(((i * 11) % 27) + 1)}`;

    const e = ENDERECOS[i % ENDERECOS.length];
    const tipoPaciente = TIPOS[i % TIPOS.length];
    const status: StatusPaciente = INATIVOS.includes(i) ? "Inativo" : "Ativo";
    const modalidade = MODALIDADES[i % 3];
    const valorSessao = VALORES[i % VALORES.length];
    const indicacao = INDICACOES[i % INDICACOES.length];

    const monthsAgo = (i % 12) + 1;
    const dInicio = new Date(today.getFullYear(), today.getMonth() - monthsAgo, today.getDate());
    const dataInicioTerapia = dInicio.toISOString().slice(0, 10);

    const agendamentos = [];
    const incluir = status === "Ativo" && (tipoPaciente === "Recorrente" || i % 2 === 0);
    if (incluir) {
      agendamentos.push({
        diaSemana: (i % 7) as DiaSemana,
        horario: HORARIOS[i % HORARIOS.length],
        duracao: DURACOES_M[i % DURACOES_M.length],
      });
      if (i % 5 === 0) {
        agendamentos.push({
          diaSemana: ((i + 3) % 7) as DiaSemana,
          horario: HORARIOS[(i + 4) % HORARIOS.length],
          duracao: 50,
        });
      }
    }

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
      observacoes: i % 4 === 0 ? OBS[i % OBS.length] : "",
      criadoEm,
    };
  });
};
