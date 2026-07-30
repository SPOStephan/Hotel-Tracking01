import type { Channel, CommissionType } from "@/types/database";

export function calculateCommission(
  bookingValue: number,
  channel: Pick<
    Channel,
    "is_commissionable" | "commission_type" | "commission_value"
  > | null,
): number | null {
  if (
    !channel ||
    !channel.is_commissionable ||
    channel.commission_type == null ||
    channel.commission_value == null
  ) {
    return null;
  }

  return roundMoney(
    applyCommission(
      bookingValue,
      channel.commission_type,
      Number(channel.commission_value),
    ),
  );
}

function applyCommission(
  bookingValue: number,
  type: CommissionType,
  value: number,
): number {
  if (type === "percentage") {
    return bookingValue * (value / 100);
  }
  return value;
}

function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}
