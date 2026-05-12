export const uid = (): string =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

export const formatCPF = (v: string): string =>
  v
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");

export const formatCEP = (v: string): string =>
  v
    .replace(/\D/g, "")
    .slice(0, 8)
    .replace(/(\d{5})(\d)/, "$1-$2");

export const formatPhone = (v: string): string => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 10) {
    return d
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }
  return d
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
};

export const formatDateBR = (iso: string | null | undefined): string => {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

export const initials = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

export const calcAge = (iso: string | null | undefined): number | null => {
  if (!iso) return null;
  const today = new Date();
  const birth = new Date(iso);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};

export const formatCurrencyInput = (v: string | number): string => {
  const digits = String(v).replace(/\D/g, "");
  if (!digits) return "";
  const n = parseInt(digits, 10) / 100;
  return n.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const parseCurrency = (v: string | number | null | undefined): number => {
  if (v == null || v === "") return 0;
  if (typeof v === "number") return isNaN(v) ? 0 : v;
  const s = String(v).replace(/\./g, "").replace(",", ".");
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
};

export const formatCurrency = (v: number | string | null | undefined): string => {
  const n = typeof v === "number" ? v : parseCurrency(v);
  return n.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
};

export const numberToCurrencyInput = (n: number | null | undefined): string => {
  if (n == null || isNaN(n)) return "";
  return n.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const modalidadeClass = (modalidade: string | undefined | null): string => {
  if (!modalidade) return "";
  return "mod-" + modalidade.toLowerCase().replace("í", "i");
};
