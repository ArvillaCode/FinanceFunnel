export const DEFAULT_CATEGORIES = [
  { name: "Vivienda", icon: "home", color: "#ef4444", type: "expense" as const },
  { name: "Alimentación", icon: "utensils-crossed", color: "#f97316", type: "expense" as const },
  { name: "Transporte", icon: "car", color: "#eab308", type: "expense" as const },
  { name: "Servicios", icon: "zap", color: "#22c55e", type: "expense" as const },
  { name: "Entretenimiento", icon: "gamepad-2", color: "#14b8a6", type: "expense" as const },
  { name: "Salud", icon: "heart-pulse", color: "#06b6d4", type: "expense" as const },
  { name: "Educación", icon: "graduation-cap", color: "#8b5cf6", type: "expense" as const },
  { name: "Deudas", icon: "landmark", color: "#d946ef", type: "expense" as const },
  { name: "Compras", icon: "shopping-bag", color: "#ec4899", type: "expense" as const },
  { name: "Otros", icon: "circle", color: "#6b7280", type: "both" as const },
  { name: "Salario", icon: "briefcase", color: "#22c55e", type: "income" as const },
  { name: "Freelance", icon: "laptop", color: "#3b82f6", type: "income" as const },
  { name: "Inversiones", icon: "trending-up", color: "#8b5cf6", type: "income" as const },
];

export const TRANSACTION_TYPES = [
  { value: "expense", label: "Gasto" },
  { value: "income", label: "Ingreso" },
] as const;

export const CURRENCIES = [
  { value: "USD", label: "USD - US Dollar", symbol: "$" },
  { value: "EUR", label: "EUR - Euro", symbol: "€" },
  { value: "COP", label: "COP - Colombian Peso", symbol: "$" },
  { value: "MXN", label: "MXN - Mexican Peso", symbol: "$" },
  { value: "ARS", label: "ARS - Argentine Peso", symbol: "$" },
  { value: "CLP", label: "CLP - Chilean Peso", symbol: "$" },
] as const;

export const SORT_OPTIONS = [
  { value: "date-desc", label: "Date (newest)" },
  { value: "date-asc", label: "Date (oldest)" },
  { value: "amount-desc", label: "Amount (highest)" },
  { value: "amount-asc", label: "Amount (lowest)" },
] as const;
