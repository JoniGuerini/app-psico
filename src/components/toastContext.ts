import { createContext } from "react";

export type ToastType = "success" | "error";

export interface ToastContextValue {
  showToast: (msg: string, type?: ToastType) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);
