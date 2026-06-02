import { NextResponse } from "next/server";
import {
  adminTables,
  createAdminRecord,
  listAdminRecords,
  type AdminTable,
} from "@/lib/admin";
import { getCurrentUser, isAdminUser } from "@/lib/auth";

function isAdminTable(value: string): value is AdminTable {
  return adminTables.includes(value as AdminTable);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ table: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  if (!isAdminUser(user)) {
    return new NextResponse("Forbidden", { status: 403 });
  }
  const { table } = await params;

  if (!isAdminTable(table)) {
    return new NextResponse("Unknown admin table.", { status: 404 });
  }

  const records = await listAdminRecords(table);
  return NextResponse.json({ records });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ table: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  if (!isAdminUser(user)) {
    return new NextResponse("Forbidden", { status: 403 });
  }
  const { table } = await params;

  if (!isAdminTable(table)) {
    return new NextResponse("Unknown admin table.", { status: 404 });
  }

  const body = (await request.json()) as { data?: Record<string, unknown> };
  const created = await createAdminRecord(table, body.data ?? {});
  return NextResponse.json({ record: created });
}
