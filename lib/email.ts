import nodemailer from "nodemailer";

function getTransporter() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const isGmail =
    process.env.SMTP_SERVICE === "gmail" ||
    (!process.env.SMTP_HOST && Boolean(user?.toLowerCase().includes("@gmail.com")));

  const host = process.env.SMTP_HOST || (isGmail ? "smtp.gmail.com" : undefined);
  const port = Number(process.env.SMTP_PORT || (isGmail ? 465 : 587));
  const secure =
    process.env.SMTP_SECURE !== undefined
      ? process.env.SMTP_SECURE === "true"
      : port === 465 || isGmail;

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

function getDefaultFrom() {
  return (
    process.env.EMAIL_FROM ||
    (process.env.SMTP_USER ? `Jalanin <${process.env.SMTP_USER}>` : "Jalanin <noreply@jalanin.id>")
  );
}

export function getBaseUrl() {
  const rawUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://www.myjalanin.com");
  return rawUrl.replace(/\/+$/, "");
}

function renderEmailTemplate(contentHtml: string) {
  const baseUrl = getBaseUrl();
  const currentYear = new Date().getFullYear();

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #111; line-height: 1.6; background-color: #f9fafb;">
      <div style="text-align: center; margin-bottom: 24px;">
        <a href="${baseUrl}" style="text-decoration: none; display: inline-block;">
          <h1 style="color: #0095f6; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">Jalanin</h1>
        </a>
        <p style="color: #737373; margin: 4px 0 0 0; font-size: 14px;">Platform Komunitas &amp; Itinerary Perjalanan</p>
      </div>

      <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 28px; box-shadow: 0 4px 12px rgba(0,0,0,0.04);">
        ${contentHtml}
      </div>

      <div style="text-align: center; font-size: 12px; color: #9ca3af; margin-top: 24px;">
        <p style="margin: 0 0 6px 0;">
          <a href="${baseUrl}" style="color: #0095f6; text-decoration: none; font-weight: 600;">www.myjalanin.com</a>
        </p>
        <p style="margin: 0;">
          &copy; ${currentYear} Jalanin. Seluruh hak cipta dilindungi.
        </p>
      </div>
    </div>
  `;
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
  const content = `
    <h2 style="font-size: 20px; font-weight: 700; margin-top: 0; color: #111827;">Halo ${claimantName || "Traveler"},</h2>
    <p style="color: #374151; font-size: 15px;">Kabar gembira! Permohonan klaim Anda untuk profil <strong>@${username}</strong> di Jalanin telah <strong>disetujui oleh tim admin</strong>.</p>
    <p style="color: #374151; font-size: 15px;">Sekarang Anda dapat mengelola langsung itinerary, rekomendasi spot, dan profil Anda sendiri.</p>

    <div style="margin: 28px 0; text-align: center;">
      <a href="${setupUrl}" style="background-color: #0095f6; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 999px; font-weight: 700; font-size: 15px; display: inline-block; box-shadow: 0 4px 14px rgba(0, 149, 246, 0.3);">
        Atur Password Baru &amp; Masuk Akun
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
  `;
  const html = renderEmailTemplate(content);

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
      from: getDefaultFrom(),
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
  const baseUrl = getBaseUrl();
  const transporter = getTransporter();

  const subject = `[Jalanin] Permohonan Klaim Akun @${username} Telah Diterima`;
  const content = `
    <h2 style="font-size: 20px; font-weight: 700; margin-top: 0; color: #111827;">Halo ${claimantName || "Traveler"},</h2>
    <p style="color: #374151; font-size: 15px;">Permohonan klaim kepemilikan akun untuk <strong>@${username}</strong> telah kami terima.</p>
    <p style="color: #374151; font-size: 15px;">Tim admin kami akan memverifikasi data dan bukti yang Anda lampirkan dalam waktu 1-2 hari kerja.</p>
    <p style="color: #374151; font-size: 15px;">Setelah disetujui, kami akan mengirimkan email berisi instruksi untuk mengatur password baru akun Anda.</p>
    <div style="margin: 24px 0; text-align: center;">
      <a href="${baseUrl}" style="background-color: #0095f6; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 999px; font-weight: 700; font-size: 14px; display: inline-block;">
        Kunjungi myjalanin.com
      </a>
    </div>
  `;
  const html = renderEmailTemplate(content);

  if (!transporter) {
    console.log(`[SIMULATED EMAIL] Claim submitted notification sent to: ${to} for @${username}`);
    return { success: true, simulated: true };
  }

  try {
    await transporter.sendMail({
      from: getDefaultFrom(),
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
  const baseUrl = getBaseUrl();
  const transporter = getTransporter();

  const subject = `[Jalanin] Update Permohonan Klaim Akun @${username}`;
  const content = `
    <h2 style="font-size: 20px; font-weight: 700; margin-top: 0; color: #111827;">Halo ${claimantName || "Traveler"},</h2>
    <p style="color: #374151; font-size: 15px;">Terima kasih telah mengajukan klaim untuk akun <strong>@${username}</strong>.</p>
    <p style="color: #374151; font-size: 15px;">Mohon maaf, saat ini tim admin belum dapat menyetujui permohonan klaim akun tersebut.</p>
    ${reason ? `<div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 14px; margin: 18px 0; border-radius: 4px;"><p style="margin: 0; font-size: 14px; color: #991b1b;"><strong>Catatan Admin:</strong> ${reason}</p></div>` : ""}
    <p style="color: #374151; font-size: 15px;">Jika Anda merasa ini adalah kekeliruan atau ingin melampirkan bukti tambahan yang lebih lengkap, silakan ajukan klaim ulang atau hubungi tim kami di <a href="${baseUrl}" style="color: #0095f6;">myjalanin.com</a>.</p>
  `;
  const html = renderEmailTemplate(content);

  if (!transporter) {
    console.log(`[SIMULATED EMAIL] Claim rejected notification sent to: ${to} for @${username}. Reason: ${reason || "None"}`);
    return { success: true, simulated: true };
  }

  try {
    await transporter.sendMail({
      from: getDefaultFrom(),
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

export async function sendPasswordResetEmail(params: {
  to: string;
  name: string | null;
  resetUrl: string;
}) {
  const { to, name, resetUrl } = params;
  const transporter = getTransporter();

  const subject = `[Jalanin] Reset Password Akun Anda`;
  const content = `
    <h2 style="font-size: 20px; font-weight: 700; margin-top: 0; color: #111827;">Halo ${name || "Traveler"},</h2>
    <p style="color: #374151; font-size: 15px;">Kami menerima permintaan untuk mereset password akun Jalanin Anda.</p>
    <p style="color: #374151; font-size: 15px;">Klik tombol di bawah untuk membuat password baru. Link ini hanya berlaku selama <strong>1 jam</strong>.</p>

    <div style="margin: 32px 0; text-align: center;">
      <a href="${resetUrl}" style="background-color: #0095f6; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 999px; font-weight: 700; font-size: 15px; display: inline-block; box-shadow: 0 4px 14px rgba(0, 149, 246, 0.3);">
        Reset Password Saya
      </a>
    </div>

    <div style="background: #f8fafc; border-radius: 12px; padding: 16px; margin: 20px 0;">
      <p style="margin: 0; font-size: 13px; color: #6b7280;">
        🔒 Jika Anda tidak pernah meminta reset password, abaikan email ini. Password Anda tidak akan berubah.
      </p>
    </div>

    <hr style="border: none; border-top: 1px solid #f0f0f0; margin: 20px 0;" />
    <p style="font-size: 12px; color: #9ca3af; word-break: break-all;">
      Jika tombol di atas tidak berfungsi, buka tautan berikut di browser:<br />
      <a href="${resetUrl}" style="color: #0095f6;">${resetUrl}</a>
    </p>
  `;
  const html = renderEmailTemplate(content);

  if (!transporter) {
    console.log("----------------------------------------------------");
    console.log(`[SIMULATED EMAIL - SMTP NOT CONFIGURED]`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Reset URL: ${resetUrl}`);
    console.log("----------------------------------------------------");
    return { success: true, simulated: true, resetUrl };
  }

  try {
    const info = await transporter.sendMail({
      from: getDefaultFrom(),
      to,
      subject,
      html,
    });
    return { success: true, messageId: info.messageId, resetUrl };
  } catch (error) {
    console.error("Gagal mengirim email reset password:", error);
    return { success: false, error, resetUrl };
  }
}
