import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth";
import { approveAccountClaim, rejectAccountClaim } from "@/lib/admin";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdminUser();
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const action = String(body.action || "").toLowerCase();
    const adminNotes = body.adminNotes ? String(body.adminNotes) : undefined;

    if (action === "approve") {
      const result = await approveAccountClaim(id, adminNotes);
      return NextResponse.json({
        success: true,
        message: "Permohonan klaim berhasil disetujui dan email tautan setup password telah dikirim ke pemohon.",
        ...result,
      });
    }

    if (action === "reject") {
      const result = await rejectAccountClaim(id, adminNotes);
      return NextResponse.json({
        success: true,
        message: "Permohonan klaim berhasil ditolak.",
        claim: result,
      });
    }

    return NextResponse.json(
      { error: "Aksi tidak valid. Gunakan 'approve' atau 'reject'." },
      { status: 400 },
    );
  } catch (error: any) {
    console.error("Error in admin claim handler:", error);
    if (error?.status === 401 || error?.status === 403) {
      return NextResponse.json({ error: "Akses ditolak." }, { status: error.status });
    }
    return NextResponse.json(
      { error: error?.message || "Terjadi kesalahan server." },
      { status: 500 },
    );
  }
}
