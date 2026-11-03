import type { PeriodRecord } from "../../models/types";
import { isRealDate } from "./dateUtils";

export type PeriodFormErrors = { startDate?: string; endDate?: string };

export function validatePeriod(
  candidate: PeriodRecord,
  existing: PeriodRecord[],
): PeriodFormErrors {
  const errors: PeriodFormErrors = {};
  if (!isRealDate(candidate.startDate)) {
    errors.startDate = "Enter a valid start date.";
  }
  if (candidate.endDate !== null && !isRealDate(candidate.endDate)) {
    errors.endDate = "Enter a valid end date.";
  }
  if (errors.startDate || errors.endDate) return errors;

  if (candidate.endDate !== null && candidate.endDate < candidate.startDate) {
    errors.endDate = "The end date must be on or after the start date.";
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
