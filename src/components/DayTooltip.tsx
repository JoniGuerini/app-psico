import { Fragment, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { OverlayScrollbarsComponent } from "overlayscrollbars-react";
import type { SessionInstance } from "../lib/calendar";
import { formatGap, minutesToTime, timeToMinutes } from "../lib/time";

interface DayTooltipProps {
  date: Date;
  sessions: SessionInstance[];
  anchorRect: DOMRect;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

const SAFE_PADDING = 8;
const GAP = 8;

export function DayTooltip({
  date,
  sessions,
  anchorRect,
  onMouseEnter,
  onMouseLeave,
}: DayTooltipProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; flipLeft: boolean }>(
    { top: -9999, left: -9999, flipLeft: false }
  );

  useLayoutEffect(() => {
    if (!ref.current) return;
    const tipW = ref.current.offsetWidth;
    const tipH = ref.current.offsetHeight;

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Posicionamento lateral: direita por padrão, flip pra esquerda
    // se não couber no viewport.
    let flipLeft = false;
    let left = anchorRect.right + GAP;
    if (left + tipW > vw - SAFE_PADDING) {
      left = anchorRect.left - tipW - GAP;
      flipLeft = true;
    }
    if (left < SAFE_PADDING) left = SAFE_PADDING;

    // Centraliza verticalmente em relação ao card do dia, com clamp
    // pra não vazar do viewport.
    let top = anchorRect.top + anchorRect.height / 2 - tipH / 2;
    if (top < SAFE_PADDING) top = SAFE_PADDING;
    if (top + tipH > vh - SAFE_PADDING) top = vh - tipH - SAFE_PADDING;

    setPos({ top, left, flipLeft });
  }, [anchorRect]);

  const longDate = date
    .toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    })
    .replace(/^./, (c) => c.toUpperCase());

  return createPortal(
    <div
      ref={ref}
      className={"day-tooltip" + (pos.flipLeft ? " flip-left" : "")}
      style={{ top: pos.top, left: pos.left }}
      role="tooltip"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="dt-head">
        <div className="dt-date">{longDate}</div>
        <div className="dt-count">
          {sessions.length} {sessions.length === 1 ? "sessão" : "sessões"}
        </div>
      </div>
      <OverlayScrollbarsComponent
        className="dt-list-scroller"
        options={{
          scrollbars: {
            theme: "os-theme-warm",
            autoHide: "never",
          },
        }}
        defer
      >
        <ul className="dt-list">
          {sessions.map((s, i) => {
            const fim = minutesToTime(
              timeToMinutes(s.horario) + Number(s.duracao)
            );
            const prev = sessions[i - 1];
            const gap = prev
              ? timeToMinutes(s.horario) -
                (timeToMinutes(prev.horario) + Number(prev.duracao))
              : 0;
            return (
              <Fragment key={`${s.patient.id}-${i}`}>
                {gap > 0 && (
                  <li className="dt-gap-row" aria-hidden="true">
                    <div
                      className="session-gap"
                      aria-label={`Intervalo de ${formatGap(gap)}`}
                    >
                      {formatGap(gap)}
                    </div>
                  </li>
                )}
                <li className="dt-item">
                  <span className="dt-time">
                    {s.horario}–{fim}
                  </span>
                  <span className="dt-name">{s.patient.nome}</span>
                  {s.modalidade && (
                    <span
                      className={
                        "dt-mod " +
                        (s.modalidade === "Presencial"
                          ? "mod-presencial"
                          : s.modalidade === "Remoto"
                            ? "mod-remoto"
                            : "mod-hibrido")
                      }
                    >
                      {s.modalidade}
                    </span>
                  )}
                </li>
              </Fragment>
            );
          })}
        </ul>
      </OverlayScrollbarsComponent>
    </div>,
    document.body
  );
}
