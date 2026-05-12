import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { OverlayScrollbars } from "overlayscrollbars";
import "overlayscrollbars/overlayscrollbars.css";
import "./styles/global.css";
import App from "./App.tsx";

// Scrollbar 100% custom (DOM-based) substituindo a do sistema no body.
OverlayScrollbars(
  { target: document.body, cancel: { nativeScrollbarsOverlaid: false, body: null } },
  {
    scrollbars: {
      theme: "os-theme-warm",
      autoHide: "leave",
      autoHideDelay: 800,
      clickScroll: true,
    },
  }
);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
