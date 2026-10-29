import { NextResponse } from "next/server";
import {
  adminTables,
  createAdminRecord,
  formatAdminError,
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
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isAdminUser(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { table } = await params;

  if (!isAdminTable(table)) {
    return NextResponse.json({ error: "Unknown admin table." }, { status: 404 });
  }

  try {
    const records = await listAdminRecords(table);
    return NextResponse.json({ records });
  } catch (error) {
    console.error(`Admin GET /api/admin/${table} error:`, error);
    const { message, status } = formatAdminError(error);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ table: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isAdminUser(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { table } = await params;

  if (!isAdminTable(table)) {
    return NextResponse.json({ error: "Unknown admin table." }, { status: 404 });
  }

  try {
    const body = (await request.json()) as { data?: Record<string, unknown> };
    const created = await createAdminRecord(table, body.data ?? {});
    return NextResponse.json({ record: created });
  } catch (error) {
    console.error(`Admin POST /api/admin/${table} error:`, error);
    const { message, status } = formatAdminError(error);
    return NextResponse.json({ error: message }, { status });
  }
}
