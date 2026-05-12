import { useCallback, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { ToastContext, type ToastContextValue, type ToastType } from "./toastContext";

interface ToastState {
  msg: string;
  type: ToastType;
  visible: boolean;
  key: number;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState>({
    msg: "",
    type: "success",
    visible: false,
    key: 0,
  });
  const timerRef = useRef<number | null>(null);

  const showToast = useCallback<ToastContextValue["showToast"]>(
    (msg, type = "success") => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
      setToast((prev) => ({
        msg,
        type,
        visible: true,
        key: prev.key + 1,
      }));
      timerRef.current = window.setTimeout(() => {
        setToast((prev) => ({ ...prev, visible: false }));
      }, 2800);
    },
    []
  );

  const value = useMemo<ToastContextValue>(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast.visible && (
        <div
          key={toast.key}
          className={`toast ${toast.type}`}
          role="status"
          aria-live="polite"
        >
          {toast.msg}
        </div>
      )}
    </ToastContext.Provider>
  );
}
