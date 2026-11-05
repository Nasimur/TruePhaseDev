import Dexie, { type Table } from "dexie";

import type { PeriodRecord } from "../../models/types";

export class PeriodDatabase extends Dexie {
  periods!: Table<PeriodRecord, string>;

  constructor(name = "TruePhase") {
    super(name);
    this.version(1).stores({
      periods: "&id,startDate",
    });
  }
}

export const periodDatabase = new PeriodDatabase();
