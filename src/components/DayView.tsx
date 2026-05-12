import { Fragment, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import type { Paciente } from "../types/patient";
import { formatGap, minutesToTime, timeToMinutes } from "../lib/time";
import { modalidadeClass } from "../lib/format";
import { sessionsForDate } from "../lib/calendar";

interface DayViewProps {
  patients: Paciente[];
  cursor: Date;
}

export function DayView({ patients, cursor }: DayViewProps) {
  const navigate = useNavigate();
  const events = useMemo(() => sessionsForDate(patients, cursor), [patients, cursor]);

  const fullTitle = cursor
    .toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    })
    .replace(/^./, (c) => c.toUpperCase());

  const summary =
    events.length === 0
      ? "Nenhuma sessão escalada para este dia."
      : `${events.length} ${events.length === 1 ? "sessão" : "sessões"} agendada${
          events.length === 1 ? "" : "s"
        } para este dia.`;

  return (
    <div className="day-page">
      <div className="day-page-header">
        <div className="day-page-headline">
          <div className="day-eyebrow">Dia</div>
          <h2 className="day-page-title">{fullTitle}</h2>
          <p className="day-page-summary">{summary}</p>
        </div>
        <button
          type="button"
          className="btn btn-accent"
          onClick={() => navigate("/pacientes/novo")}
        >
          + Nova sessão
        </button>
      </div>

      {events.length === 0 ? (
        <div className="day-empty-card">
          <div className="day-empty-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none">
              <rect
                x="3.5"
                y="5.5"
                width="17"
                height="15"
                rx="2.5"
                stroke="currentColor"
                strokeWidth="1.6"
              />
              <path
                d="M3.5 9.5h17"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
              <path
                d="M8 3.5v3M16 3.5v3"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="day-empty-title">Nada agendado por aqui</div>
          <div className="day-empty-text">
            Clique em <strong>Nova sessão</strong> para cadastrar um paciente
            e seus horários recorrentes.
          </div>
        </div>
      ) : (
        <div className="day-card-list">
          {events.map((ev, i) => {
            const fim = minutesToTime(
              timeToMinutes(ev.horario) + Number(ev.duracao)
            );
            const prev = events[i - 1];
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
                    `day-card ${modalidadeClass(ev.modalidade)}` +
                    (ev.patient.status === "Inativo" ? " inactive" : "")
                  }
                  onClick={() => navigate(`/pacientes/${ev.patient.id}`)}
                >
                  <div className="day-card-time">
                    <span className="dc-hour">{ev.horario}</span>
                    <span className="dc-fim">{fim}</span>
                  </div>
                  <div className="day-card-body">
                    <div className="day-card-name">{ev.patient.nome}</div>
                    <div className="day-card-meta">
                      {ev.modalidade ? <span>{ev.modalidade}</span> : null}
                      <span>{ev.duracao} min</span>
                    </div>
                  </div>
                </button>
              </Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
}
