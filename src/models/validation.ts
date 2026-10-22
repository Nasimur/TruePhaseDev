export function canSavePeriod(
  candidate: PeriodRecord,
  existing: PeriodRecord[]
): boolean {
  if (!isValidPeriodRecord(candidate)) return false;

  for (const period of existing) {
    // Ignore the record being edited.
    if (period.id === candidate.id) continue;

    // Reject invalid existing records rather than
    // trusting corrupted database contents.
    if (!isValidPeriodRecord(period)) return false;

    // Treat null end dates as open-ended intervals.
    const candidateEnd = candidate.endDate ?? "9999-12-31";
    const existingEnd = period.endDate ?? "9999-12-31";

    const overlaps =
      candidate.startDate <= existingEnd &&
      period.startDate <= candidateEnd;

    if (overlaps) return false;
  }

  return true;
}

