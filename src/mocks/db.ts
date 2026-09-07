import type { Database, OrganizationRow } from "@/entities/rows";
import rawDb from "@/mocks/db.json";

/**
 * The mock database. Annotating the import is the whole check: TypeScript
 * compares the JSON's inferred shape against `Database`, so a bad edit is a
 * compile error rather than a runtime surprise, with nothing to parse at boot.
 */
const db: Database = rawDb;

export function getDb(): Database {
  return db;
}

/**
 * The mock's clock. Fixed so the calendar always lands on the same week and the
 * analytics ranges cover the same posts every time.
 */
export function getNow(): Date {
  return new Date(db.now);
}

/** The workspace. One org in the mock, so services never take an org id. */
export function getOrganization(): OrganizationRow {
  const [org] = db.app.organizations;
  if (org === undefined) {
    throw new Error("Mock database has no organization.");
  }
  return org;
}
