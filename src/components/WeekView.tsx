import { Fragment, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import type { Paciente } from "../types/patient";
import { formatGap, minutesToTime, timeToMinutes } from "../lib/time";
import { modalidadeClass } from "../lib/format";
import {
  isSameDay,
  sessionsForDate,
  startOfDay,
  weekDaysMonday,
} from "../lib/calendar";

const WEEKDAY_LABELS = ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"];

interface WeekViewProps {
  patients: Paciente[];
  cursor: Date;
  onSelectDate: (date: Date) => void;
}

export function WeekView({ patients, cursor, onSelectDate }: WeekViewProps) {
  const navigate = useNavigate();
  const today = useMemo(() => startOfDay(new Date()), []);
  const days = useMemo(() => weekDaysMonday(cursor), [cursor]);

  // Pre-computa sessões por dia
  const sessionsByDay = useMemo(
    () => days.map((d) => sessionsForDate(patients, d)),
    [days, patients]
  );

  return (
    <div className="week-board">
      {days.map((d, idx) => {
        const isToday = isSameDay(d, today);
        const isWeekend = idx >= 5;
        const sessoes = sessionsByDay[idx];
        return (
          <div
            key={d.toISOString()}
            className={
              "week-col" +
              (isToday ? " is-today" : "") +
              (isWeekend ? " is-weekend" : "")
            }
          >
            <button
              type="button"
              className="week-col-head"
              onClick={() => onSelectDate(d)}
              aria-label={`Abrir ${d.toLocaleDateString("pt-BR", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}`}
            >
              <div className="wc-weekday">{WEEKDAY_LABELS[idx]}</div>
              <div className="wc-num">{d.getDate()}</div>
              <div className="wc-count">
                {sessoes.length === 0
                  ? "sem sessões"
                  : `${sessoes.length} ${sessoes.length === 1 ? "sessão" : "sessões"}`}
              </div>
            </button>

            <div className="week-col-body">
              {sessoes.length === 0 ? (
                <div className="week-col-empty">—</div>
              ) : (
                sessoes.map((ev, i) => {
                  const fim = minutesToTime(
                    timeToMinutes(ev.horario) + Number(ev.duracao)
                  );
                  const prev = sessoes[i - 1];
                  const gap = prev
                    ? timeToMinutes(ev.horario) -
                      (timeToMinutes(prev.horario) + Number(prev.duracao))
                    : 0;
                  return (
                    <Fragment key={`${ev.patient.id}-${i}`}>
                      {gap > 0 && (
                        <div
                          className="session-gap"
                          aria-label={`Intervalo de ${formatGap(gap)}`}
                        >
                          {formatGap(gap)}
                        </div>
                      )}
                      <button
                        type="button"
                        className={
                          `week-mini-card ${modalidadeClass(ev.modalidade)}` +
                          (ev.patient.status === "Inativo" ? " inactive" : "")
                        }
                        onClick={() => navigate(`/pacientes/${ev.patient.id}`)}
                        title={`${ev.patient.nome} · ${ev.horario}–${fim}`}
                      >
                        <div className="wm-time">{ev.horario}</div>
                        <div className="wm-name">{ev.patient.nome}</div>
                        <div className="wm-meta">
                          {ev.modalidade ? (
                            <span className="wm-mod">{ev.modalidade}</span>
                          ) : null}
                          <span className="wm-dur">{ev.duracao}m</span>
                        </div>
                      </button>
                    </Fragment>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
