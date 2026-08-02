import assert from "node:assert/strict";
import { parseReconciliationCsv, toCsv } from "../src/lib/dashboard/csv";

const parsed = parseReconciliationCsv(`transaction_id,status,note
OPB-1,verified,ok
OPB-2,cancelled,
OPB-3,nope,bad
`);

assert.equal(parsed.rows.length, 2);
assert.equal(parsed.rows[0]?.status, "verified");
assert.equal(parsed.errors.length, 1);

const csv = toCsv([
  ["transaction_id", "status"],
  ["A,B", "pending"],
]);
assert.ok(csv.includes('"A,B"'));

console.log("ok: csv reconciliation parser checks passed");
