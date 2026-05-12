import { useEffect, useMemo, useState } from "react";
import type {
  MetodoPagamento,
  Pagamento,
  StatusPagamento,
} from "../types/patient";
import {
  formatCurrencyInput,
  numberToCurrencyInput,
  parseCurrency,
  uid,
} from "../lib/format";
import type { PaymentRow } from "../lib/payments";
import { dateKey } from "../lib/calendar";
import { Select } from "./Select";

interface PaymentDialogProps {
  open: boolean;
  patientName: string;
  row: PaymentRow | null;
  onClose: () => void;
  onSave: (pagamento: Pagamento) => void;
  onRemove?: (pagamentoId: string) => void;
}

const METODOS: MetodoPagamento[] = [
  "PIX",
  "Dinheiro",
  "Cartão",
  "Transferência",
  "Boleto",
  "Outro",
];

export function PaymentDialog({
  open,
  patientName,
  row,
  onClose,
  onSave,
  onRemove,
}: PaymentDialogProps) {
  const [valor, setValor] = useState("");
  const [status, setStatus] = useState<StatusPagamento>("Pago");
  const [metodo, setMetodo] = useState<MetodoPagamento>("PIX");
  const [pagoEm, setPagoEm] = useState("");
  const [observacao, setObservacao] = useState("");

  // Carrega o form a partir da row sempre que abre
  useEffect(() => {
    if (!open || !row) return;
    const p = row.pagamento;
    setValor(numberToCurrencyInput(p?.valor ?? row.valor));
    setStatus(p?.status ?? "Pago");
    setMetodo((p?.metodo as MetodoPagamento) ?? "PIX");
    setPagoEm(
      p?.pagoEm
        ? p.pagoEm.slice(0, 10)
        : dateKey(new Date())
    );
    setObservacao(p?.observacao ?? "");
  }, [open, row]);

  // ESC fecha
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const dateLabel = useMemo(() => {
    if (!row) return "";
    return row.date.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }, [row]);

  if (!open || !row) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numeric = parseCurrency(valor);
    const pagamento: Pagamento = {
      id: row.pagamento?.id ?? uid(),
      data: dateKey(row.date),
      horario: row.horario,
      valor: numeric,
      status,
      pagoEm: status === "Pago" ? new Date(pagoEm + "T12:00:00").toISOString() : undefined,
      metodo: status === "Pago" ? metodo : undefined,
      observacao: observacao.trim() || undefined,
    };
    onSave(pagamento);
  };

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-dialog-title"
    >
      <form className="modal modal-payment" onSubmit={handleSubmit}>
        <h3 id="payment-dialog-title">Registrar pagamento</h3>
        <p className="payment-subtitle">
          <strong>{patientName}</strong>
          <br />
          {dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1)} ·{" "}
          {row.horario}
        </p>

        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="pay-status">Status</label>
            <Select<StatusPagamento>
              id="pay-status"
              value={status}
              onChange={(v) => setStatus(v)}
              options={[
                { value: "Pago", label: "Pago" },
                { value: "Pendente", label: "Pendente" },
              ]}
            />
          </div>

          <div className="form-field">
            <label htmlFor="pay-valor">Valor (R$)</label>
            <input
              id="pay-valor"
              type="text"
              inputMode="numeric"
              value={valor}
              onChange={(e) => setValor(formatCurrencyInput(e.target.value))}
              placeholder="0,00"
            />
          </div>

          {status === "Pago" && (
            <>
              <div className="form-field">
                <label htmlFor="pay-metodo">Método</label>
                <Select<MetodoPagamento>
                  id="pay-metodo"
                  value={metodo}
                  onChange={(v) => setMetodo(v)}
                  options={METODOS.map((m) => ({ value: m, label: m }))}
                />
              </div>
              <div className="form-field">
                <label htmlFor="pay-data">Data do pagamento</label>
                <input
                  id="pay-data"
                  type="date"
                  value={pagoEm}
                  onChange={(e) => setPagoEm(e.target.value)}
                />
              </div>
            </>
          )}

          <div className="form-field full">
            <label htmlFor="pay-obs">Observação</label>
            <textarea
              id="pay-obs"
              rows={2}
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Opcional (ex.: pagou metade adiantado, comprovante #123…)"
            />
          </div>
        </div>

        <div className="modal-actions modal-payment-actions">
          {row.pagamento && onRemove && (
            <button
              type="button"
              className="btn btn-danger-light"
              onClick={() => {
                onRemove(row.pagamento!.id);
              }}
            >
              Remover registro
            </button>
          )}
          <div className="spacer" />
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-accent">
            Salvar
          </button>
        </div>
      </form>
    </div>
  );
}
