import type { PeriodRecord } from "../../models/types";
import { isRealDate } from "./dateUtils";

export type PeriodFormErrors = { startDate?: string; endDate?: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isValidPeriodRecord(value: unknown): value is PeriodRecord {
  if (!isRecord(value)) return false;

  if (
    !Object.prototype.hasOwnProperty.call(value, "id") ||
    !Object.prototype.hasOwnProperty.call(value, "startDate") ||
    !Object.prototype.hasOwnProperty.call(value, "endDate") ||
    typeof value.id !== "string" ||
    value.id.trim() === "" ||
    typeof value.startDate !== "string" ||
    !isRealDate(value.startDate)
  ) {
    return false;
  }

  if (value.endDate === null) return true;
  return (
    typeof value.endDate === "string" &&
    isRealDate(value.endDate) &&
    value.endDate >= value.startDate
  );
}

export function validatePeriod(
  candidate: PeriodRecord,
  existing: PeriodRecord[],
): PeriodFormErrors {
  const errors: PeriodFormErrors = {};
  if (typeof candidate.id !== "string" || candidate.id.trim() === "") {
    errors.startDate = "Check the period ID.";
    return errors;
  }
  if (!isRealDate(candidate.startDate)) {
    errors.startDate = "Enter a valid start date.";
    return errors;
  }
  if (candidate.endDate !== null && !isRealDate(candidate.endDate)) {
    errors.endDate = "Enter a valid end date.";
    return errors;
  }
  if (
    candidate.endDate !== null &&
    candidate.endDate < candidate.startDate
  ) {
    errors.endDate = "The end date must be on or after the start date.";
    return errors;
  }

  if (existing.some((record) => !isValidPeriodRecord(record))) {
    errors.startDate = "Existing period data needs attention before saving.";
    return errors;
  }

  const candidateEnd = candidate.endDate ?? "9999-12-31";
  if (
    existing.some((record) => {
      if (record.id === candidate.id) return false;
      const recordEnd = record.endDate ?? "9999-12-31";
      return (
        candidate.startDate <= recordEnd && record.startDate <= candidateEnd
      );
    })
  ) {
    errors.startDate =
      "These dates overlap another period. Edit that record or choose different dates.";
  }
  return errors;
}
