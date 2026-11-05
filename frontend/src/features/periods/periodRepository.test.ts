import "fake-indexeddb/auto";

import { afterEach, describe, expect, it } from "vitest";

import type { PeriodRecord } from "../../models/types";
import { PeriodDatabase } from "./periodDatabase";
import {
  createIndexedDbPeriodRepository,
  InvalidStoredPeriodError,
  PeriodValidationError,
} from "./periodRepository";

const databases: PeriodDatabase[] = [];

function createRepository() {
  const name = `TruePhase-test-${crypto.randomUUID()}`;
  const database = new PeriodDatabase(name);
  databases.push(database);
  return { database, repository: createIndexedDbPeriodRepository(database) };
}

afterEach(async () => {
  const openDatabases = databases.splice(0);
  const names = new Set(openDatabases.map((database) => database.name));
  for (const database of openDatabases) database.close();
  await Promise.all(
    [...names].map(async (name) => {
      const database = new PeriodDatabase(name);
      await database.delete();
    }),
  );
});

describe("IndexedDB period repository", () => {
  it("persists periods across database connections and lists them by start date", async () => {
    const { database, repository } = createRepository();
    const later: PeriodRecord = {
      id: "later",
      startDate: "2026-10-20",
      endDate: "2026-10-24",
    };
    const earlier: PeriodRecord = {
      id: "earlier",
      startDate: "2026-10-12",
      endDate: "2026-10-16",
    };

    await repository.save(later);
    await repository.save(earlier);
    database.close();

    const reopened = new PeriodDatabase(database.name);
    databases.push(reopened);
    const persistedRepository = createIndexedDbPeriodRepository(reopened);
    expect(await persistedRepository.list()).toEqual([earlier, later]);
  });

  it("rejects invalid records without writing them", async () => {
    const { repository } = createRepository();

    await expect(
      repository.save({
        id: "invalid",
        startDate: "2026-02-30",
        endDate: null,
      }),
    ).rejects.toBeInstanceOf(PeriodValidationError);
    expect(await repository.list()).toEqual([]);
  });

  it("rejects inclusive overlaps without writing them", async () => {
    const { repository } = createRepository();
    const existing: PeriodRecord = {
      id: "existing",
      startDate: "2026-10-12",
      endDate: "2026-10-16",
    };
    await repository.save(existing);

    await expect(
      repository.save({
        id: "overlap",
        startDate: "2026-10-16",
        endDate: "2026-10-20",
      }),
    ).rejects.toBeInstanceOf(PeriodValidationError);
    expect(await repository.list()).toEqual([existing]);
  });

  it("allows adjacent periods and editing a record without self-overlap", async () => {
    const { repository } = createRepository();
    const original: PeriodRecord = {
      id: "current",
      startDate: "2026-10-12",
      endDate: "2026-10-16",
    };
    await repository.save(original);

    await repository.save({ ...original, startDate: "2026-10-11" });
    await repository.save({
      id: "next",
      startDate: "2026-10-17",
      endDate: "2026-10-20",
    });

    expect(await repository.list()).toHaveLength(2);
  });

  it("serializes concurrent writes so only one overlapping period is saved", async () => {
    const { repository } = createRepository();
    const results = await Promise.allSettled([
      repository.save({
        id: "first",
        startDate: "2026-10-12",
        endDate: "2026-10-16",
      }),
      repository.save({
        id: "second",
        startDate: "2026-10-15",
        endDate: "2026-10-19",
      }),
    ]);

    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((result) => result.status === "rejected")).toHaveLength(1);
    expect(await repository.list()).toHaveLength(1);
  });

  it("fails closed when stored period data is invalid", async () => {
    const { database, repository } = createRepository();
    await database.periods.put({
      id: "corrupt",
      startDate: "not-a-date",
      endDate: null,
    } as PeriodRecord);

    await expect(repository.list()).rejects.toBeInstanceOf(
      InvalidStoredPeriodError,
    );
    await expect(
      repository.save({
        id: "new",
        startDate: "2026-11-01",
        endDate: null,
      }),
    ).rejects.toBeInstanceOf(InvalidStoredPeriodError);
    expect(await database.periods.count()).toBe(1);
  });

  it("removes a period", async () => {
    const { repository } = createRepository();
    await repository.save({
      id: "remove",
      startDate: "2026-10-12",
      endDate: null,
    });

    await repository.remove("remove");

    expect(await repository.list()).toEqual([]);
  });
});
