import { isStaffUser } from "@/lib/auth/roles";
import { toCsv } from "@/lib/dashboard/csv";
import { isCsvReconciliationEnabled } from "@/lib/settings/app-settings";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isStaffUser())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!(await isCsvReconciliationEnabled())) {
    return NextResponse.json(
      { error: "CSV reconciliation is disabled" },
      { status: 403 },
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookings")
    .select(
      "transaction_id, status, booking_value, currency, arrival_date, departure_date, hotels(name), channels(name)",
    )
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  type Row = {
    transaction_id: string;
    status: string;
    booking_value: number | string;
    currency: string;
    arrival_date: string | null;
    departure_date: string | null;
    hotels: { name: string } | null;
    channels: { name: string } | null;
  };

  const rows = (data ?? []) as unknown as Row[];
  const csv = toCsv([
    [
      "transaction_id",
      "status",
      "booking_value",
      "currency",
      "arrival_date",
      "departure_date",
      "hotel_name",
      "channel_name",
    ],
    ...rows.map((row) => [
      row.transaction_id,
      row.status,
      String(row.booking_value),
      row.currency,
      row.arrival_date ?? "",
      row.departure_date ?? "",
      row.hotels?.name ?? "",
      row.channels?.name ?? "",
    ]),
  ]);

  const filename = `hgae-bookings-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
