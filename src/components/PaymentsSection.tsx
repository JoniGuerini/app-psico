import { useMemo, useState } from "react";
import type { Paciente, Pagamento, StatusPagamento } from "../types/patient";
import { usePatients } from "../store/usePatients";
import { useToast } from "./useToast";
import {
  computeTotals,
  generatePaymentRows,
  monthRange,
  type PaymentRow,
} from "../lib/payments";
import { formatMonthYear, startOfDay } from "../lib/calendar";
import { formatCurrency, uid } from "../lib/format";
import { DIAS_SEMANA } from "../lib/constants";
import { Select } from "./Select";
import { PaymentDialog } from "./PaymentDialog";

interface PaymentsSectionProps {
  patient: Paciente;
}

type FilterStatus = "todas" | "pendentes" | "pagas";

export function PaymentsSection({ patient }: PaymentsSectionProps) {
  const { upsertPagamento, removePagamento } = usePatients();
  const { showToast } = useToast();

  const [cursor, setCursor] = useState<Date>(() => startOfDay(new Date()));
  const [filter, setFilter] = useState<FilterStatus>("todas");
  const [editing, setEditing] = useState<PaymentRow | null>(null);

  const { from, to } = useMemo(() => monthRange(cursor), [cursor]);
  const today = useMemo(() => startOfDay(new Date()), []);

  // Não mostramos sessões "futuras além do mês corrente" como pendentes
  // pra não inflar o KPI; quando o mês exibido é o atual, corta no hoje.
  const effectiveTo = useMemo(() => {
    if (
      cursor.getFullYear() === today.getFullYear() &&
      cursor.getMonth() === today.getMonth()
    ) {
      return today;
    }
    if (to.getTime() > today.getTime()) return today;
    return to;
  }, [cursor, today, to]);

  const allRows = useMemo(
    () => generatePaymentRows(patient, from, effectiveTo),
    [patient, from, effectiveTo]
  );

  const filteredRows = useMemo(() => {
    if (filter === "todas") return allRows;
    const target: StatusPagamento = filter === "pagas" ? "Pago" : "Pendente";
    return allRows.filter((r) => r.status === target);
  }, [allRows, filter]);

  const totals = useMemo(() => computeTotals(allRows), [allRows]);

  // Total acumulado de TODOS os pagamentos já registrados (não só o mês)
  const totalAcumulado = useMemo(() => {
    return (patient.pagamentos ?? [])
      .filter((p) => p.status === "Pago")
      .reduce((sum, p) => sum + p.valor, 0);
  }, [patient.pagamentos]);

  const handleQuickToggle = (row: PaymentRow) => {
    if (row.status === "Pago" && row.pagamento) {
      // Desfaz: vira pendente preservando histórico do registro
      upsertPagamento(patient.id, {
        ...row.pagamento,
        status: "Pendente",
        pagoEm: undefined,
        metodo: undefined,
      });
      showToast("Marcado como pendente.");
    } else {
      // Marca como pago com data de hoje + valor base
      const pagamento: Pagamento = {
        id: row.pagamento?.id ?? uid(),
        data: row.key.slice(0, 10),
        horario: row.horario,
        valor: row.valor,
        status: "Pago",
        pagoEm: new Date().toISOString(),
        metodo: row.pagamento?.metodo ?? "PIX",
        observacao: row.pagamento?.observacao,
      };
      upsertPagamento(patient.id, pagamento);
      showToast("Sessão marcada como paga.");
    }
  };

  const handleSaveDialog = (pagamento: Pagamento) => {
    upsertPagamento(patient.id, pagamento);
    setEditing(null);
    showToast("Pagamento salvo.");
  };

  const handleRemoveDialog = (pagamentoId: string) => {
    removePagamento(patient.id, pagamentoId);
    setEditing(null);
    showToast("Registro removido.");
  };

  const goPrevMonth = () => {
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1));
  };
  const goNextMonth = () => {
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1));
  };
  const goCurrentMonth = () => {
    setCursor(startOfDay(new Date()));
  };

  const isCurrentMonth =
    cursor.getFullYear() === today.getFullYear() &&
    cursor.getMonth() === today.getMonth();

  const monthTitle = formatMonthYear(cursor);

  return (
    <div className="payments-section">
      <div className="payments-header">
        <div>
          <h3 className="payments-title">Pagamentos</h3>
          <p className="payments-subtitle">
            Acompanhe quais sessões foram pagas e quais ainda estão pendentes.
          </p>
        </div>
      </div>

      <div className="payments-kpis">
        <div className="kpi-card kpi-pendente">
          <span className="kpi-label">Pendente em {monthTitle}</span>
          <span className="kpi-value">{formatCurrency(totals.pendente)}</span>
          <span className="kpi-meta">
            {totals.pendenteCount}{" "}
            {totals.pendenteCount === 1 ? "sessão" : "sessões"}
          </span>
        </div>
        <div className="kpi-card kpi-pago">
          <span className="kpi-label">Pago em {monthTitle}</span>
          <span className="kpi-value">{formatCurrency(totals.pagoMes)}</span>
          <span className="kpi-meta">
            {totals.pagoMesCount}{" "}
            {totals.pagoMesCount === 1 ? "sessão" : "sessões"}
          </span>
        </div>
        <div className="kpi-card kpi-total">
          <span className="kpi-label">Total acumulado</span>
          <span className="kpi-value">{formatCurrency(totalAcumulado)}</span>
          <span className="kpi-meta">desde o início do acompanhamento</span>
        </div>
      </div>

      <div className="payments-toolbar">
        <div className="month-nav">
          <button
            type="button"
            className="month-nav-btn"
            onClick={goPrevMonth}
            aria-label="Mês anterior"
          >
            ‹
          </button>
          <span className="month-nav-label">{monthTitle}</span>
          <button
            type="button"
            className="month-nav-btn"
            onClick={goNextMonth}
            aria-label="Próximo mês"
          >
            ›
          </button>
          {!isCurrentMonth && (
            <button
              type="button"
              className="month-nav-today"
              onClick={goCurrentMonth}
            >
              Hoje
            </button>
          )}
        </div>

        <Select<FilterStatus>
          value={filter}
          onChange={(v) => setFilter(v)}
          options={[
            { value: "todas", label: "Todas as sessões" },
            { value: "pendentes", label: "Somente pendentes" },
            { value: "pagas", label: "Somente pagas" },
          ]}
          ariaLabel="Filtrar pagamentos"
          className="payments-filter"
        />
      </div>

      {filteredRows.length === 0 ? (
        <div className="payments-empty">
          {allRows.length === 0
            ? "Sem sessões previstas neste mês."
            : "Nenhuma sessão corresponde ao filtro selecionado."}
        </div>
      ) : (
        <ul className="payments-list">
          {filteredRows.map((row) => {
            const dia = DIAS_SEMANA.find((d) => d.val === row.date.getDay());
            const dataLabel = `${String(row.date.getDate()).padStart(2, "0")}/${String(
              row.date.getMonth() + 1
            ).padStart(2, "0")}`;
            const paid = row.status === "Pago";
            return (
              <li
                key={row.key}
                className={"payment-row" + (paid ? " is-paid" : " is-pending")}
              >
                <div className="payment-date">
                  <span className="payment-date-dm">{dataLabel}</span>
                  <span className="payment-date-dw">{dia?.short}</span>
                </div>
                <div className="payment-time">{row.horario}</div>
                <div className="payment-value">
                  {formatCurrency(row.valor)}
                </div>
                <div className="payment-status">
                  <span className={"payment-badge " + (paid ? "paid" : "pending")}>
                    {row.status}
                  </span>
                  {paid && row.pagamento?.metodo && (
                    <span className="payment-method">
                      {row.pagamento.metodo}
                    </span>
                  )}
                </div>
                <div className="payment-actions">
                  <button
                    type="button"
                    className={
                      "btn btn-sm " +
                      (paid ? "btn-secondary" : "btn-accent")
                    }
                    onClick={() => handleQuickToggle(row)}
                  >
                    {paid ? "Desfazer" : "Marcar pago"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-ghost"
                    onClick={() => setEditing(row)}
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
        patientName={patient.nome}
        row={editing}
        onClose={() => setEditing(null)}
        onSave={handleSaveDialog}
        onRemove={handleRemoveDialog}
      />
    </div>
  );
}
