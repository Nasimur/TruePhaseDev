import type {
  DailyLog,
  Energy,
  Flow,
  Mood,
  PeriodRecord,
} from "./types";

const MOODS: readonly Mood[] = [
  "happy",
  "sad",
  "neutral",
  "calm",
  "anxious",
  "irritable",
];
const ENERGIES: readonly Energy[] = ["low", "medium", "high"];
const FLOWS: readonly Flow[] = ["none", "spotting", "light", "medium", "heavy"];
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function hasRequiredKeys(
  value: Record<string, unknown>,
  keys: readonly string[],
): boolean {
  return keys.every(
    (key) =>
      Object.prototype.hasOwnProperty.call(value, key) &&
      value[key] !== undefined,
  );
}

function isOneOf<T extends string>(
  value: unknown,
  allowed: readonly T[],
): value is T {
  return (
    typeof value === "string" && allowed.some((option) => option === value)
  );
}

export function isValidDate(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const match = DATE_PATTERN.exec(value);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(0);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCFullYear(year, month - 1, day);

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function isValidPainLevel(value: unknown): value is number | null {
  return (
    value === null ||
    (typeof value === "number" &&
      Number.isInteger(value) &&
      value >= 0 &&
      value <= 10)
  );
}

function isValidMoods(value: unknown): value is Mood[] {
  if (!Array.isArray(value)) return false;
  const seen = new Set<Mood>();
  for (const mood of value) {
    if (!isOneOf(mood, MOODS) || seen.has(mood)) return false;
    seen.add(mood);
  }
  return true;
}

export function isValidDailyLog(value: unknown): value is DailyLog {
  if (
    !isRecord(value) ||
    !hasRequiredKeys(value, [
      "date",
      "painLevel",
      "moods",
      "energy",
      "flow",
      "notes",
    ])
  ) {
    return false;
  }

  return (
    isValidDate(value.date) &&
    isValidPainLevel(value.painLevel) &&
    isValidMoods(value.moods) &&
    (value.energy === null || isOneOf(value.energy, ENERGIES)) &&
    (value.flow === null || isOneOf(value.flow, FLOWS)) &&
    (value.notes === null ||
      (typeof value.notes === "string" && value.notes.length <= 500))
  );
}

export function isValidPeriodRecord(value: unknown): value is PeriodRecord {
  if (
    !isRecord(value) ||
    !hasRequiredKeys(value, ["id", "startDate", "endDate"]) ||
    typeof value.id !== "string" ||
    value.id.trim() === "" ||
    !isValidDate(value.startDate)
  ) {
    return false;
  }

  return (
    value.endDate === null ||
    (isValidDate(value.endDate) && value.endDate >= value.startDate)
  );
}

export function canSavePeriod(
  candidate: PeriodRecord,
  existing: PeriodRecord[],
): boolean {
  if (!isValidPeriodRecord(candidate)) return false;

  const candidateEnd = candidate.endDate ?? "9999-12-31";
  for (const period of existing) {
    if (!isValidPeriodRecord(period)) return false;
    if (period.id === candidate.id) continue;

    const existingEnd = period.endDate ?? "9999-12-31";
    if (
      candidate.startDate <= existingEnd &&
      period.startDate <= candidateEnd
    ) {
      return false;
    }
  }

  return true;
}
