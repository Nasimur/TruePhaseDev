import { describe, expect, it } from "vitest";

import {
  isValidDate,
  isValidDailyLog,
  isValidPeriodRecord,
  canSavePeriod
} from "./validation";

const validLog = {
  date: "2026-10-12",
  painLevel: 4,
  moods: ["happy", "sad"],
  energy: "low",
  flow: "spotting",
  notes: null
};

const validPeriod = {
  id: "period-001",
  startDate: "2026-10-12",
  endDate: "2026-10-16"
};

describe("Date validation", () => {
  it("accepts valid dates", () => {
    expect(isValidDate("2026-10-12")).toBe(true);
    expect(isValidDate("2024-02-29")).toBe(true);
  });

  it("rejects invalid dates", () => {
    expect(isValidDate("2026-02-30")).toBe(false);
    expect(isValidDate("2026-13-01")).toBe(false);
    expect(isValidDate("10/12/2026")).toBe(false);
  });
});

describe("DailyLog validation", () => {
  it("accepts a valid daily log", () => {
    expect(isValidDailyLog(validLog)).toBe(true);
  });

  it("allows multiple moods", () => {
    expect(
      isValidDailyLog({
        ...validLog,
        moods: ["happy", "sad", "neutral"]
      })
    ).toBe(true);
  });

  it("rejects duplicate moods", () => {
    expect(
      isValidDailyLog({
        ...validLog,
        moods: ["happy", "happy"]
      })
    ).toBe(false);
  });

  it("rejects invalid pain levels", () => {
    expect(
      isValidDailyLog({ ...validLog, painLevel: 15 })
    ).toBe(false);

    expect(
      isValidDailyLog({ ...validLog, painLevel: 4.5 })
    ).toBe(false);
  });

  it("accepts missing observations", () => {
    expect(
      isValidDailyLog({
        ...validLog,
        painLevel: null,
        moods: [],
        energy: null,
        flow: null
      })
    ).toBe(true);
  });

  it("rejects incomplete records", () => {
    expect(isValidDailyLog({ date: "2026-10-12" }))
      .toBe(false);
  });
});

describe("PeriodRecord validation", () => {
  it("accepts a completed period", () => {
    expect(isValidPeriodRecord(validPeriod)).toBe(true);
  });

  it("accepts an ongoing period", () => {
    expect(
      isValidPeriodRecord({
        ...validPeriod,
        endDate: null
      })
    ).toBe(true);
  });

  it("rejects an end date before the start", () => {
    expect(
      isValidPeriodRecord({
        ...validPeriod,
        endDate: "2026-10-10"
      })
    ).toBe(false);
  });
});

describe("Period overlap validation", () => {
  it("allows non-overlapping periods", () => {
    expect(
      canSavePeriod(
        {
          id: "period-002",
          startDate: "2026-10-20",
          endDate: "2026-10-24"
        },
        [validPeriod]
      )
    ).toBe(true);
  });

  it("rejects overlapping periods", () => {
    expect(
      canSavePeriod(
        {
          id: "period-002",
          startDate: "2026-10-15",
          endDate: "2026-10-20"
        },
        [validPeriod]
      )
    ).toBe(false);
  });

  it("allows editing an existing period", () => {
    expect(
      canSavePeriod(
        { ...validPeriod, startDate: "2026-10-11" },
        [validPeriod]
      )
    ).toBe(true);
  });

  it("rejects a second ongoing period", () => {
    expect(
      canSavePeriod(
        {
          id: "period-002",
          startDate: "2026-10-20",
          endDate: null
        },
        [{
          ...validPeriod,
          endDate: null
        }]
      )
    ).toBe(false);
  });
});
