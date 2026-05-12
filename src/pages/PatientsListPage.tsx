import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePatients } from "../store/usePatients";
import { useToast } from "../components/useToast";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { Select } from "../components/Select";
import {
  calcAge,
  formatCurrency,
  initials,
  modalidadeClass,
} from "../lib/format";

export function PatientsListPage() {
  const { patients, remove } = usePatients();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterTipo, setFilterTipo] = useState("");
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    let list = patients.slice().sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
    if (q) {
      list = list.filter(
        (p) =>
          p.nome.toLowerCase().includes(q) ||
          p.cpf.includes(q) ||
          (p.email || "").toLowerCase().includes(q)
      );
    }
    if (filterStatus) list = list.filter((p) => p.status === filterStatus);
    if (filterTipo) list = list.filter((p) => p.tipoPaciente === filterTipo);
    return list;
  }, [patients, search, filterStatus, filterTipo]);

  const ativos = patients.filter((p) => p.status === "Ativo").length;
  const inativos = patients.filter((p) => p.status === "Inativo").length;

  const pendingPatient = pendingDelete
    ? patients.find((p) => p.id === pendingDelete)
    : undefined;

  const confirmDelete = () => {
    if (!pendingDelete) return;
    remove(pendingDelete);
    setPendingDelete(null);
    showToast("Paciente excluído.");
  };

  const isFiltering = !!(search || filterStatus || filterTipo);

  return (
    <>
      <div className="stats">
        <div className="stat-card">
          <div className="label">Total de pacientes</div>
          <div className="value">{patients.length}</div>
        </div>
        <div className="stat-card green">
          <div className="label">Ativos</div>
          <div className="value">{ativos}</div>
        </div>
        <div className="stat-card">
          <div className="label">Inativos</div>
          <div className="value">{inativos}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-header-text">
            <h2>Pacientes Cadastrados</h2>
            <p>Busque, edite ou remova pacientes da base local.</p>
          </div>
          <div className="card-header-actions">
            <button
              type="button"
              className="btn btn-primary btn-icon"
              onClick={() => navigate("/pacientes/novo")}
            >
              + Novo paciente
            </button>
          </div>
        </div>

        <div className="toolbar">
          <div className="search-input">
            <input
              type="text"
              placeholder="Buscar por nome, CPF ou e-mail…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="toolbar-select">
            <Select<string>
              value={filterStatus}
              onChange={setFilterStatus}
              ariaLabel="Filtrar por status"
              options={[
                { value: "", label: "Todos os status" },
                { value: "Ativo", label: "Apenas ativos" },
                { value: "Inativo", label: "Apenas inativos" },
              ]}
            />
          </div>
          <div className="toolbar-select">
            <Select<string>
              value={filterTipo}
              onChange={setFilterTipo}
              ariaLabel="Filtrar por tipo"
              options={[
                { value: "", label: "Todos os tipos" },
                { value: "Primeira entrevista", label: "Primeira entrevista" },
                { value: "Recorrente", label: "Recorrente" },
              ]}
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">📋</div>
            {patients.length === 0 ? (
              <>
                <h3>Nenhum paciente cadastrado</h3>
                <p>Cadastre seu primeiro paciente na aba "Novo Paciente".</p>
              </>
            ) : (
              <>
                <h3>Nenhum resultado</h3>
                <p>
                  {isFiltering
                    ? "Ajuste a busca ou os filtros para encontrar pacientes."
                    : "Sem pacientes para exibir."}
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="patient-list">
            {filtered.map((p) => {
              const age = calcAge(p.dataNascimento);
              const valorTxt =
                p.valorSessao != null && (p.valorSessao as number | string) !== ""
                  ? formatCurrency(p.valorSessao)
                  : null;
              const isInactive = p.status === "Inativo";

              return (
                <div
                  key={p.id}
                  className={"patient-card" + (isInactive ? " is-inactive" : "")}
                  onClick={() => navigate(`/pacientes/${p.id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      navigate(`/pacientes/${p.id}`);
                    }
                  }}
                >
                  <div className="avatar">{initials(p.nome)}</div>
                  <div className="patient-info">
                    <div className="patient-name-row">
                      <span className="patient-name">{p.nome}</span>
                      <span className={"status-dot" + (isInactive ? " is-inactive" : "")}>
                        {p.status}
                      </span>
                    </div>
                    <div className="patient-meta">
                      {p.modalidade && (
                        <>
                          <span className={`mod-tag ${modalidadeClass(p.modalidade)}`}>
                            {p.modalidade}
                          </span>
                          <span className="meta-sep">·</span>
                        </>
                      )}
                      <span>{p.tipoPaciente}</span>
                      {age !== null && (
                        <>
                          <span className="meta-sep">·</span>
                          <span>{age} anos</span>
                        </>
                      )}
                      {valorTxt && (
                        <>
                          <span className="meta-sep">·</span>
                          <span className="meta-value">{valorTxt}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="patient-actions">
                    <button
                      type="button"
                      className="icon-btn"
                      title="Editar"
                      aria-label="Editar"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/pacientes/${p.id}/editar`);
                      }}
                    >
                      ✎
                    </button>
                    <button
                      type="button"
                      className="icon-btn danger"
                      title="Excluir"
                      aria-label="Excluir"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPendingDelete(p.id);
                      }}
                    >
                      ×
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!pendingDelete}
        message={
          pendingPatient
            ? `Tem certeza que deseja excluir ${pendingPatient.nome}? Esta ação não pode ser desfeita.`
            : "Tem certeza que deseja excluir este paciente? Esta ação não pode ser desfeita."
        }
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  );
}
