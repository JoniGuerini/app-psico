import { useMemo, useRef, useState } from "react";
import type { Paciente } from "../types/patient";
import type { SessionInstance } from "../lib/calendar";
import {
  addDays,
  isSameDay,
  sessionsForDate,
  startOfDay,
  startOfWeekMonday,
} from "../lib/calendar";
import { DayTooltip } from "./DayTooltip";

const WEEKDAY_LABELS_SUN = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

const HOVER_DELAY_MS = 180;

interface MonthViewProps {
  patients: Paciente[];
  cursor: Date;
  onSelectDate: (date: Date) => void;
}

/**
 * Retorna 42 datas (6 semanas x 7 dias), começando no DOMINGO da semana
 * que contém o dia 1 do mês.
 */
function monthMatrixSundayStart(year: number, month: number): Date[] {
  const firstOfMonth = new Date(year, month, 1);
  const mondayStart = startOfWeekMonday(firstOfMonth);
  const start = startOfDay(addDays(mondayStart, -1));
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

interface HoverInfo {
  date: Date;
  sessions: SessionInstance[];
  anchorRect: DOMRect;
}

export function MonthView({ patients, cursor, onSelectDate }: MonthViewProps) {
  const today = useMemo(() => startOfDay(new Date()), []);
  const cells = useMemo(
    () => monthMatrixSundayStart(cursor.getFullYear(), cursor.getMonth()),
    [cursor]
  );

  // Pre-computa sessões por dia (usado pra contagem + tooltip)
  const sessionsByDay = useMemo(
    () => cells.map((d) => sessionsForDate(patients, d)),
    [cells, patients]
  );

  const [hover, setHover] = useState<HoverInfo | null>(null);
  const showTimerRef = useRef<number | null>(null);

  const cancelShowTimer = () => {
    if (showTimerRef.current != null) {
      window.clearTimeout(showTimerRef.current);
      showTimerRef.current = null;
    }
  };

  const openHover = (date: Date, sessions: SessionInstance[], el: HTMLElement) => {
    if (sessions.length === 0) return;
    cancelShowTimer();
    showTimerRef.current = window.setTimeout(() => {
      const rect = el.getBoundingClientRect();
      setHover({ date, sessions, anchorRect: rect });
    }, HOVER_DELAY_MS);
  };

  const closeHover = () => {
    cancelShowTimer();
    setHover(null);
  };

  return (
    <div className="month-card-v2">
      <div className="month-grid-v2">
        {WEEKDAY_LABELS_SUN.map((w) => (
          <div key={w} className="month-weekday-v2">
            {w}
          </div>
        ))}

        {cells.map((d, i) => {
          const isOut = d.getMonth() !== cursor.getMonth();
          const isToday = isSameDay(d, today);
          const sessions = sessionsByDay[i];
          const count = sessions.length;
          const cls = ["month-day-v2"];
          if (isOut) cls.push("out-of-month");
          if (isToday) cls.push("is-today");
          if (count > 0) cls.push("has-sessions");

          return (
            <button
              key={d.toISOString()}
              type="button"
              className={cls.join(" ")}
              onClick={() => onSelectDate(d)}
              onMouseEnter={(e) => openHover(d, sessions, e.currentTarget)}
              onMouseLeave={closeHover}
              onFocus={(e) => openHover(d, sessions, e.currentTarget)}
              onBlur={closeHover}
              aria-label={`${d.getDate()} de ${d.toLocaleDateString("pt-BR", {
                month: "long",
              })}${
                count > 0
                  ? `, ${count} ${count === 1 ? "sessão" : "sessões"}`
                  : ""
              }`}
            >
              <span className="day-num-v2">{d.getDate()}</span>
              {count > 0 && (
                <span className="day-count">
                  <span className="day-count-num">{count}</span>
                </span>
              )}
            </button>
          );
        })}
      </div>

      {hover && (
        <DayTooltip
          date={hover.date}
          sessions={hover.sessions}
          anchorRect={hover.anchorRect}
        />
      )}
    </div>
  );
}
