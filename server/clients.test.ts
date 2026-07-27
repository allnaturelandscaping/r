import { describe, expect, it } from "vitest";

// ─── Validación de datos de cliente ──────────────────────────────────────────

type ClientInput = {
  name: string;
  address: string;
  phone?: string;
  frequency: "weekly" | "biweekly" | "monthly";
  firstCutDate: number;
};

function validateClientInput(input: ClientInput): string[] {
  const errors: string[] = [];
  if (!input.name || input.name.trim().length === 0) errors.push("Nombre requerido");
  if (input.name && input.name.length > 255) errors.push("Nombre demasiado largo");
  if (!input.address || input.address.trim().length === 0) errors.push("Dirección requerida");
  if (input.phone && input.phone.length > 30) errors.push("Teléfono demasiado largo");
  if (!["weekly", "biweekly", "monthly"].includes(input.frequency)) errors.push("Frecuencia inválida");
  if (!input.firstCutDate || input.firstCutDate <= 0) errors.push("Fecha de primer corte inválida");
  return errors;
}

describe("validateClientInput", () => {
  const validInput: ClientInput = {
    name: "Juan Pérez",
    address: "123 Oak Street, Miami FL",
    phone: "305-555-0123",
    frequency: "biweekly",
    firstCutDate: Date.now(),
  };

  it("acepta un cliente válido sin errores", () => {
    expect(validateClientInput(validInput)).toHaveLength(0);
  });

  it("rechaza nombre vacío", () => {
    const errors = validateClientInput({ ...validInput, name: "" });
    expect(errors).toContain("Nombre requerido");
  });

  it("rechaza nombre demasiado largo", () => {
    const errors = validateClientInput({ ...validInput, name: "A".repeat(256) });
    expect(errors).toContain("Nombre demasiado largo");
  });

  it("rechaza dirección vacía", () => {
    const errors = validateClientInput({ ...validInput, address: "" });
    expect(errors).toContain("Dirección requerida");
  });

  it("acepta cliente sin teléfono", () => {
    const { phone, ...noPhone } = validInput;
    expect(validateClientInput(noPhone as ClientInput)).toHaveLength(0);
  });

  it("rechaza teléfono demasiado largo", () => {
    const errors = validateClientInput({ ...validInput, phone: "1".repeat(31) });
    expect(errors).toContain("Teléfono demasiado largo");
  });

  it("acepta todas las frecuencias válidas", () => {
    for (const freq of ["weekly", "biweekly", "monthly"] as const) {
      expect(validateClientInput({ ...validInput, frequency: freq })).toHaveLength(0);
    }
  });

  it("rechaza fecha de primer corte inválida", () => {
    const errors = validateClientInput({ ...validInput, firstCutDate: 0 });
    expect(errors).toContain("Fecha de primer corte inválida");
  });
});

