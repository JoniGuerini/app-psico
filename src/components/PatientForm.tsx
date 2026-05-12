import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useToast } from "./useToast";
import { Select } from "./Select";
import { usePatients } from "../store/usePatients";
import {
  DIAS_SEMANA,
  DURACOES,
  GENERO_OPTIONS,
  INDICACAO_OPTIONS,
  MODALIDADE_OPTIONS,
  STATUS_OPTIONS,
  TIPO_PACIENTE_OPTIONS,
} from "../lib/constants";
import {
  formatCEP,
  formatCPF,
  formatCurrencyInput,
  formatPhone,
  numberToCurrencyInput,
  parseCurrency,
} from "../lib/format";
import { validateCPF, validateEmail } from "../lib/validation";
import { fetchCep } from "../lib/viacep";
import type {
  Agendamento,
  DiaSemana,
  Modalidade,
  Paciente,
  PacienteInput,
  StatusPaciente,
  TipoPaciente,
} from "../types/patient";

interface FormFields {
  nome: string;
  dataNascimento: string;
  cpf: string;
  genero: string; // pode ser uma das opções ou "__outro"
  generoOutro: string;
  cep: string;
  rua: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  celular: string;
  email: string;
  contatoNome: string;
  contatoTelefone: string;
  contatoRelacao: string;
  tipoPaciente: TipoPaciente | "";
  status: StatusPaciente;
  dataInicioTerapia: string;
  valorSessao: string;
  indicacao: string; // opção ou "__outro"
  indicacaoOutro: string;
  modalidade: Modalidade | "";
  observacoes: string;
}

const emptyForm: FormFields = {
  nome: "",
  dataNascimento: "",
  cpf: "",
  genero: "",
  generoOutro: "",
  cep: "",
  rua: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  estado: "",
  celular: "",
  email: "",
  contatoNome: "",
  contatoTelefone: "",
  contatoRelacao: "",
  tipoPaciente: "",
  status: "Ativo",
  dataInicioTerapia: "",
  valorSessao: "",
  indicacao: "",
  indicacaoOutro: "",
  modalidade: "",
  observacoes: "",
};

function fromPaciente(p: Paciente): FormFields {
  const generoIsOption = (GENERO_OPTIONS as readonly string[]).includes(p.genero);
  const indicacaoIsOption = (INDICACAO_OPTIONS as readonly string[]).includes(p.indicacao);
  return {
    nome: p.nome ?? "",
    dataNascimento: p.dataNascimento ?? "",
    cpf: p.cpf ?? "",
    genero: generoIsOption ? p.genero : "__outro",
    generoOutro: generoIsOption ? "" : p.genero ?? "",
    cep: p.cep ?? "",
    rua: p.rua ?? "",
    numero: p.numero ?? "",
    complemento: p.complemento ?? "",
    bairro: p.bairro ?? "",
    cidade: p.cidade ?? "",
    estado: p.estado ?? "",
    celular: p.celular ?? "",
    email: p.email ?? "",
    contatoNome: p.contatoNome ?? "",
    contatoTelefone: p.contatoTelefone ?? "",
    contatoRelacao: p.contatoRelacao ?? "",
    tipoPaciente: p.tipoPaciente,
    status: p.status,
    dataInicioTerapia: p.dataInicioTerapia ?? "",
    valorSessao: numberToCurrencyInput(p.valorSessao),
    indicacao: indicacaoIsOption ? p.indicacao : "__outro",
    indicacaoOutro: indicacaoIsOption ? "" : p.indicacao ?? "",
    modalidade: p.modalidade,
    observacoes: p.observacoes ?? "",
  };
}

type CepStatus = null | { state: "loading" | "success" | "error"; text: string };

interface PatientFormProps {
  mode: "create" | "edit";
  initialPatient?: Paciente;
  saveLabel?: string;
  cancelLabel?: string;
  onSaved: (p: Paciente) => void;
  onCancel: () => void;
}

export function PatientForm({
  mode,
  initialPatient,
  saveLabel,
  cancelLabel,
  onSaved,
  onCancel,
}: PatientFormProps) {
  const { patients, create, update } = usePatients();
  const { showToast } = useToast();
  const formId = useId();

  const [form, setForm] = useState<FormFields>(() =>
    initialPatient ? fromPaciente(initialPatient) : emptyForm
  );
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>(
    () => initialPatient?.agendamentos ?? []
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [cepStatus, setCepStatus] = useState<CepStatus>(null);
  const [cepFound, setCepFound] = useState(false);
  const lastCepSearched = useRef<string>(
    initialPatient?.cep?.replace(/\D/g, "").length === 8
      ? initialPatient.cep.replace(/\D/g, "")
      : ""
  );
  const cepTimer = useRef<number | null>(null);
  const numeroRef = useRef<HTMLInputElement>(null);
  const formRootRef = useRef<HTMLFormElement>(null);

  const editingId = initialPatient?.id ?? null;

  const set = <K extends keyof FormFields>(key: K, value: FormFields[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const clearError = (name: string) => {
    setErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  // ===== CEP autofill =====
  useEffect(() => () => {
    if (cepTimer.current) window.clearTimeout(cepTimer.current);
  }, []);

  const runCepLookup = async (cepDigits: string) => {
    if (cepDigits === lastCepSearched.current) return;
    lastCepSearched.current = cepDigits;
    setCepStatus({ state: "loading", text: "buscando…" });
    setCepFound(false);
    try {
      const d = await fetchCep(cepDigits);
      if (d.erro) {
        setCepStatus({ state: "error", text: "CEP não encontrado" });
        setErrors((prev) => ({ ...prev, cep: "CEP não encontrado nos Correios." }));
        return;
      }
      setForm((prev) => ({
        ...prev,
        rua: d.logradouro || prev.rua,
        bairro: d.bairro || prev.bairro,
        cidade: d.localidade || prev.cidade,
        estado: d.uf || prev.estado,
      }));
      setCepStatus({ state: "success", text: "endereço encontrado" });
      setCepFound(true);
      clearError("cep");
      setTimeout(() => numeroRef.current?.focus(), 80);
    } catch {
      setCepStatus({ state: "error", text: "sem conexão" });
    }
  };

  const handleCepChange = (raw: string) => {
    const formatted = formatCEP(raw);
    set("cep", formatted);
    const digits = formatted.replace(/\D/g, "");
    if (digits.length < 8) {
      setCepStatus(null);
      setCepFound(false);
      lastCepSearched.current = "";
      return;
    }
    if (cepTimer.current) window.clearTimeout(cepTimer.current);
    cepTimer.current = window.setTimeout(() => runCepLookup(digits), 250);
  };

  const handleCepBlur = () => {
    const digits = form.cep.replace(/\D/g, "");
    if (digits.length === 8 && digits !== lastCepSearched.current) {
      void runCepLookup(digits);
    }
  };

  // ===== Validation =====
  const validate = (): { ok: boolean; data?: PacienteInput } => {
    const next: Record<string, string> = {};

    const nome = form.nome.trim();
    if (!nome || nome.length < 3) next.nome = "Informe o nome completo.";

    if (!form.dataNascimento) {
      next.dataNascimento = "Informe a data de nascimento.";
    } else if (new Date(form.dataNascimento) > new Date()) {
      next.dataNascimento = "Data inválida.";
    }

    if (!form.genero) next.genero = "Selecione o gênero.";

    const cpfDigits = form.cpf.replace(/\D/g, "");
    if (!form.cpf) next.cpf = "Informe o CPF.";
    else if (!validateCPF(form.cpf)) next.cpf = "CPF inválido.";

    if (!form.cep || form.cep.replace(/\D/g, "").length !== 8) {
      next.cep = "CEP inválido.";
    }
    if (!form.rua.trim()) next.rua = "Informe a rua.";
    if (!form.numero.trim()) next.numero = "Informe o número.";
    if (!form.bairro.trim()) next.bairro = "Informe o bairro.";
    if (!form.cidade.trim()) next.cidade = "Informe a cidade.";
    if (!form.estado || form.estado.length !== 2) next.estado = "UF (2 letras).";

    if (!form.celular || form.celular.replace(/\D/g, "").length < 10) {
      next.celular = "Celular inválido.";
    }

    if (form.email && !validateEmail(form.email)) {
      next.email = "E-mail inválido.";
    }

    if (!form.tipoPaciente) next.tipoPaciente = "Selecione o tipo.";
    if (!form.dataInicioTerapia) next.dataInicioTerapia = "Informe a data.";
    if (!form.indicacao) next.indicacao = "Selecione a indicação.";

    const valorNum = parseCurrency(form.valorSessao);
    if (!form.valorSessao || valorNum <= 0) {
      next.valorSessao = "Informe um valor válido.";
    }

    if (!form.modalidade) next.modalidade = "Selecione a modalidade.";

    const invalidAgenda = agendamentos.find(
      (a) =>
        !a.horario ||
        a.duracao <= 0 ||
        a.diaSemana == null ||
        Number.isNaN(a.diaSemana)
    );
    if (invalidAgenda) {
      next.agendamentos = "Preencha dia, horário e duração de todos os agendamentos.";
    }

    if (!next.cpf) {
      const dup = patients.find(
        (p) => p.cpf.replace(/\D/g, "") === cpfDigits && p.id !== editingId
      );
      if (dup) next.cpf = "Já existe um paciente com este CPF.";
    }

    setErrors(next);
    if (Object.keys(next).length > 0) return { ok: false };

    const generoFinal =
      form.genero === "__outro" ? form.generoOutro.trim() || "Outro" : form.genero;
    const indicacaoFinal =
      form.indicacao === "__outro"
        ? form.indicacaoOutro.trim() || "Outro"
        : form.indicacao;

    const data: PacienteInput = {
      nome,
      dataNascimento: form.dataNascimento,
      cpf: form.cpf,
      genero: generoFinal,
      cep: form.cep,
      rua: form.rua.trim(),
      numero: form.numero.trim(),
      complemento: form.complemento.trim(),
      bairro: form.bairro.trim(),
      cidade: form.cidade.trim(),
      estado: form.estado.toUpperCase(),
      celular: form.celular,
      email: form.email.trim(),
      contatoNome: form.contatoNome.trim(),
      contatoTelefone: form.contatoTelefone,
      contatoRelacao: form.contatoRelacao.trim(),
      tipoPaciente: form.tipoPaciente as TipoPaciente,
      status: form.status,
      dataInicioTerapia: form.dataInicioTerapia,
      valorSessao: valorNum,
      indicacao: indicacaoFinal,
      modalidade: form.modalidade as Modalidade,
      agendamentos: agendamentos.map((a) => ({
        diaSemana: Number(a.diaSemana) as DiaSemana,
        horario: a.horario,
        duracao: Number(a.duracao),
      })),
      observacoes: form.observacoes.trim(),
    };
    return { ok: true, data };
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const { ok, data } = validate();
    if (!ok || !data) {
      showToast("Verifique os campos destacados.", "error");
      requestAnimationFrame(() => {
        const firstErr = formRootRef.current?.querySelector(".invalid");
        if (firstErr) firstErr.scrollIntoView({ behavior: "smooth", block: "center" });
      });
      return;
    }

    if (mode === "edit" && editingId) {
      const updated = update(editingId, data);
      if (updated) {
        showToast("Paciente atualizado com sucesso.");
        onSaved(updated);
      }
    } else {
      const novo = create(data);
      showToast("Paciente cadastrado com sucesso.");
      onSaved(novo);
    }
  };

  // ===== Agendamentos handlers =====
  const addAgendamento = () => {
    setAgendamentos((prev) => [
      ...prev,
      {
        diaSemana: 1,
        horario: "14:00",
        duracao: 50,
        modalidade: (form.modalidade as Modalidade) || undefined,
      },
    ]);
    clearError("agendamentos");
  };

  const removeAgendamento = (idx: number) => {
    setAgendamentos((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateAgendamento = <K extends keyof Agendamento>(
    idx: number,
    field: K,
    value: Agendamento[K]
  ) => {
    setAgendamentos((prev) => {
      const next = prev.slice();
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  // ===== Render helpers =====
  const fieldError = (name: string) => errors[name];
  const invalidCls = (name: string) => (errors[name] ? " invalid" : "");

  const showGeneroOutro = form.genero === "__outro";
  const showIndicacaoOutro = form.indicacao === "__outro";

  const submitText = useMemo(
    () => saveLabel || (mode === "edit" ? "Atualizar paciente" : "Salvar paciente"),
    [mode, saveLabel]
  );
  const cancelText = cancelLabel || "Limpar";

  return (
    <form
      ref={formRootRef}
      id={`patient-form-${formId}`}
      onSubmit={handleSubmit}
      noValidate
    >
      {/* Dados Pessoais */}
      <div className="form-section">
        <h3>Dados Pessoais</h3>
        <div className="form-grid">
          <div className="field col-8">
            <label htmlFor={`${formId}-nome`}>
              Nome Completo <span className="req">*</span>
            </label>
            <input
              id={`${formId}-nome`}
              type="text"
              placeholder="Nome e sobrenome"
              className={invalidCls("nome").trim()}
              value={form.nome}
              onChange={(e) => {
                set("nome", e.target.value);
                clearError("nome");
              }}
            />
            <div className="field-error">{fieldError("nome")}</div>
          </div>

          <div className="field col-4">
            <label htmlFor={`${formId}-dataNascimento`}>
              Data de Nascimento <span className="req">*</span>
            </label>
            <input
              id={`${formId}-dataNascimento`}
              type="date"
              className={invalidCls("dataNascimento").trim()}
              value={form.dataNascimento}
              onChange={(e) => {
                set("dataNascimento", e.target.value);
                clearError("dataNascimento");
              }}
            />
            <div className="field-error">{fieldError("dataNascimento")}</div>
          </div>

          <div className="field col-6">
            <label htmlFor={`${formId}-cpf`}>
              CPF <span className="req">*</span>
            </label>
            <input
              id={`${formId}-cpf`}
              type="text"
              placeholder="000.000.000-00"
              maxLength={14}
              className={invalidCls("cpf").trim()}
              value={form.cpf}
              onChange={(e) => {
                set("cpf", formatCPF(e.target.value));
                clearError("cpf");
              }}
            />
            <div className="field-error">{fieldError("cpf")}</div>
          </div>

          <div className="field col-6">
            <label htmlFor={`${formId}-genero`}>
              Gênero <span className="req">*</span>
            </label>
            <Select<string>
              id={`${formId}-genero`}
              value={form.genero}
              onChange={(v) => {
                set("genero", v);
                clearError("genero");
              }}
              invalid={!!errors.genero}
              placeholder="Selecione…"
              options={[
                ...GENERO_OPTIONS.map((g) => ({ value: g, label: g })),
                { value: "__outro", label: "Outro (especificar)" },
              ]}
            />
            <div className="field-error">{fieldError("genero")}</div>
          </div>

          {showGeneroOutro && (
            <div className="field col-12">
              <label htmlFor={`${formId}-generoOutro`}>Especifique o gênero</label>
              <input
                id={`${formId}-generoOutro`}
                type="text"
                placeholder="Digite o gênero"
                value={form.generoOutro}
                onChange={(e) => set("generoOutro", e.target.value)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Endereço */}
      <div className="form-section">
        <h3>Endereço</h3>
        <div className="form-grid">
          <div className="field col-3">
            <label htmlFor={`${formId}-cep`}>
              CEP <span className="req">*</span>
              {cepStatus && (
                <span className={`cep-status ${cepStatus.state}`}>{cepStatus.text}</span>
              )}
            </label>
            <input
              id={`${formId}-cep`}
              type="text"
              placeholder="00000-000"
              maxLength={9}
              autoComplete="postal-code"
              className={(invalidCls("cep") + (cepFound ? " cep-found" : "")).trim()}
              value={form.cep}
              onChange={(e) => {
                clearError("cep");
                handleCepChange(e.target.value);
              }}
              onBlur={handleCepBlur}
            />
            <div className="field-error">{fieldError("cep")}</div>
          </div>

          <div className="field col-9">
            <label htmlFor={`${formId}-rua`}>
              Rua / Logradouro <span className="req">*</span>
            </label>
            <input
              id={`${formId}-rua`}
              type="text"
              placeholder="Ex: Rua das Flores"
              className={invalidCls("rua").trim()}
              value={form.rua}
              onChange={(e) => {
                set("rua", e.target.value);
                clearError("rua");
              }}
            />
            <div className="field-error">{fieldError("rua")}</div>
          </div>

          <div className="field col-2">
            <label htmlFor={`${formId}-numero`}>
              Número <span className="req">*</span>
            </label>
            <input
              ref={numeroRef}
              id={`${formId}-numero`}
              type="text"
              placeholder="123"
              className={invalidCls("numero").trim()}
              value={form.numero}
              onChange={(e) => {
                set("numero", e.target.value);
                clearError("numero");
              }}
            />
            <div className="field-error">{fieldError("numero")}</div>
          </div>

          <div className="field col-4">
            <label htmlFor={`${formId}-complemento`}>Complemento</label>
            <input
              id={`${formId}-complemento`}
              type="text"
              placeholder="Apto, bloco…"
              value={form.complemento}
              onChange={(e) => set("complemento", e.target.value)}
            />
          </div>

          <div className="field col-6">
            <label htmlFor={`${formId}-bairro`}>
              Bairro <span className="req">*</span>
            </label>
            <input
              id={`${formId}-bairro`}
              type="text"
              placeholder="Bairro"
              className={invalidCls("bairro").trim()}
              value={form.bairro}
              onChange={(e) => {
                set("bairro", e.target.value);
                clearError("bairro");
              }}
            />
            <div className="field-error">{fieldError("bairro")}</div>
          </div>

          <div className="field col-9">
            <label htmlFor={`${formId}-cidade`}>
              Cidade <span className="req">*</span>
            </label>
            <input
              id={`${formId}-cidade`}
              type="text"
              placeholder="Cidade"
              className={invalidCls("cidade").trim()}
              value={form.cidade}
              onChange={(e) => {
                set("cidade", e.target.value);
                clearError("cidade");
              }}
            />
            <div className="field-error">{fieldError("cidade")}</div>
          </div>

          <div className="field col-3">
            <label htmlFor={`${formId}-estado`}>
              UF <span className="req">*</span>
            </label>
            <input
              id={`${formId}-estado`}
              type="text"
              placeholder="SP"
              maxLength={2}
              style={{ textTransform: "uppercase" }}
              className={invalidCls("estado").trim()}
              value={form.estado}
              onChange={(e) => {
                set("estado", e.target.value.toUpperCase().replace(/[^A-Z]/g, ""));
                clearError("estado");
              }}
            />
            <div className="field-error">{fieldError("estado")}</div>
          </div>
        </div>
      </div>

      {/* Contato */}
      <div className="form-section">
        <h3>Contato</h3>
        <div className="form-grid">
          <div className="field col-4">
            <label htmlFor={`${formId}-celular`}>
              Celular <span className="req">*</span>
            </label>
            <input
              id={`${formId}-celular`}
              type="tel"
              placeholder="(00) 00000-0000"
              maxLength={15}
              className={invalidCls("celular").trim()}
              value={form.celular}
              onChange={(e) => {
                set("celular", formatPhone(e.target.value));
                clearError("celular");
              }}
            />
            <div className="field-error">{fieldError("celular")}</div>
          </div>

          <div className="field col-8">
            <label htmlFor={`${formId}-email`}>E-mail</label>
            <input
              id={`${formId}-email`}
              type="email"
              placeholder="email@exemplo.com"
              className={invalidCls("email").trim()}
              value={form.email}
              onChange={(e) => {
                set("email", e.target.value);
                clearError("email");
              }}
            />
            <div className="field-error">{fieldError("email")}</div>
          </div>

          <div className="field col-5">
            <label htmlFor={`${formId}-contatoNome`}>Contato próximo · Nome</label>
            <input
              id={`${formId}-contatoNome`}
              type="text"
              placeholder="Nome do contato (opcional)"
              value={form.contatoNome}
              onChange={(e) => set("contatoNome", e.target.value)}
            />
          </div>

          <div className="field col-4">
            <label htmlFor={`${formId}-contatoTelefone`}>
              Contato próximo · Telefone
            </label>
            <input
              id={`${formId}-contatoTelefone`}
              type="tel"
              placeholder="(00) 00000-0000"
              maxLength={15}
              value={form.contatoTelefone}
              onChange={(e) => set("contatoTelefone", formatPhone(e.target.value))}
            />
          </div>

          <div className="field col-3">
            <label htmlFor={`${formId}-contatoRelacao`}>Relação</label>
            <input
              id={`${formId}-contatoRelacao`}
              type="text"
              placeholder="Mãe, irmão…"
              value={form.contatoRelacao}
              onChange={(e) => set("contatoRelacao", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Informações da Terapia */}
      <div className="form-section">
        <h3>Informações da Terapia</h3>
        <div className="form-grid">
          <div className="field col-6">
            <label>
              Tipo de paciente <span className="req">*</span>
            </label>
            <div className="radio-group">
              {TIPO_PACIENTE_OPTIONS.map((opt) => (
                <label
                  key={opt}
                  className={"radio-pill" + (form.tipoPaciente === opt ? " selected" : "")}
                >
                  <input
                    type="radio"
                    name={`${formId}-tipo`}
                    value={opt}
                    checked={form.tipoPaciente === opt}
                    onChange={() => {
                      set("tipoPaciente", opt);
                      clearError("tipoPaciente");
                    }}
                  />
                  {opt}
                </label>
              ))}
            </div>
            <div className="field-error">{fieldError("tipoPaciente")}</div>
          </div>

          <div className="field col-6">
            <label>
              Status <span className="req">*</span>
            </label>
            <div className="radio-group">
              {STATUS_OPTIONS.map((opt) => (
                <label
                  key={opt}
                  className={"radio-pill" + (form.status === opt ? " selected" : "")}
                >
                  <input
                    type="radio"
                    name={`${formId}-status`}
                    value={opt}
                    checked={form.status === opt}
                    onChange={() => set("status", opt)}
                  />
                  {opt}
                </label>
              ))}
            </div>
          </div>

          <div className="field col-4">
            <label htmlFor={`${formId}-dataInicioTerapia`}>
              Data início da terapia <span className="req">*</span>
            </label>
            <input
              id={`${formId}-dataInicioTerapia`}
              type="date"
              className={invalidCls("dataInicioTerapia").trim()}
              value={form.dataInicioTerapia}
              onChange={(e) => {
                set("dataInicioTerapia", e.target.value);
                clearError("dataInicioTerapia");
              }}
            />
            <div className="field-error">{fieldError("dataInicioTerapia")}</div>
          </div>

          <div className="field col-4">
            <label htmlFor={`${formId}-valorSessao`}>
              Valor da sessão <span className="req">*</span>
            </label>
            <div className="input-prefix">
              <span className="prefix">R$</span>
              <input
                id={`${formId}-valorSessao`}
                type="text"
                placeholder="0,00"
                inputMode="decimal"
                className={invalidCls("valorSessao").trim()}
                value={form.valorSessao}
                onChange={(e) => {
                  set("valorSessao", formatCurrencyInput(e.target.value));
                  clearError("valorSessao");
                }}
              />
            </div>
            <div className="field-error">{fieldError("valorSessao")}</div>
          </div>

          <div className="field col-4">
            <label htmlFor={`${formId}-indicacao`}>
              Indicação <span className="req">*</span>
            </label>
            <Select<string>
              id={`${formId}-indicacao`}
              value={form.indicacao}
              onChange={(v) => {
                set("indicacao", v);
                clearError("indicacao");
              }}
              invalid={!!errors.indicacao}
              placeholder="Como chegou ao tratamento?"
              options={[
                ...INDICACAO_OPTIONS.map((opt) => ({ value: opt, label: opt })),
                { value: "__outro", label: "Outro (especificar)" },
              ]}
            />
            <div className="field-error">{fieldError("indicacao")}</div>
          </div>

          {showIndicacaoOutro && (
            <div className="field col-12">
              <label htmlFor={`${formId}-indicacaoOutro`}>Especifique a indicação</label>
              <input
                id={`${formId}-indicacaoOutro`}
                type="text"
                placeholder="De onde veio a indicação?"
                value={form.indicacaoOutro}
                onChange={(e) => set("indicacaoOutro", e.target.value)}
              />
            </div>
          )}

          <div className="field col-12">
            <label>
              Modalidade de atendimento <span className="req">*</span>
            </label>
            <div className="radio-group">
              {MODALIDADE_OPTIONS.map((opt) => (
                <label
                  key={opt}
                  className={"radio-pill" + (form.modalidade === opt ? " selected" : "")}
                >
                  <input
                    type="radio"
                    name={`${formId}-modalidade`}
                    value={opt}
                    checked={form.modalidade === opt}
                    onChange={() => {
                      set("modalidade", opt);
                      clearError("modalidade");
                    }}
                  />
                  {opt}
                </label>
              ))}
            </div>
            <div className="field-error">{fieldError("modalidade")}</div>
          </div>

          <div className="field col-12">
            <label>Dias e horários de atendimento</label>
            <div className="agendamentos-list">
              {agendamentos.length === 0 ? (
                <div className="agendamento-empty">
                  Nenhum horário cadastrado. Clique em "+ Adicionar horário" para incluir
                  um atendimento recorrente.
                </div>
              ) : (
                agendamentos.map((a, idx) => (
                  <div className="agendamento-row" key={idx}>
                    <div>
                      <label>Dia da semana</label>
                      <Select<number>
                        value={a.diaSemana}
                        onChange={(v) =>
                          updateAgendamento(idx, "diaSemana", v as DiaSemana)
                        }
                        ariaLabel="Dia da semana"
                        options={DIAS_SEMANA.map((d) => ({
                          value: d.val,
                          label: d.label,
                        }))}
                      />
                    </div>
                    <div>
                      <label>Horário</label>
                      <input
                        type="time"
                        value={a.horario}
                        onChange={(e) =>
                          updateAgendamento(idx, "horario", e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <label>Duração</label>
                      <Select<number>
                        value={a.duracao}
                        onChange={(v) => updateAgendamento(idx, "duracao", v)}
                        ariaLabel="Duração"
                        options={DURACOES.map((d) => ({
                          value: d,
                          label: `${d} min`,
                        }))}
                      />
                    </div>
                    <div>
                      <label>Modalidade</label>
                      <Select<string>
                        value={a.modalidade ?? ""}
                        onChange={(v) =>
                          updateAgendamento(idx, "modalidade", v as Modalidade)
                        }
                        ariaLabel="Modalidade da sessão"
                        placeholder="Selecione…"
                        options={MODALIDADE_OPTIONS.map((m) => ({
                          value: m,
                          label: m,
                        }))}
                      />
                    </div>
                    <button
                      type="button"
                      className="remove-row"
                      onClick={() => removeAgendamento(idx)}
                    >
                      Remover
                    </button>
                  </div>
                ))
              )}
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-icon"
              onClick={addAgendamento}
            >
              + Adicionar horário
            </button>
            <div className="field-error">{fieldError("agendamentos")}</div>
          </div>

          <div className="field col-12">
            <label htmlFor={`${formId}-observacoes`}>Observações</label>
            <textarea
              id={`${formId}-observacoes`}
              rows={3}
              placeholder="Anotações adicionais (opcional)"
              value={form.observacoes}
              onChange={(e) => set("observacoes", e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          {cancelText}
        </button>
        <button type="submit" className="btn btn-primary">
          {submitText}
        </button>
      </div>
    </form>
  );
}
