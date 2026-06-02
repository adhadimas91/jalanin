import { NextResponse } from "next/server";
import {
  adminTables,
  deleteAdminRecord,
  updateAdminRecord,
  type AdminTable,
} from "@/lib/admin";
import { getCurrentUser, isAdminUser } from "@/lib/auth";

function isAdminTable(value: string): value is AdminTable {
  return adminTables.includes(value as AdminTable);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ table: string; id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  if (!isAdminUser(user)) {
    return new NextResponse("Forbidden", { status: 403 });
  }
  const { table, id } = await params;

  if (!isAdminTable(table)) {
    return new NextResponse("Unknown admin table.", { status: 404 });
  }

  const body = (await request.json()) as { data?: Record<string, unknown> };
  const updated = await updateAdminRecord(table, id, body.data ?? {});
  return NextResponse.json({ record: updated });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ table: string; id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  if (!isAdminUser(user)) {
    return new NextResponse("Forbidden", { status: 403 });
  }
  const { table, id } = await params;

  if (!isAdminTable(table)) {
    return new NextResponse("Unknown admin table.", { status: 404 });
  }

  await deleteAdminRecord(table, id);
  return NextResponse.json({ ok: true });
}
