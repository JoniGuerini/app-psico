import { useState } from "react";
import { usePatients } from "../store/usePatients";
import { MonthView } from "../components/MonthView";
import { WeekView } from "../components/WeekView";
import { DayView } from "../components/DayView";
import {
  addDays,
  addMonths,
  formatLongDate,
  formatMonthYear,
  formatWeekRange,
  startOfDay,
  weekDaysMonday,
} from "../lib/calendar";

type ViewMode = "day" | "week" | "month";

const VIEW_LABELS: Record<ViewMode, string> = {
  day: "Dia",
  week: "Semana",
  month: "Mês",
};

export function CalendarPage() {
  const { patients } = usePatients();

  const today = startOfDay(new Date());
  const [view, setView] = useState<ViewMode>("month");
  const [cursor, setCursor] = useState<Date>(today);

  const goToday = () => setCursor(startOfDay(new Date()));

  const prev = () => {
    if (view === "month") setCursor(addMonths(cursor, -1));
    else if (view === "week") setCursor(addDays(cursor, -7));
    else setCursor(addDays(cursor, -1));
  };

  const next = () => {
    if (view === "month") setCursor(addMonths(cursor, 1));
    else if (view === "week") setCursor(addDays(cursor, 7));
    else setCursor(addDays(cursor, 1));
  };

  const handleSelectDateFromMonth = (date: Date) => {
    setCursor(date);
    setView("day");
  };

  const handleSelectDateFromWeek = (date: Date) => {
    setCursor(date);
    setView("day");
  };

  // Título contextual mostrado na toolbar
  const title = (() => {
    if (view === "month") {
      const mes = formatMonthYear(cursor).split(" ")[0];
      return `${mes} de ${cursor.getFullYear()}`;
    }
    if (view === "week") {
      const [first, , , , , , last] = weekDaysMonday(cursor);
      return formatWeekRange(first, last);
    }
    return formatLongDate(cursor).replace(/^./, (c) => c.toUpperCase());
  })();

  return (
    <>
      <section className="page-hero">
        <div className="page-eyebrow">Agenda</div>
        <h1 className="page-title">Sessões</h1>
        <p className="page-subtitle">
          Visualize e organize seus atendimentos por dia, semana ou mês.
        </p>
      </section>

      <div className="agenda-toolbar-v2">
        <div className="agenda-toolbar-left">
          <div className="nav-controls compact">
            <button
              type="button"
              className="nav-btn"
              onClick={prev}
              aria-label="Anterior"
            >
              ‹
            </button>
            <button
              type="button"
              className="nav-btn"
              onClick={next}
              aria-label="Próximo"
            >
              ›
            </button>
          </div>
          <button type="button" className="agenda-today-btn" onClick={goToday}>
            Hoje
          </button>
          <h1 className="agenda-toolbar-title">{title}</h1>
        </div>

        <div className="agenda-toolbar-right">
          <div
            className="view-switcher-v2"
            role="tablist"
            aria-label="Modo de visualização"
          >
            {(Object.keys(VIEW_LABELS) as ViewMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                role="tab"
                aria-selected={view === mode}
                className={view === mode ? "active" : ""}
                onClick={() => setView(mode)}
              >
                {VIEW_LABELS[mode]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {view === "month" && (
        <MonthView
          patients={patients}
          cursor={cursor}
          onSelectDate={handleSelectDateFromMonth}
        />
      )}

      {view === "week" && (
        <WeekView
          patients={patients}
          cursor={cursor}
          onSelectDate={handleSelectDateFromWeek}
        />
      )}

      {view === "day" && <DayView patients={patients} cursor={cursor} />}
    </>
  );
}
