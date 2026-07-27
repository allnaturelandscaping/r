export type Frequency = "weekly" | "biweekly" | "monthly";

const FREQUENCY_DAYS: Record<Frequency, number> = {
  weekly: 7,
  biweekly: 14,
  monthly: 30,
};

/**
 * Calcula la siguiente fecha de corte en milisegundos UTC
 * a partir de la fecha actual y la frecuencia del cliente.
 */
export function getNextCutDate(currentDateMs: number, frequency: Frequency): number {
  return currentDateMs + FREQUENCY_DAYS[frequency] * 24 * 60 * 60 * 1000;
}
