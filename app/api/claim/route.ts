import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendClaimSubmittedEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    let payload: Record<string, string> = {};

    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      payload = await request.json();
    } else {
      const formData = await request.formData();
      formData.forEach((value, key) => {
        payload[key] = String(value);
      });
    }

    const username = String(payload.username || "").trim();
    const claimantName = String(payload.claimantName || "").trim();
    const claimantEmail = String(payload.claimantEmail || "").trim().toLowerCase();
    const socialHandle = String(payload.socialHandle || "").trim();
    const proofNotes = String(payload.proofNotes || "").trim();

    if (!username || !claimantEmail || !claimantName) {
      return NextResponse.json(
        { error: "Username target, nama lengkap, dan email wajib diisi." },
        { status: 400 },
      );
    }

    // Find the target user to claim
    const targetUser = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { id: username }],
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: `Profil pengguna @${username} tidak ditemukan di sistem.` },
        { status: 404 },
      );
    }

    // Check if there is already a pending claim with this email for this user
    const existingPending = await prisma.accountClaim.findFirst({
      where: {
        userId: targetUser.id,
        claimantEmail,
        status: "PENDING",
      },
    });

    if (existingPending) {
      return NextResponse.json(
        {
          error:
            "Permohonan klaim untuk akun ini dengan email tersebut sudah pernah diajukan dan sedang menunggu review admin.",
        },
        { status: 409 },
      );
    }

    // Create the claim request
    const claim = await prisma.accountClaim.create({
      data: {
        userId: targetUser.id,
        claimantName,
        claimantEmail,
        socialHandle,
        proofNotes,
        status: "PENDING",
      },
    });

    // Send confirmation email
    await sendClaimSubmittedEmail({
      to: claimantEmail,
      claimantName,
      username: targetUser.username || targetUser.name || targetUser.id,
    });

    return NextResponse.json({
      success: true,
      message:
        "Permohonan klaim akun berhasil dikirim! Tim kami akan meninjau dan mengirim tautan setup password ke email Anda setelah disetujui.",
      claimId: claim.id,
    });
  } catch (error) {
    console.error("Error submitting account claim:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server saat memproses klaim." },
      { status: 500 },
    );
  }
}
