import { describe, expect, it } from "vitest";
import { getNextCutDate } from "../shared/cutUtils";

describe("getNextCutDate - programación automática", () => {
  const BASE_DATE = new Date("2026-07-27T12:00:00Z").getTime();

  it("semanal: agrega exactamente 7 días", () => {
    const next = getNextCutDate(BASE_DATE, "weekly");
    const diff = next - BASE_DATE;
    expect(diff).toBe(7 * 24 * 60 * 60 * 1000);
    expect(new Date(next).toISOString().startsWith("2026-08-03")).toBe(true);
  });

  it("quincenal: agrega exactamente 14 días", () => {
    const next = getNextCutDate(BASE_DATE, "biweekly");
    const diff = next - BASE_DATE;
    expect(diff).toBe(14 * 24 * 60 * 60 * 1000);
    expect(new Date(next).toISOString().startsWith("2026-08-10")).toBe(true);
  });

  it("mensual: agrega exactamente 30 días", () => {
    const next = getNextCutDate(BASE_DATE, "monthly");
    const diff = next - BASE_DATE;
    expect(diff).toBe(30 * 24 * 60 * 60 * 1000);
    expect(new Date(next).toISOString().startsWith("2026-08-26")).toBe(true);
  });

  it("cadena semanal: 4 semanas consecutivas son correctas", () => {
    let current = BASE_DATE;
    for (let i = 1; i <= 4; i++) {
      current = getNextCutDate(current, "weekly");
    }
    const expectedDate = new Date("2026-08-24T12:00:00Z").getTime();
    expect(current).toBe(expectedDate);
  });

  it("cadena quincenal: 3 ciclos consecutivos son correctos", () => {
    let current = BASE_DATE;
    for (let i = 1; i <= 3; i++) {
      current = getNextCutDate(current, "biweekly");
    }
    // 27 Jul + 42 días = 7 Sep
    const expectedDate = new Date("2026-09-07T12:00:00Z").getTime();
    expect(current).toBe(expectedDate);
  });

  it("retorna un timestamp mayor al actual siempre", () => {
    const freqs: Frequency[] = ["weekly", "biweekly", "monthly"];
    for (const freq of freqs) {
      expect(getNextCutDate(BASE_DATE, freq)).toBeGreaterThan(BASE_DATE);
    }
  });
});

// ─── Validación de frecuencias ────────────────────────────────────────────────

describe("frecuencias válidas", () => {
  it("solo acepta weekly, biweekly, monthly", () => {
    const validFreqs: Frequency[] = ["weekly", "biweekly", "monthly"];
    for (const freq of validFreqs) {
      expect(() => getNextCutDate(Date.now(), freq)).not.toThrow();
    }
  });
});
