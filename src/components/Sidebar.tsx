import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { usePatients } from "../store/usePatients";
import { Logo } from "./Logo";

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
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navRef = useRef<HTMLElement | null>(null);
  const indicatorRef = useRef<HTMLSpanElement | null>(null);

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

  // Move o indicador animado para o item ativo
  useLayoutEffect(() => {
    const nav = navRef.current;
    const indicator = indicatorRef.current;
    if (!nav || !indicator) return;

    const moveTo = (active: HTMLElement | null) => {
      if (!active) {
        indicator.style.opacity = "0";
        return;
      }
      const navRect = nav.getBoundingClientRect();
      const r = active.getBoundingClientRect();
      indicator.style.top = `${r.top - navRect.top}px`;
      indicator.style.height = `${r.height}px`;
      indicator.style.opacity = "1";
    };

    moveTo(nav.querySelector<HTMLElement>(".sidebar-nav-link.active"));

    const ro = new ResizeObserver(() => {
      moveTo(nav.querySelector<HTMLElement>(".sidebar-nav-link.active"));
    });
    ro.observe(nav);
    return () => ro.disconnect();
  }, [location.pathname, mobileOpen, patients.length]);

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
        <Logo size={22} className="topbar-logo" title="" />
        <span className="topbar-title">Lume</span>
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
          <Logo size={36} className="sidebar-brand-logo" title="" />
          <div className="sidebar-brand-text">
            <div className="sidebar-brand-title">Lume</div>
            <div className="sidebar-brand-sub">Sua clínica em foco</div>
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

        <nav
          ref={navRef}
          className="sidebar-nav"
          aria-label="Navegação principal"
        >
          <span
            ref={indicatorRef}
            className="sidebar-nav-indicator"
            aria-hidden="true"
          />
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
