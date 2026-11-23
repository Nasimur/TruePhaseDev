import { describe, expect, it } from "vitest";
import type { PeriodRecord } from "../../models/types";
import { isRealDate } from "./dateUtils";
import { validatePeriod } from "./periodValidation";

const saved: PeriodRecord = {
  id: "existing",
  startDate: "2026-10-12",
  endDate: "2026-10-16",
};

describe("period entry validation", () => {
  it("rejects impossible dates, including non-leap February 29", () => {
    expect(isRealDate("2024-02-29")).toBe(true);
    expect(isRealDate("2026-02-29")).toBe(false);
    expect(isRealDate("2026-13-01")).toBe(false);
  });

  it("rejects an end date before the start date", () => {
    expect(
      validatePeriod({ ...saved, endDate: "2026-10-11" }, []),
    ).toHaveProperty("endDate");
  });

  it("prevents overlap while allowing edits to the same record", () => {
    const overlapping = {
      id: "new",
      startDate: "2026-10-16",
      endDate: "2026-10-20",
    };
    expect(validatePeriod(overlapping, [saved])).toHaveProperty("startDate");
    expect(
      validatePeriod({ ...saved, startDate: "2026-10-11" }, [saved]),
    ).toEqual({});
  });

  it("treats a blank end date as ongoing for overlap checks", () => {
    const ongoing = { ...saved, endDate: null };
    expect(
      validatePeriod({ id: "new", startDate: "2026-10-20", endDate: null }, [
        ongoing,
      ]),
    ).toHaveProperty("startDate");
  });
});
