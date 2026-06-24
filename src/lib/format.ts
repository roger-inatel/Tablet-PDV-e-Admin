// Small formatting / id helpers shared across the app.

/** Format a number as Brazilian Real, e.g. 24 -> "R$ 24,00". */
export function fmt(value: number | null | undefined): string {
  return "R$ " + Number(value || 0).toFixed(2).replace(".", ",");
}

/** Generate a stable unique id for comanda items. */
export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return "i" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/** First name from a full name. */
export function firstName(name: string): string {
  return name.split(" ")[0];
}

/** Simulate async latency for the mock repositories. */
export function delay(ms = 80): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
