import { calculateCommission } from "../src/lib/conversions/calculate-commission";
import {
  buildChannelLookupKeys,
  conversionRequestSchema,
} from "../src/lib/conversions/schema";

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

// OPB v5 string value + OPB hotel slug
const v5 = conversionRequestSchema.safeParse({
  hotel_id: "lohbeckambassador",
  transaction_id: "OPB-1",
  booking_value: "199,50",
  ref: "max123",
});
assert(v5.success, "v5 parse should succeed");
if (v5.success) {
  assert(v5.data.booking_value === 199.5, "v5 value coercion");
  assert(v5.data.hotel_id === "lohbeckambassador", "opb hotel slug accepted");
}

// OPB v6 number + UUID hotel ref still ok
const v6 = conversionRequestSchema.safeParse({
  hotel_id: "11111111-1111-4111-8111-111111111111",
  transaction_id: "OPB-2",
  booking_value: 320,
  utm_source: "ai_chat",
});
assert(v6.success, "v6 parse should succeed");

const keys = buildChannelLookupKeys({ ref: "max123", utm_source: "ai_chat" });
assert(keys[0] === "ref=max123", "ref priority key");
assert(keys.includes("utm_source=ai_chat"), "utm key present");

const commission = calculateCommission(200, {
  is_commissionable: true,
  commission_type: "percentage",
  commission_value: 10,
});
assert(commission === 20, "10% of 200 = 20");

const fixed = calculateCommission(200, {
  is_commissionable: true,
  commission_type: "fixed",
  commission_value: 15,
});
assert(fixed === 15, "fixed commission");

const none = calculateCommission(200, {
  is_commissionable: false,
  commission_type: null,
  commission_value: null,
});
assert(none === null, "non-commissionable");

console.log("ok: conversion schema & commission checks passed");
