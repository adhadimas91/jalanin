import { NextResponse } from "next/server";
import {
  adminTables,
  bulkAddMyLinkToActivities,
  bulkCreateAdminRecords,
  bulkDeleteAdminRecords,
  bulkRemoveMyLinkFromActivities,
  bulkSetActivitiesMyLink,
  bulkUnlinkMyLinksFromActivities,
  bulkUpdateAdminRecords,
  formatAdminError,
  type AdminTable,
} from "@/lib/admin";
import { getCurrentUser, isAdminUser } from "@/lib/auth";

function isAdminTable(value: string): value is AdminTable {
  return adminTables.includes(value as AdminTable);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  if (!isAdminUser(user)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  try {
    const body = (await request.json()) as {
      action?: string;
      table?: string;
      ids?: string[];
      items?: Record<string, unknown>[];
      patch?: Record<string, unknown>;
      data?: Record<string, unknown>;
      activityIds?: string[];
      myLinkId?: string | null;
      myLinkIds?: string[];
    };

    const action = body.action;

    if (action === "bulkDelete") {
      if (!body.table || !isAdminTable(body.table)) {
        return new NextResponse("Unknown admin table.", { status: 400 });
      }
      const ids = Array.isArray(body.ids) ? body.ids.map(String).filter(Boolean) : [];
      const result = await bulkDeleteAdminRecords(body.table, ids);
      return NextResponse.json({ ok: true, count: result.count });
    }

    if (action === "bulkCreate") {
      if (!body.table || !isAdminTable(body.table)) {
        return new NextResponse("Unknown admin table.", { status: 400 });
      }
      const items = Array.isArray(body.items) ? body.items : [];
      const result = await bulkCreateAdminRecords(body.table, items);
      return NextResponse.json({ ok: true, count: result.count });
    }

    if (action === "bulkUpdate") {
      if (!body.table || !isAdminTable(body.table)) {
        return NextResponse.json({ error: "Unknown admin table." }, { status: 400 });
      }
      const ids = Array.isArray(body.ids) ? body.ids.map(String).filter(Boolean) : [];
      const rawPatch = body.patch ?? body.data;
      const patch = rawPatch && typeof rawPatch === "object" ? rawPatch : {};
      const result = await bulkUpdateAdminRecords(body.table, ids, patch);
      return NextResponse.json({ ok: true, count: result.count });
    }

    if (action === "bulkSetActivitiesMyLink") {
      const activityIds = Array.isArray(body.activityIds)
        ? body.activityIds.map(String).filter(Boolean)
        : [];
      const myLinkId = body.myLinkId ? String(body.myLinkId) : null;
      const result = await bulkSetActivitiesMyLink(activityIds, myLinkId);
      return NextResponse.json({ ok: true, count: result.count });
    }

    if (action === "bulkAddMyLinkToActivities") {
      const activityIds = Array.isArray(body.activityIds)
        ? body.activityIds.map(String).filter(Boolean)
        : [];
      const myLinkId = body.myLinkId ? String(body.myLinkId) : "";
      const result = await bulkAddMyLinkToActivities(activityIds, myLinkId);
      return NextResponse.json({ ok: true, count: result.count });
    }

    if (action === "bulkRemoveMyLinkFromActivities") {
      const activityIds = Array.isArray(body.activityIds)
        ? body.activityIds.map(String).filter(Boolean)
        : [];
      const myLinkId = body.myLinkId ? String(body.myLinkId) : "";
      const result = await bulkRemoveMyLinkFromActivities(activityIds, myLinkId);
      return NextResponse.json({ ok: true, count: result.count });
    }

    if (action === "bulkUnlinkMyLinksFromActivities") {
      const myLinkIds = Array.isArray(body.myLinkIds)
        ? body.myLinkIds.map(String).filter(Boolean)
        : [];
      const result = await bulkUnlinkMyLinksFromActivities(myLinkIds);
      return NextResponse.json({ ok: true, count: result.count });
    }

    return new NextResponse("Invalid bulk action.", { status: 400 });
  } catch (error) {
    console.error("Admin bulk action error:", error);
    const { message, status } = formatAdminError(error);
    return NextResponse.json({ error: message }, { status });
  }
}

