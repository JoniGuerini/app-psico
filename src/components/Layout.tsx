import { useEffect, useLayoutEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";

const REVEAL_SELECTORS = [
  ".page-hero",
  ".home-stats > .stat-card",
  ".patients-stats > .stat-card",
  ".app-card",
  ".app-table",
  ".profile-grid > *",
  ".payments-section",
  ".pending-toolbar",
  ".pending-page-list > *",
  ".recent-page-list > *",
  ".calendar-shell",
  ".calendar-shell + *",
  ".fin-toolbar",
  ".fin-kpis > .fin-kpi",
  ".fin-tax",
  ".fin-section",
].join(", ");

const reduceMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export function Layout() {
  const location = useLocation();

  useLayoutEffect(() => {
    if (reduceMotion()) return;
    const items = document.querySelectorAll<HTMLElement>(REVEAL_SELECTORS);
    items.forEach((el, idx) => {
      el.classList.add("reveal");
      el.classList.remove("is-revealed");
      el.style.setProperty("--reveal-delay", `${Math.min(idx * 55, 360)}ms`);
    });
  }, [location.pathname]);

  useEffect(() => {
    if (reduceMotion()) return;
    const items = document.querySelectorAll<HTMLElement>(".reveal");
    if (items.length === 0) return;

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );

    items.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [location.pathname]);

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-main">
        <div className="route-transition" key={location.pathname}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
