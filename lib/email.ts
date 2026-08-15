import nodemailer from "nodemailer";

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = process.env.SMTP_SECURE === "true" || port === 465;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });
}

const defaultFrom = process.env.EMAIL_FROM || "Jalanin <noreply@jalanin.id>";

export function getBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  );
}

export async function sendClaimApprovedEmail(params: {
  to: string;
  claimantName: string;
  username: string;
  setupUrl: string;
  expiresInHours?: number;
}) {
  const { to, claimantName, username, setupUrl, expiresInHours = 48 } = params;
  const transporter = getTransporter();

  const subject = `[Jalanin] Klaim Akun @${username} Disetujui - Atur Password Anda`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #111; line-height: 1.6;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #0095f6; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">Jalanin</h1>
        <p style="color: #737373; margin: 4px 0 0 0; font-size: 14px;">Platform Komunitas & Itinerary Perjalanan</p>
      </div>

      <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.04);">
        <h2 style="font-size: 20px; font-weight: 700; margin-top: 0;">Halo ${claimantName || "Traveler"},</h2>
        <p>Kabar gembira! Permohonan klaim Anda untuk profil <strong>@${username}</strong> di Jalanin telah <strong>disetujui oleh tim admin</strong>.</p>
        <p>Sekarang Anda dapat mengelola langsung itinerary, rekomendasi spot, dan profil Anda sendiri.</p>

        <div style="margin: 28px 0; text-align: center;">
          <a href="${setupUrl}" style="background-color: #0095f6; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 999px; font-weight: 700; font-size: 15px; display: inline-block; box-shadow: 0 4px 14px rgba(0, 149, 246, 0.3);">
            Atur Password Baru & Masuk Akun
          </a>
        </div>

        <p style="font-size: 13px; color: #737373;">
          * Link ini hanya berlaku selama <strong>${expiresInHours} jam</strong>. Jika Anda tidak pernah mengajukan klaim ini, Anda bisa mengabaikan email ini.
        </p>

        <hr style="border: none; border-top: 1px solid #f0f0f0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #9ca3af; word-break: break-all;">
          Jika tombol di atas tidak berfungsi, buka tautan berikut di browser:<br />
          <a href="${setupUrl}" style="color: #0095f6;">${setupUrl}</a>
        </p>
      </div>

      <p style="text-align: center; font-size: 12px; color: #9ca3af; margin-top: 24px;">
        &copy; ${new Date().getFullYear()} Jalanin. Seluruh hak cipta dilindungi.
      </p>
    </div>
  `;

  if (!transporter) {
    console.log("----------------------------------------------------");
    console.log(`[SIMULATED EMAIL - SMTP NOT CONFIGURED]`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Setup URL: ${setupUrl}`);
    console.log("----------------------------------------------------");
    return { success: true, simulated: true, setupUrl };
  }

  try {
    const info = await transporter.sendMail({
      from: defaultFrom,
      to,
      subject,
      html,
    });
    return { success: true, messageId: info.messageId, setupUrl };
  } catch (error) {
    console.error("Gagal mengirim email klaim akun:", error);
    return { success: false, error, setupUrl };
  }
}

export async function sendClaimSubmittedEmail(params: {
  to: string;
  claimantName: string;
  username: string;
}) {
  const { to, claimantName, username } = params;
  const transporter = getTransporter();

  const subject = `[Jalanin] Permohonan Klaim Akun @${username} Telah Diterima`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #111; line-height: 1.6;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #0095f6; margin: 0; font-size: 28px; font-weight: 800;">Jalanin</h1>
      </div>
      <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 24px;">
        <h2 style="font-size: 20px; font-weight: 700; margin-top: 0;">Halo ${claimantName || "Traveler"},</h2>
        <p>Permohonan klaim kepemilikan akun untuk <strong>@${username}</strong> telah kami terima.</p>
        <p>Tim admin kami akan memverifikasi data dan bukti yang Anda lampirkan dalam waktu 1-2 hari kerja.</p>
        <p>Setelah disetujui, kami akan mengirimkan email berisi instruksi untuk mengatur password baru akun Anda.</p>
      </div>
    </div>
  `;

  if (!transporter) {
    console.log(`[SIMULATED EMAIL] Claim submitted notification sent to: ${to} for @${username}`);
    return { success: true, simulated: true };
  }

  try {
    await transporter.sendMail({
      from: defaultFrom,
      to,
      subject,
      html,
    });
    return { success: true };
  } catch (error) {
    console.error("Gagal kirim notifikasi submit klaim:", error);
    return { success: false, error };
  }
}

export async function sendClaimRejectedEmail(params: {
  to: string;
  claimantName: string;
  username: string;
  reason?: string;
}) {
  const { to, claimantName, username, reason } = params;
  const transporter = getTransporter();

  const subject = `[Jalanin] Update Permohonan Klaim Akun @${username}`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #111; line-height: 1.6;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #0095f6; margin: 0; font-size: 28px; font-weight: 800;">Jalanin</h1>
      </div>
      <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 24px;">
        <h2 style="font-size: 20px; font-weight: 700; margin-top: 0;">Halo ${claimantName || "Traveler"},</h2>
        <p>Terima kasih telah mengajukan klaim untuk akun <strong>@${username}</strong>.</p>
        <p>Mohon maaf, saat ini tim admin belum dapat menyetujui permohonan klaim akun tersebut.</p>
        ${reason ? `<div style="background: #f8fafc; border-left: 4px solid #ef4444; padding: 12px; margin: 16px 0;"><p style="margin: 0; font-size: 14px; color: #374151;"><strong>Catatan Admin:</strong> ${reason}</p></div>` : ""}
        <p>Jika Anda merasa ini adalah kekeliruan atau ingin melampirkan bukti tambahan yang lebih lengkap, silakan ajukan klaim ulang atau hubungi admin kami.</p>
      </div>
    </div>
  `;

  if (!transporter) {
    console.log(`[SIMULATED EMAIL] Claim rejected notification sent to: ${to} for @${username}. Reason: ${reason || "None"}`);
    return { success: true, simulated: true };
  }

  try {
    await transporter.sendMail({
      from: defaultFrom,
      to,
      subject,
      html,
    });
    return { success: true };
  } catch (error) {
    console.error("Gagal kirim notifikasi penolakan klaim:", error);
    return { success: false, error };
  }
}
