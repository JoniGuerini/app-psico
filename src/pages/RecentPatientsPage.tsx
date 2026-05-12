import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { usePatients } from "../store/usePatients";
import { initials, modalidadeClass } from "../lib/format";

/**
 * Formata um ISO timestamp em "DD/MM/AAAA — há X dias".
 */
const formatRelative = (iso: string | undefined): string => {
  if (!iso) return "—";
  const created = new Date(iso);
  if (isNaN(created.getTime())) return "—";
  const date = `${String(created.getDate()).padStart(2, "0")}/${String(
    created.getMonth() + 1
  ).padStart(2, "0")}/${created.getFullYear()}`;
  const diffMs = Date.now() - created.getTime();
  const days = Math.floor(diffMs / 86_400_000);
  let relative: string;
  if (days <= 0) relative = "hoje";
  else if (days === 1) relative = "ontem";
  else if (days < 30) relative = `há ${days} dias`;
  else if (days < 365) {
    const m = Math.floor(days / 30);
    relative = m === 1 ? "há 1 mês" : `há ${m} meses`;
  } else {
    const y = Math.floor(days / 365);
    relative = y === 1 ? "há 1 ano" : `há ${y} anos`;
  }
  return `${date} · ${relative}`;
};

export function RecentPatientsPage() {
  const navigate = useNavigate();
  const { patients } = usePatients();

  const sorted = useMemo(() => {
    return patients
      .slice()
      .sort((a, b) => (b.criadoEm || "").localeCompare(a.criadoEm || ""));
  }, [patients]);

  return (
    <>
      <div className="page-hero">
        <div className="page-eyebrow">Pacientes</div>
        <h1 className="page-title">Cadastros recentes</h1>
        <p className="page-subtitle">
          Lista completa de pacientes ordenada do mais novo ao mais antigo.
        </p>
      </div>

      {sorted.length === 0 ? (
        <div className="pending-empty">
          <strong>Nenhum paciente cadastrado.</strong>
          <span>Comece adicionando seu primeiro paciente.</span>
        </div>
      ) : (
        <ul className="recent-page-list">
          {sorted.map((p) => (
            <li key={p.id} className="recent-page-row">
              <button
                type="button"
                className="recent-page-link"
                onClick={() => navigate(`/pacientes/${p.id}`)}
              >
                <div className="avatar">{initials(p.nome)}</div>
                <div className="recent-page-info">
                  <span className="recent-page-name">{p.nome}</span>
                  <span className="recent-page-meta">
                    {p.tipoPaciente}
                    {p.modalidade ? (
                      <>
                        <span className="meta-sep">·</span>
                        <span
                          className={`badge ${modalidadeClass(p.modalidade)}`}
                        >
                          {p.modalidade}
                        </span>
                      </>
                    ) : null}
                  </span>
                </div>
                <div className="recent-page-date">
                  {formatRelative(p.criadoEm)}
                </div>
                <span
                  className={`badge ${p.status === "Ativo" ? "ativo" : "inativo"}`}
                >
                  {p.status}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
