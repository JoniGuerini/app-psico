import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { usePatients } from "../store/usePatients";
import { computeFinancialOverview } from "../lib/payments";
import { startOfDay } from "../lib/calendar";
import { formatCurrency, initials } from "../lib/format";
import { Select } from "../components/Select";

type ChartHover = {
  segment: "pago" | "pendente" | "atrasado" | "agendada";
  label: string;
  monthLabel: string;
  monthTotal: number;
  valor: number;
  x: number;
  y: number;
};

const SEGMENT_LABELS: Record<ChartHover["segment"], string> = {
  pago: "Pago",
  pendente: "A receber",
  atrasado: "Atrasado",
  agendada: "Agendado",
};

type Periodo = "mes" | "3meses" | "6meses" | "ano" | "12meses";

const PERIODO_LABELS: Record<Periodo, string> = {
  mes: "Mês atual",
  "3meses": "Últimos 3 meses",
  "6meses": "Últimos 6 meses",
  ano: "Ano corrente",
  "12meses": "Últimos 12 meses",
};

type TaxPreset =
  | "none"
  | "mei"
  | "simples"
  | "lucroPresumido"
  | "carneLeao15"
  | "simplesV"
  | "carneLeao275"
  | "custom";

const TAX_PRESETS: Record<
  TaxPreset,
  { label: string; rate: number | null; hint: string }
> = {
  none: {
    label: "Sem impostos",
    rate: 0,
    hint: "Não aplica nenhuma alíquota — visão bruta.",
  },
  mei: {
    label: "MEI · DAS fixo (~1% efetivo)",
    rate: 1,
    hint: "DAS mensal fixo (~R$ 80). Algumas profissões regulamentadas não podem ser MEI — confirme antes.",
  },
  simples: {
    label: "Empresa · Simples Anexo III (~6%)",
    rate: 6,
    hint: "Faixa inicial do Anexo III (serviços de saúde, educação). Sobe conforme faturamento.",
  },
  lucroPresumido: {
    label: "Empresa · Lucro Presumido (~13,33%)",
    rate: 13.33,
    hint: "Federais + ISS médio (1,6 + 1,08 + 0,65 + 3 + 5%).",
  },
  carneLeao15: {
    label: "Autônomo · Carnê-Leão (~15%)",
    rate: 15,
    hint: "Faixa intermediária do IRPF + INSS estimado.",
  },
  simplesV: {
    label: "Empresa · Simples Anexo V (~15,5%)",
    rate: 15.5,
    hint: "PJ de natureza intelectual quando o Fator R < 28%. Sobe conforme faturamento.",
  },
  carneLeao275: {
    label: "Autônomo · IRPF máx. (27,5%)",
    rate: 27.5,
    hint: "Faixa máxima do IRPF, sem deduções aplicadas.",
  },
  custom: {
    label: "Personalizada",
    rate: null,
    hint: "Defina uma alíquota efetiva manualmente.",
  },
};

const TAX_PRESET_STORAGE = "lume_tax_preset";
const TAX_CUSTOM_STORAGE = "lume_tax_custom";

export function FinancialDashboardPage() {
  const navigate = useNavigate();
  const { patients } = usePatients();
  const [periodo, setPeriodo] = useState<Periodo>("3meses");

  const [taxPreset, setTaxPreset] = useState<TaxPreset>(() => {
    if (typeof window === "undefined") return "none";
    const v = localStorage.getItem(TAX_PRESET_STORAGE);
    if (v && v in TAX_PRESETS) return v as TaxPreset;
    return "none";
  });
  const [customRate, setCustomRate] = useState<number>(() => {
    if (typeof window === "undefined") return 15;
    const raw = localStorage.getItem(TAX_CUSTOM_STORAGE);
    const n = raw ? Number(raw) : NaN;
    return Number.isFinite(n) && n >= 0 && n <= 100 ? n : 15;
  });

  useEffect(() => {
    localStorage.setItem(TAX_PRESET_STORAGE, taxPreset);
  }, [taxPreset]);
  useEffect(() => {
    localStorage.setItem(TAX_CUSTOM_STORAGE, String(customRate));
  }, [customRate]);

  const taxRate =
    taxPreset === "custom" ? customRate : TAX_PRESETS[taxPreset].rate ?? 0;

  const range = useMemo(() => {
    const today = startOfDay(new Date());
    if (periodo === "mes") {
      const from = new Date(today.getFullYear(), today.getMonth(), 1);
      const to = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      return { from: startOfDay(from), to: startOfDay(to) };
    }
    if (periodo === "ano") {
      const from = new Date(today.getFullYear(), 0, 1);
      const to = new Date(today.getFullYear(), 11, 31);
      return { from: startOfDay(from), to: startOfDay(to) };
    }
    const monthsBack =
      periodo === "3meses" ? 2 : periodo === "6meses" ? 5 : 11;
    const from = new Date(today.getFullYear(), today.getMonth() - monthsBack, 1);
    const to = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return { from: startOfDay(from), to: startOfDay(to) };
  }, [periodo]);

  const overview = useMemo(
    () => computeFinancialOverview(patients, range.from, range.to),
    [patients, range]
  );

  // Valor máximo da série pra normalizar barras do gráfico
  const maxMonthValue = useMemo(() => {
    return overview.serieMensal.reduce((max, m) => {
      const sum = m.pago + m.pendente + m.atrasado + m.agendada;
      return sum > max ? sum : max;
    }, 0);
  }, [overview.serieMensal]);

  const ativos = patients.filter((p) => p.status === "Ativo");

  const [chartHover, setChartHover] = useState<ChartHover | null>(null);

  // Taxa de inadimplência: atrasado / (recebido + pendente + atrasado)
  // (não inclui agendada, que ainda não venceu)
  const baseInadimplencia =
    overview.pagoMes + overview.pendente + overview.atrasado;
  const inadimplenciaPct =
    baseInadimplencia > 0
      ? (overview.atrasado / baseInadimplencia) * 100
      : 0;

  // Tributação: imposto incide sobre o que foi efetivamente recebido.
  // "Projetado" assume que tudo será recebido (incluindo agendado/pendente).
  const imposto = overview.pagoMes * (taxRate / 100);
  const liquido = overview.pagoMes - imposto;
  const baseProjetada =
    overview.pagoMes + overview.pendente + overview.agendada;
  const liquidoProjetado = baseProjetada * (1 - taxRate / 100);

  return (
    <>
      <div className="page-hero">
        <div className="page-eyebrow">Financeiro</div>
        <h1 className="page-title">Dashboard financeiro</h1>
        <p className="page-subtitle">
          Visão consolidada de receita, pagamentos e inadimplência.
        </p>
      </div>

      <div className="fin-toolbar">
        <div className="fin-toolbar-info">
          <strong>{ativos.length}</strong>
          <span>{ativos.length === 1 ? "paciente ativo" : "pacientes ativos"}</span>
          <span className="dot">·</span>
          <span>{PERIODO_LABELS[periodo].toLowerCase()}</span>
        </div>
        <Select<Periodo>
          value={periodo}
          onChange={(v) => setPeriodo(v)}
          options={(
            ["mes", "3meses", "6meses", "ano", "12meses"] as Periodo[]
          ).map((p) => ({ value: p, label: PERIODO_LABELS[p] }))}
          ariaLabel="Período"
          className="fin-period"
        />
      </div>

      <div className="fin-kpis">
        <div className="fin-kpi fin-kpi-previsto">
          <span className="fin-kpi-label">Receita prevista</span>
          <span className="fin-kpi-value">
            {formatCurrency(overview.total)}
          </span>
          <span className="fin-kpi-meta">
            {overview.totalCount}{" "}
            {overview.totalCount === 1 ? "sessão" : "sessões"}
          </span>
        </div>

        <div className="fin-kpi fin-kpi-recebido">
          <span className="fin-kpi-label">Recebido</span>
          <span className="fin-kpi-value">
            {formatCurrency(overview.pagoMes)}
          </span>
          <span className="fin-kpi-meta">
            {overview.pagoMesCount}{" "}
            {overview.pagoMesCount === 1 ? "sessão" : "sessões"}
          </span>
        </div>

        <div className="fin-kpi fin-kpi-pendente">
          <span className="fin-kpi-label">A receber</span>
          <span className="fin-kpi-value">
            {formatCurrency(overview.pendente)}
          </span>
          <span className="fin-kpi-meta">
            {overview.pendenteCount}{" "}
            {overview.pendenteCount === 1 ? "sessão" : "sessões"}
          </span>
        </div>

        <button
          type="button"
          className={
            "fin-kpi fin-kpi-atrasado fin-kpi-clickable" +
            (overview.atrasadoCount > 0 ? " is-active" : "")
          }
          onClick={() =>
            navigate("/pagamentos/pendentes?status=atrasado")
          }
          aria-label="Ver sessões atrasadas"
        >
          <span className="fin-kpi-label">Atrasado</span>
          <span className="fin-kpi-value">
            {formatCurrency(overview.atrasado)}
          </span>
          <span className="fin-kpi-meta">
            {overview.atrasadoCount}{" "}
            {overview.atrasadoCount === 1 ? "sessão" : "sessões"}
          </span>
        </button>

        <div className="fin-kpi fin-kpi-agendado">
          <span className="fin-kpi-label">Agendado</span>
          <span className="fin-kpi-value">
            {formatCurrency(overview.agendada)}
          </span>
          <span className="fin-kpi-meta">
            {overview.agendadaCount}{" "}
            {overview.agendadaCount === 1 ? "sessão" : "sessões"} previstas
          </span>
        </div>

        <div className="fin-kpi fin-kpi-inadimplencia">
          <span className="fin-kpi-label">Inadimplência</span>
          <span className="fin-kpi-value">
            {inadimplenciaPct.toFixed(1)}%
          </span>
          <span className="fin-kpi-meta">
            atrasado / total vencido
          </span>
        </div>
      </div>

      <section className="fin-tax">
        <header className="fin-tax-header">
          <div>
            <h2>Tributação</h2>
            <p>
              Estimativa do que sai pra impostos e do que sobra de fato.
              Valores aproximados — confirme com seu contador.
            </p>
          </div>
          <div className="fin-tax-config">
            <Select<TaxPreset>
              value={taxPreset}
              onChange={(v) => setTaxPreset(v)}
              options={(Object.keys(TAX_PRESETS) as TaxPreset[]).map((k) => ({
                value: k,
                label: TAX_PRESETS[k].label,
              }))}
              ariaLabel="Regime fiscal"
              className="fin-tax-preset"
            />
            {taxPreset === "custom" && (
              <label className="fin-tax-custom">
                <span>Alíquota</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={100}
                  step={0.1}
                  value={customRate}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    if (Number.isFinite(v) && v >= 0 && v <= 100) {
                      setCustomRate(v);
                    }
                  }}
                />
                <span className="suffix">%</span>
              </label>
            )}
          </div>
        </header>

        <div className="fin-tax-grid">
          <div className="fin-tax-card fin-tax-aliquota">
            <span className="fin-kpi-label">Alíquota aplicada</span>
            <span className="fin-kpi-value">
              {taxRate.toLocaleString("pt-BR", {
                minimumFractionDigits: taxRate % 1 === 0 ? 0 : 2,
                maximumFractionDigits: 2,
              })}
              %
            </span>
            <span className="fin-kpi-meta">{TAX_PRESETS[taxPreset].hint}</span>
          </div>

          <div className="fin-tax-card fin-tax-imposto">
            <span className="fin-kpi-label">Imposto estimado</span>
            <span className="fin-kpi-value">{formatCurrency(imposto)}</span>
            <span className="fin-kpi-meta">
              sobre {formatCurrency(overview.pagoMes)} recebidos
            </span>
          </div>

          <div className="fin-tax-card fin-tax-liquido">
            <span className="fin-kpi-label">Líquido recebido</span>
            <span className="fin-kpi-value">{formatCurrency(liquido)}</span>
            <span className="fin-kpi-meta">após impostos no período</span>
          </div>

          <div className="fin-tax-card fin-tax-projetado">
            <span className="fin-kpi-label">Líquido projetado</span>
            <span className="fin-kpi-value">
              {formatCurrency(liquidoProjetado)}
            </span>
            <span className="fin-kpi-meta">
              se receber pendentes + agendadas
            </span>
          </div>
        </div>
      </section>

      <div className="fin-grid">
        <section className="fin-section fin-chart-section">
          <header className="fin-section-header">
            <h2>Receita por mês</h2>
            <p>Pago, a receber, atrasado e agendado mês a mês.</p>
          </header>

          {overview.serieMensal.length === 0 || maxMonthValue === 0 ? (
            <div className="fin-empty">Sem dados no período selecionado.</div>
          ) : (
            <>
              <div className="fin-chart">
                {overview.serieMensal.map((m) => {
                  const total = m.pago + m.pendente + m.atrasado + m.agendada;
                  const pct = (v: number) =>
                    maxMonthValue > 0 ? (v / maxMonthValue) * 100 : 0;

                  const segments: {
                    key: ChartHover["segment"];
                    valor: number;
                    cls: string;
                  }[] = [
                    { key: "agendada", valor: m.agendada, cls: "fin-bar-agendada" },
                    { key: "atrasado", valor: m.atrasado, cls: "fin-bar-atrasado" },
                    { key: "pendente", valor: m.pendente, cls: "fin-bar-pendente" },
                    { key: "pago", valor: m.pago, cls: "fin-bar-pago" },
                  ];

                  const handleEnterOrMove = (
                    seg: typeof segments[number],
                    e: React.MouseEvent<HTMLDivElement>
                  ) => {
                    setChartHover({
                      segment: seg.key,
                      label: SEGMENT_LABELS[seg.key],
                      monthLabel: m.label,
                      monthTotal: total,
                      valor: seg.valor,
                      x: e.clientX,
                      y: e.clientY,
                    });
                  };

                  return (
                    <div className="fin-chart-col" key={`${m.year}-${m.month}`}>
                      <div className="fin-chart-bars">
                        <div className="fin-chart-stack">
                          {segments
                            .filter((s) => s.valor > 0)
                            .map((seg) => (
                              <div
                                key={seg.key}
                                className={`fin-bar ${seg.cls}`}
                                style={{ height: `${pct(seg.valor)}%` }}
                                onMouseEnter={(e) => handleEnterOrMove(seg, e)}
                                onMouseMove={(e) => handleEnterOrMove(seg, e)}
                                onMouseLeave={() => setChartHover(null)}
                              />
                            ))}
                        </div>
                      </div>
                      <div className="fin-chart-total">
                        {total > 0 ? formatCurrency(total) : "—"}
                      </div>
                      <div className="fin-chart-label">{m.label}</div>
                    </div>
                  );
                })}
              </div>

              <div className="fin-chart-legend">
                <span className="legend-item">
                  <span className="legend-swatch swatch-pago" /> Pago
                </span>
                <span className="legend-item">
                  <span className="legend-swatch swatch-pendente" /> A receber
                </span>
                <span className="legend-item">
                  <span className="legend-swatch swatch-atrasado" /> Atrasado
                </span>
                <span className="legend-item">
                  <span className="legend-swatch swatch-agendada" /> Agendado
                </span>
              </div>
            </>
          )}
        </section>

        <section className="fin-section fin-top-atrasados">
          <header className="fin-section-header">
            <h2>Top pacientes em atraso</h2>
            <p>Quem mais deve no período. Clique pra abrir o perfil.</p>
          </header>

          {overview.topAtrasados.length === 0 ? (
            <div className="fin-empty">Ninguém em atraso. Maravilha.</div>
          ) : (
            <ul className="fin-top-list">
              {overview.topAtrasados.slice(0, 6).map((it) => (
                <li key={it.patient.id} className="fin-top-row">
                  <button
                    type="button"
                    className="fin-top-button"
                    onClick={() => navigate(`/pacientes/${it.patient.id}`)}
                  >
                    <span className="avatar">{initials(it.patient.nome)}</span>
                    <span className="fin-top-info">
                      <span className="fin-top-name">{it.patient.nome}</span>
                      <span className="fin-top-meta">
                        {it.count}{" "}
                        {it.count === 1 ? "sessão atrasada" : "sessões atrasadas"}
                      </span>
                    </span>
                    <span className="fin-top-valor">
                      {formatCurrency(it.valor)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="fin-section fin-metodos">
          <header className="fin-section-header">
            <h2>Pagamentos por método</h2>
            <p>Como os pacientes vêm pagando neste período.</p>
          </header>

          {overview.porMetodo.length === 0 ? (
            <div className="fin-empty">Nenhum pagamento registrado.</div>
          ) : (
            <ul className="fin-metodo-list">
              {overview.porMetodo.map((m) => {
                const pct =
                  overview.pagoMes > 0
                    ? (m.valor / overview.pagoMes) * 100
                    : 0;
                return (
                  <li key={m.metodo} className="fin-metodo-row">
                    <div className="fin-metodo-head">
                      <span className="fin-metodo-name">{m.metodo}</span>
                      <span className="fin-metodo-valor">
                        {formatCurrency(m.valor)}
                      </span>
                    </div>
                    <div className="fin-metodo-bar">
                      <div
                        className="fin-metodo-fill"
                        style={{ width: `${pct.toFixed(1)}%` }}
                      />
                    </div>
                    <div className="fin-metodo-meta">
                      {m.count}{" "}
                      {m.count === 1 ? "pagamento" : "pagamentos"} ·{" "}
                      {pct.toFixed(1)}%
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {chartHover &&
        createPortal(
          <div
            className={`fin-chart-tooltip${
              chartHover.x > window.innerWidth - 280 ? " is-flipped" : ""
            }`}
            style={{
              left: chartHover.x,
              top: chartHover.y,
            }}
            role="tooltip"
          >
            <div className="fin-chart-tooltip-head">
              <span
                className={`legend-swatch swatch-${chartHover.segment}`}
              />
              <strong>{chartHover.label}</strong>
              <span className="fin-chart-tooltip-mes">
                {chartHover.monthLabel}
              </span>
            </div>
            <div className="fin-chart-tooltip-valor">
              {formatCurrency(chartHover.valor)}
            </div>
            <div className="fin-chart-tooltip-meta">
              {chartHover.monthTotal > 0
                ? `${((chartHover.valor / chartHover.monthTotal) * 100).toFixed(1)}% do mês`
                : ""}
              {chartHover.monthTotal > 0 ? " · " : ""}
              Total {formatCurrency(chartHover.monthTotal)}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
