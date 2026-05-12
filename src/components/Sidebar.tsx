import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { usePatients } from "../store/usePatients";

interface NavItem {
  to: string;
  label: string;
  end?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Início", end: true },
  { to: "/pacientes", label: "Pacientes", end: true },
  { to: "/agenda", label: "Agenda" },
];

export function Sidebar() {
  const { patients } = usePatients();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = () => setMobileOpen(false);

  // Trava o scroll do body enquanto o drawer está aberto
  useEffect(() => {
    if (mobileOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [mobileOpen]);

  return (
    <>
      <button
        type="button"
        className="mobile-topbar-toggle"
        aria-label="Abrir menu"
        aria-expanded={mobileOpen}
        onClick={() => setMobileOpen(true)}
      >
        <span aria-hidden="true">≡</span>
        <span className="logo-mini" aria-hidden="true">
          +
        </span>
        <span className="topbar-title">app-psico</span>
      </button>

      {mobileOpen && (
        <button
          type="button"
          aria-label="Fechar menu"
          className="sidebar-backdrop"
          onClick={closeMobile}
        />
      )}

      <aside className={"sidebar" + (mobileOpen ? " is-open" : "")}>
        <div className="sidebar-brand">
          <div className="sidebar-logo">+</div>
          <div className="sidebar-brand-text">
            <div className="sidebar-brand-title">Cadastro de Pacientes</div>
            <div className="sidebar-brand-sub">Gerenciamento simples e seguro</div>
          </div>
          <button
            type="button"
            className="sidebar-close"
            aria-label="Fechar menu"
            onClick={closeMobile}
          >
            ×
          </button>
        </div>

        <nav className="sidebar-nav" aria-label="Navegação principal">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={closeMobile}
              className={({ isActive }) =>
                "sidebar-nav-link" + (isActive ? " active" : "")
              }
            >
              <span className="sidebar-nav-label">{item.label}</span>
              {item.to === "/pacientes" && patients.length > 0 && (
                <span className="sidebar-nav-badge">{patients.length}</span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button
            type="button"
            className="sidebar-action"
            onClick={() => {
              closeMobile();
              navigate("/pacientes/novo");
            }}
          >
            <span aria-hidden="true">+</span>
            Novo paciente
          </button>
        </div>
      </aside>
    </>
  );
}
