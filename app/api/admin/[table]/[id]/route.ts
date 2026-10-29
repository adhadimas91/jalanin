import { NextResponse } from "next/server";
import {
  adminTables,
  deleteAdminRecord,
  formatAdminError,
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
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isAdminUser(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { table, id } = await params;

  if (!isAdminTable(table)) {
    return NextResponse.json({ error: "Unknown admin table." }, { status: 404 });
  }

  try {
    const body = (await request.json()) as { data?: Record<string, unknown> };
    const updated = await updateAdminRecord(table, id, body.data ?? {});
    return NextResponse.json({ record: updated });
  } catch (error) {
    console.error(`Admin PATCH /api/admin/${table}/${id} error:`, error);
    const { message, status } = formatAdminError(error);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ table: string; id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isAdminUser(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { table, id } = await params;

  if (!isAdminTable(table)) {
    return NextResponse.json({ error: "Unknown admin table." }, { status: 404 });
  }

  try {
    await deleteAdminRecord(table, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(`Admin DELETE /api/admin/${table}/${id} error:`, error);
    const { message, status } = formatAdminError(error);
    return NextResponse.json({ error: message }, { status });
  }
}
