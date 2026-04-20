export function parseDecimalInput(value: string | number) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;

  const normalized = value.trim().replace(/\s/g, "").replace(",", ".");
  if (!normalized || normalized === "-" || normalized === "." || normalized === "-.") return null;

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}
