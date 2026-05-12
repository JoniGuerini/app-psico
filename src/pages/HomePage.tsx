import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { usePatients } from "../store/usePatients";
import { formatCurrency, initials } from "../lib/format";
import { minutesToTime, timeToMinutes } from "../lib/time";
import { collectPendingPayments, monthRange } from "../lib/payments";
import { startOfDay } from "../lib/calendar";
import type { Modalidade, Paciente } from "../types/patient";

interface TodayEvent {
  diaSemana: number;
  horario: string;
  duracao: number;
  patient: Paciente;
  modalidade?: Modalidade;
}

function greetingFor(hour: number): string {
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

export function HomePage() {
  const { patients } = usePatients();
  const navigate = useNavigate();

  const now = useMemo(() => new Date(), []);
  const hour = now.getHours();
  const todayDay = now.getDay();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const dateLabel = now.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const ativos = patients.filter((p) => p.status === "Ativo");

  const todayEvents: TodayEvent[] = [];
  patients.forEach((p) => {
    if (p.status !== "Ativo") return;
    if (!Array.isArray(p.agendamentos)) return;
    p.agendamentos.forEach((a) => {
      if (Number(a.diaSemana) === todayDay && a.horario && a.duracao) {
        todayEvents.push({
          ...a,
          patient: p,
          modalidade: a.modalidade ?? p.modalidade,
        });
      }
    });
  });
  todayEvents.sort((a, b) => timeToMinutes(a.horario) - timeToMinutes(b.horario));

  const summaryText =
    todayEvents.length === 0
      ? "sem atendimentos hoje"
      : todayEvents.length === 1
        ? "atendimento hoje"
        : "atendimentos hoje";

  const atendSemana = ativos.reduce(
    (sum, p) => sum + (Array.isArray(p.agendamentos) ? p.agendamentos.length : 0),
    0
  );

  const receitaSemana = ativos.reduce((sum, p) => {
    const valor = Number(p.valorSessao) || 0;
    const sessoes = Array.isArray(p.agendamentos) ? p.agendamentos.length : 0;
    return sum + valor * sessoes;
  }, 0);

  const pendingThisMonth = useMemo(() => {
    const today = startOfDay(new Date());
    const { from } = monthRange(today);
    return collectPendingPayments(patients, from, today);
  }, [patients]);
  const pendingCount = pendingThisMonth.length;
  const pendingTotal = pendingThisMonth.reduce((sum, p) => sum + p.row.valor, 0);

  return (
    <>
      <div className="home-welcome">
        <div>
          <h2>
            <span>{greetingFor(hour)}</span>!
          </h2>
          <div className="home-date">{dateLabel}</div>
        </div>
        <div className="home-summary">
          <strong>{todayEvents.length}</strong>
          <span>{summaryText}</span>
        </div>
      </div>

      <div className="stats home-stats">
        <div className="stat-card">
          <div className="label">Total de pacientes</div>
          <div className="value">{patients.length}</div>
        </div>
        <div className="stat-card green">
          <div className="label">Pacientes ativos</div>
          <div className="value">{ativos.length}</div>
        </div>
        <div className="stat-card">
          <div className="label">Atendimentos / semana</div>
          <div className="value">{atendSemana}</div>
        </div>
        <div className="stat-card">
          <div className="label">Receita / semana</div>
          <div className="value">{formatCurrency(receitaSemana)}</div>
        </div>
        <button
          type="button"
          className={"stat-card clickable" + (pendingCount > 0 ? " warn" : "")}
          onClick={() => navigate("/pagamentos/pendentes")}
          aria-label="Ver pagamentos pendentes"
        >
          <div className="label">Pagamentos pendentes</div>
          <div className="value">{pendingCount}</div>
          <div className="stat-sub">{formatCurrency(pendingTotal)}</div>
        </button>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-header-text">
            <h2>Atendimentos de hoje</h2>
            <p>Clique em um paciente para abrir o perfil.</p>
          </div>
          <div className="card-header-actions">
            <button
              type="button"
              className="btn btn-accent btn-icon"
              onClick={() => navigate("/agenda")}
            >
              Ver agenda
            </button>
          </div>
        </div>

        {todayEvents.length === 0 ? (
          <div className="today-empty">
            <strong>Nenhum atendimento agendado para hoje.</strong>
            <span>
              Aproveite o tempo livre ou veja a semana completa na agenda.
            </span>
          </div>
        ) : (
          <div className="today-list">
            {todayEvents.map((ev, i) => {
              const ini = timeToMinutes(ev.horario);
              const fimMin = ini + Number(ev.duracao);
              const fim = minutesToTime(fimMin);
              const cls = ["today-item"];
              if (fimMin < nowMinutes) cls.push("is-past");
              else if (ini <= nowMinutes && nowMinutes < fimMin)
                cls.push("is-now");

              return (
                <button
                  type="button"
                  key={`${ev.patient.id}-${i}`}
                  className={cls.join(" ")}
                  onClick={() => navigate(`/pacientes/${ev.patient.id}`)}
                >
                  <div className="today-time">{ev.horario}</div>
                  <div className="avatar">{initials(ev.patient.nome)}</div>
                  <div className="today-info">
                    <div className="today-name">{ev.patient.nome}</div>
                    <div className="today-meta">
                      <span>
                        {ev.horario} – {fim}
                      </span>
                      <span className="meta-sep">·</span>
                      <span>{ev.duracao} min</span>
                      {ev.modalidade && (
                        <>
                          <span className="meta-sep">·</span>
                          <span>{ev.modalidade}</span>
                        </>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
