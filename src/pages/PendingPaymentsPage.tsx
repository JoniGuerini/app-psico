import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePatients } from "../store/usePatients";
import { useToast } from "../components/useToast";
import {
  collectPendingPayments,
  monthRange,
  type PendingEntry,
} from "../lib/payments";
import { startOfDay } from "../lib/calendar";
import { formatCurrency, initials, uid } from "../lib/format";
import { DIAS_SEMANA } from "../lib/constants";
import { Select } from "../components/Select";
import { PaymentDialog } from "../components/PaymentDialog";
import type { Pagamento } from "../types/patient";

type Periodo = "mes" | "3meses" | "tudo";

export function PendingPaymentsPage() {
  const navigate = useNavigate();
  const { patients, upsertPagamento, removePagamento } = usePatients();
  const { showToast } = useToast();

  const [periodo, setPeriodo] = useState<Periodo>("mes");
  const [editing, setEditing] = useState<PendingEntry | null>(null);

  const range = useMemo(() => {
    const today = startOfDay(new Date());
    if (periodo === "mes") {
      const { from } = monthRange(today);
      return { from, to: today };
    }
    if (periodo === "3meses") {
      const from = new Date(today.getFullYear(), today.getMonth() - 2, 1);
      return { from: startOfDay(from), to: today };
    }
    // tudo — pega desde 24 meses atrás (limite prático)
    const from = new Date(today.getFullYear() - 2, today.getMonth(), 1);
    return { from: startOfDay(from), to: today };
  }, [periodo]);

  const pending = useMemo(
    () => collectPendingPayments(patients, range.from, range.to),
    [patients, range]
  );

  const totalValor = pending.reduce((sum, p) => sum + p.row.valor, 0);

  const handleMarkPaid = (entry: PendingEntry) => {
    const pagamento: Pagamento = {
      id: entry.row.pagamento?.id ?? uid(),
      data: entry.row.key.slice(0, 10),
      horario: entry.row.horario,
      valor: entry.row.valor,
      status: "Pago",
      pagoEm: new Date().toISOString(),
      metodo: "PIX",
    };
    upsertPagamento(entry.patient.id, pagamento);
    showToast("Sessão marcada como paga.");
  };

  const handleSaveDialog = (pagamento: Pagamento) => {
    if (!editing) return;
    upsertPagamento(editing.patient.id, pagamento);
    setEditing(null);
    showToast("Pagamento salvo.");
  };

  const handleRemoveDialog = (pagamentoId: string) => {
    if (!editing) return;
    removePagamento(editing.patient.id, pagamentoId);
    setEditing(null);
    showToast("Registro removido.");
  };

  const periodLabel =
    periodo === "mes"
      ? "no mês atual"
      : periodo === "3meses"
        ? "nos últimos 3 meses"
        : "no histórico completo";

  return (
    <>
      <div className="page-hero">
        <div className="page-eyebrow">Financeiro</div>
        <h1 className="page-title">Pagamentos pendentes</h1>
        <p className="page-subtitle">
          Todas as sessões {periodLabel} que ainda não foram quitadas.
        </p>
      </div>

      <div className="pending-toolbar">
        <div className="pending-summary">
          <strong>{pending.length}</strong>
          <span>
            {pending.length === 1 ? "sessão pendente" : "sessões pendentes"}
          </span>
          <span className="dot">·</span>
          <strong>{formatCurrency(totalValor)}</strong>
          <span>a receber</span>
        </div>
        <Select<Periodo>
          value={periodo}
          onChange={(v) => setPeriodo(v)}
          options={[
            { value: "mes", label: "Mês atual" },
            { value: "3meses", label: "Últimos 3 meses" },
            { value: "tudo", label: "Histórico completo" },
          ]}
          ariaLabel="Período"
          className="pending-period"
        />
      </div>

      {pending.length === 0 ? (
        <div className="pending-empty">
          <strong>Tudo em dia!</strong>
          <span>
            Nenhuma sessão pendente {periodLabel}. Bom trabalho.
          </span>
        </div>
      ) : (
        <ul className="pending-list">
          {pending.map((entry) => {
            const dia = DIAS_SEMANA.find(
              (d) => d.val === entry.row.date.getDay()
            );
            const dataLabel = `${String(entry.row.date.getDate()).padStart(
              2,
              "0"
            )}/${String(entry.row.date.getMonth() + 1).padStart(2, "0")}/${entry.row.date.getFullYear()}`;
            return (
              <li key={`${entry.patient.id}-${entry.row.key}`} className="pending-row">
                <div className="pending-patient">
                  <button
                    type="button"
                    className="avatar avatar-link"
                    onClick={() => navigate(`/pacientes/${entry.patient.id}`)}
                    aria-label={`Abrir perfil de ${entry.patient.nome}`}
                  >
                    {initials(entry.patient.nome)}
                  </button>
                  <div className="pending-patient-info">
                    <button
                      type="button"
                      className="pending-patient-name"
                      onClick={() => navigate(`/pacientes/${entry.patient.id}`)}
                    >
                      {entry.patient.nome}
                    </button>
                    <span className="pending-patient-meta">
                      {entry.patient.tipoPaciente}
                      {entry.patient.modalidade
                        ? ` · ${entry.patient.modalidade}`
                        : ""}
                    </span>
                  </div>
                </div>

                <div className="pending-when">
                  <span className="pending-date">{dataLabel}</span>
                  <span className="pending-dw">
                    {dia?.short} · {entry.row.horario}
                  </span>
                </div>

                <div className="pending-value">
                  {formatCurrency(entry.row.valor)}
                </div>

                <div className="pending-actions">
                  <button
                    type="button"
                    className="btn btn-sm btn-accent"
                    onClick={() => handleMarkPaid(entry)}
                  >
                    Marcar pago
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-ghost"
                    onClick={() => setEditing(entry)}
                  >
                    Detalhes
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <PaymentDialog
        open={editing !== null}
        patientName={editing?.patient.nome ?? ""}
        row={editing?.row ?? null}
        onClose={() => setEditing(null)}
        onSave={handleSaveDialog}
        onRemove={handleRemoveDialog}
      />
    </>
  );
}
