import type { PeriodRecord } from "../../models/types";
import {
  isValidPeriodRecord,
  validatePeriod,
} from "./periodValidation";
import { periodDatabase, type PeriodDatabase } from "./periodDatabase";

export interface PeriodRepository {
  list(): Promise<PeriodRecord[]>;
  save(record: PeriodRecord): Promise<void>;
  remove(id: string): Promise<void>;
}

export class PeriodValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PeriodValidationError";
  }
}

export class InvalidStoredPeriodError extends Error {
  constructor() {
    super("Stored period data is invalid. No changes were made.");
    this.name = "InvalidStoredPeriodError";
  }
}

function assertValidStoredPeriods(values: unknown[]): asserts values is PeriodRecord[] {
  if (!values.every(isValidPeriodRecord)) {
    throw new InvalidStoredPeriodError();
  }
}

export function createIndexedDbPeriodRepository(
  database: PeriodDatabase = periodDatabase,
): PeriodRepository {
  return {
    async list() {
      const records: unknown[] = await database.periods.toArray();
      assertValidStoredPeriods(records);
      return records.sort((left, right) =>
        left.startDate.localeCompare(right.startDate),
      );
    },
    async save(record) {
      if (!isValidPeriodRecord(record)) {
        throw new PeriodValidationError("Check the period ID and dates.");
      }

      await database.transaction("rw", database.periods, async () => {
        const existing: unknown[] = await database.periods.toArray();
        assertValidStoredPeriods(existing);

        const errors = validatePeriod(record, existing);
        if (Object.keys(errors).length) {
          throw new PeriodValidationError(
            errors.startDate ?? errors.endDate ?? "Check the period dates.",
          );
        }

        await database.periods.put({ ...record });
      });
    },
    async remove(id) {
      await database.periods.delete(id);
    },
  };
}

export const indexedDbPeriodRepository =
  createIndexedDbPeriodRepository();
