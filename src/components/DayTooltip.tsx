import { Fragment, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { SessionInstance } from "../lib/calendar";
import { formatGap, minutesToTime, timeToMinutes } from "../lib/time";

interface DayTooltipProps {
  date: Date;
  sessions: SessionInstance[];
  anchorRect: DOMRect;
}

const SAFE_PADDING = 8;
const GAP = 8;

export function DayTooltip({ date, sessions, anchorRect }: DayTooltipProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; flipUp: boolean }>({
    top: -9999,
    left: -9999,
    flipUp: false,
  });

  useLayoutEffect(() => {
    if (!ref.current) return;
    const tipW = ref.current.offsetWidth;
    const tipH = ref.current.offsetHeight;

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let flipUp = false;
    let top = anchorRect.bottom + GAP;
    if (top + tipH > vh - SAFE_PADDING) {
      top = anchorRect.top - tipH - GAP;
      flipUp = true;
    }
    if (top < SAFE_PADDING) top = SAFE_PADDING;

    let left = anchorRect.left + anchorRect.width / 2 - tipW / 2;
    if (left < SAFE_PADDING) left = SAFE_PADDING;
    if (left + tipW > vw - SAFE_PADDING) left = vw - tipW - SAFE_PADDING;

    setPos({ top, left, flipUp });
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
      className={"day-tooltip" + (pos.flipUp ? " flip-up" : "")}
      style={{ top: pos.top, left: pos.left }}
      role="tooltip"
    >
      <div className="dt-head">
        <div className="dt-date">{longDate}</div>
        <div className="dt-count">
          {sessions.length} {sessions.length === 1 ? "sessão" : "sessões"}
        </div>
      </div>
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
    </div>,
    document.body
  );
}
