import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { OverlayScrollbars } from "overlayscrollbars";

/**
 * Garante que ao navegar entre páginas o scroll volte ao topo.
 * Como o body é controlado pelo OverlayScrollbars, mexemos no viewport
 * dele; se a instância ainda não existir, caímos pro window.scrollTo.
 */
export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    const instance = OverlayScrollbars(document.body);
    if (instance) {
      const viewport = instance.elements().viewport;
      viewport.scrollTop = 0;
      viewport.scrollLeft = 0;
      return;
    }
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);

  return null;
}
