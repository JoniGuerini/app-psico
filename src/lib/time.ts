import { SLOT_MINUTES, SLOT_START_HOUR } from "./constants";

export const timeToMinutes = (timeStr: string | null | undefined): number => {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
};

export const minutesToTime = (totalMin: number): string => {
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

export const timeToSlotIndex = (timeStr: string): number => {
  const min = timeToMinutes(timeStr);
  return Math.round((min - SLOT_START_HOUR * 60) / SLOT_MINUTES);
};

/**
 * Formata um intervalo em minutos como "30 min", "1h", "1h30" ou "6h".
 */
export const formatGap = (minutes: number): string => {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h}h`;
  return `${h}h${String(m).padStart(2, "0")}`;
};
