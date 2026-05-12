import { useEffect } from "react";
import { useMatch, useNavigate, useParams } from "react-router-dom";
import type { ReactNode } from "react";
import { usePatients } from "../store/usePatients";
import { useToast } from "../components/useToast";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { PatientForm } from "../components/PatientForm";
import {
  calcAge,
  formatCurrency,
  formatDateBR,
  initials,
  modalidadeClass,
} from "../lib/format";
import { DIAS_SEMANA } from "../lib/constants";
import { minutesToTime, timeToMinutes } from "../lib/time";
import { useState } from "react";

interface InfoRowProps {
  label: string;
  value?: ReactNode;
  highlight?: boolean;
  currency?: boolean;
}

function InfoRow({ label, value, highlight, currency }: InfoRowProps) {
  const isEmpty =
    value == null ||
    value === "" ||
    value === "—" ||
    (typeof value === "string" && value.trim() === "");
  const cls = ["info-value"];
  if (isEmpty) cls.push("empty");
  if (highlight) cls.push("highlight");
  if (currency) cls.push("currency");
  return (
    <div className="info-row">
      <span className="info-label">{label}</span>
      <span className={cls.join(" ")}>{isEmpty ? "Não informado" : value}</span>
    </div>
  );
}

export function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getById, toggleStatus, remove } = usePatients();
  const { showToast } = useToast();

  const editMatch = useMatch("/pacientes/:id/editar");
  const isEditing = !!editMatch;

  const [pendingDelete, setPendingDelete] = useState(false);

  const patient = id ? getById(id) : undefined;

  useEffect(() => {
    if (!patient && id) {
      showToast("Paciente não encontrado.", "error");
      navigate("/pacientes", { replace: true });
    }
  }, [patient, id, navigate, showToast]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [isEditing]);

  if (!patient) return null;

  const age = calcAge(patient.dataNascimento);

  const handleToggleStatus = () => {
    const novoStatus = toggleStatus(patient.id);
    if (novoStatus) {
      showToast(`Paciente marcado como ${novoStatus}.`);
    }
  };

  const handleDelete = () => {
    remove(patient.id);
    setPendingDelete(false);
    showToast("Paciente excluído.");
    navigate("/pacientes");
  };

  if (isEditing) {
    return (
      <>
        <div className="profile-header">
          <div className="profile-avatar">{initials(patient.nome)}</div>
          <div className="profile-identity">
            <h2>{patient.nome}</h2>
            <div className="profile-tags">
              <span
                className={`badge ${patient.status === "Ativo" ? "ativo" : "inativo"}`}
              >
                {patient.status}
              </span>
              <span className="badge tipo">{patient.tipoPaciente}</span>
              {age !== null && <span>{age} anos</span>}
              <span>· {patient.cpf}</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2
              style={{
                fontFamily: "Fraunces, serif",
                fontWeight: 500,
                fontSize: 22,
                color: "var(--azul-escuro)",
              }}
            >
              Editando dados
            </h2>
            <p style={{ fontSize: 14, color: "var(--texto-suave)", marginTop: 4 }}>
              Faça as alterações necessárias e clique em "Salvar alterações".
            </p>
          </div>
          <PatientForm
            mode="edit"
            initialPatient={patient}
            saveLabel="Salvar alterações"
            cancelLabel="Cancelar edição"
            onSaved={() => navigate(`/pacientes/${patient.id}`)}
            onCancel={() => navigate(`/pacientes/${patient.id}`)}
          />
        </div>
      </>
    );
  }

  const sortedAgenda = (patient.agendamentos ?? []).slice().sort((a, b) => {
    const diff = Number(a.diaSemana) - Number(b.diaSemana);
    if (diff !== 0) return diff;
    return timeToMinutes(a.horario) - timeToMinutes(b.horario);
  });

  return (
    <>
      <button type="button" className="back-btn" onClick={() => navigate("/pacientes")}>
        Voltar para lista
      </button>

      <div className="profile-header">
        <div className="profile-avatar">{initials(patient.nome)}</div>
        <div className="profile-identity">
          <h2>{patient.nome}</h2>
          <div className="profile-tags">
            <span className={`badge ${patient.status === "Ativo" ? "ativo" : "inativo"}`}>
              {patient.status}
            </span>
            <span className="badge tipo">{patient.tipoPaciente}</span>
            {age !== null && <span>{age} anos</span>}
            <span>· {patient.cpf}</span>
          </div>
        </div>
        <div className="profile-actions">
          <button type="button" className="btn btn-icon" onClick={handleToggleStatus}>
            {patient.status === "Ativo" ? "Desativar paciente" : "Reativar paciente"}
          </button>
          <button
            type="button"
            className="btn btn-accent btn-icon"
            onClick={() => navigate(`/pacientes/${patient.id}/editar`)}
          >
            Editar dados
          </button>
          <button
            type="button"
            className="btn btn-danger-light btn-icon"
            onClick={() => setPendingDelete(true)}
          >
            Excluir
          </button>
        </div>
      </div>

      <div className="profile-grid">
        <div className="profile-section">
          <h3>Dados Pessoais</h3>
          <InfoRow label="Nome" value={patient.nome} />
          <InfoRow label="CPF" value={patient.cpf} />
          <InfoRow
            label="Nascimento"
            value={
              <>
                {formatDateBR(patient.dataNascimento)}
                {age !== null && (
                  <span style={{ color: "var(--texto-suave)" }}> · {age} anos</span>
                )}
              </>
            }
          />
          <InfoRow label="Gênero" value={patient.genero} />
        </div>

        <div className="profile-section">
          <h3>Informações da Terapia</h3>
          <InfoRow label="Tipo" value={patient.tipoPaciente} />
          <InfoRow label="Início" value={formatDateBR(patient.dataInicioTerapia)} />
          <InfoRow
            label="Status"
            value={
              <span
                className={`badge ${patient.status === "Ativo" ? "ativo" : "inativo"}`}
              >
                {patient.status}
              </span>
            }
          />
          <InfoRow label="Indicação" value={patient.indicacao} />
          <InfoRow
            label="Valor da sessão"
            value={
              patient.valorSessao != null && (patient.valorSessao as number | string) !== ""
                ? formatCurrency(patient.valorSessao)
                : ""
            }
            currency
          />
        </div>

        <div className="profile-section">
          <h3>Modalidade & Agenda</h3>
          <InfoRow
            label="Modalidade"
            value={
              patient.modalidade ? (
                <span className={`badge ${modalidadeClass(patient.modalidade)}`}>
                  {patient.modalidade}
                </span>
              ) : (
                ""
              )
            }
          />
          <div className="info-row">
            <span className="info-label">Horários</span>
            <div>
              {sortedAgenda.length === 0 ? (
                <div className="profile-agenda-empty">Nenhum horário cadastrado.</div>
              ) : (
                <div className="profile-agenda-list">
                  {sortedAgenda.map((a, i) => {
                    const dia = DIAS_SEMANA.find((d) => d.val === Number(a.diaSemana));
                    const fim = minutesToTime(
                      timeToMinutes(a.horario) + Number(a.duracao)
                    );
                    return (
                      <div key={i} className="profile-agenda-item">
                        <strong>{dia ? dia.short : "?"}</strong>
                        <span>
                          {a.horario} – {fim}
                        </span>
                        <span className="pa-duration">{a.duracao} min</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="profile-section">
          <h3>Endereço</h3>
          <InfoRow label="CEP" value={patient.cep} />
          <InfoRow
            label="Logradouro"
            value={
              <>
                {patient.rua}, {patient.numero}
                {patient.complemento && (
                  <span style={{ color: "var(--texto-suave)" }}>
                    {" "}
                    — {patient.complemento}
                  </span>
                )}
              </>
            }
          />
          <InfoRow label="Bairro" value={patient.bairro} />
          <InfoRow label="Cidade" value={`${patient.cidade}/${patient.estado}`} />
        </div>

        <div className="profile-section">
          <h3>Contato</h3>
          <InfoRow label="Celular" value={patient.celular} highlight />
          <InfoRow label="E-mail" value={patient.email} />
          <InfoRow
            label="Contato próximo"
            value={
              patient.contatoNome ? (
                <>
                  {patient.contatoNome}
                  {patient.contatoRelacao && (
                    <span style={{ color: "var(--texto-suave)" }}>
                      {" "}
                      ({patient.contatoRelacao})
                    </span>
                  )}
                  {patient.contatoTelefone && (
                    <>
                      <br />
                      <span style={{ color: "var(--texto-suave)", fontSize: 13 }}>
                        {patient.contatoTelefone}
                      </span>
                    </>
                  )}
                </>
              ) : (
                ""
              )
            }
          />
        </div>

        {patient.observacoes && patient.observacoes.trim() && (
          <div className="profile-section full">
            <h3>Observações</h3>
            <div
              style={{
                fontSize: 14,
                color: "var(--texto)",
                lineHeight: 1.7,
                whiteSpace: "pre-wrap",
              }}
            >
              {patient.observacoes}
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={pendingDelete}
        message={`Tem certeza que deseja excluir ${patient.nome}? Esta ação não pode ser desfeita.`}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(false)}
      />
    </>
  );
}
