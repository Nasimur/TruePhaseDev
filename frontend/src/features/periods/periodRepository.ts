import type { PeriodRecord } from "../../models/types";
import { dateKey, localTodayKey, shiftedMonth } from "./dateUtils";

// The UI only depends on this contract. Annifa's IndexedDB functions, or a
// future server client, can implement it without changing the calendar page.
export interface PeriodRepository {
  list(): Promise<PeriodRecord[]>;
  save(record: PeriodRecord): Promise<void>;
  remove(id: string): Promise<void>;
}

function demoRecords(): PeriodRecord[] {
  const today = localTodayKey();
  const year = Number(today.slice(0, 4));
  const month = Number(today.slice(5, 7));
  const day = Number(today.slice(8, 10));
  const current = new Date(Date.UTC(year, month - 1, 1));
  const previous = shiftedMonth(current, -1);
  const monthPrefix = today.slice(0, 7);
  const currentEnd = Math.min(day, 5);

  return [
    {
      id: "demo-previous",
      startDate: dateKey(
        new Date(
          Date.UTC(previous.getUTCFullYear(), previous.getUTCMonth(), 6),
        ),
      ),
      endDate: dateKey(
        new Date(
          Date.UTC(previous.getUTCFullYear(), previous.getUTCMonth(), 10),
        ),
      ),
    },
    {
      id: "demo-current",
      startDate: `${monthPrefix}-01`,
      endDate: `${monthPrefix}-${String(currentEnd).padStart(2, "0")}`,
    },
  ];
}

export function createDemoPeriodRepository(): PeriodRepository {
  let records = demoRecords();
  return {
    async list() {
      return records.map((record) => ({ ...record }));
    },
    async save(record) {
      records = [
        ...records.filter((item) => item.id !== record.id),
        { ...record },
      ];
    },
    async remove(id) {
      records = records.filter((record) => record.id !== id);
    },
  };
}

export const demoPeriodRepository = createDemoPeriodRepository();
