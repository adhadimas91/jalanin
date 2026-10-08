import Link from "next/link";
import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const { token, error } = await searchParams;

  if (!token) {
    return (
      <main className="page-center">
        <section className="auth-card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: "42px", marginBottom: "12px" }}>🔒</div>
          <h1>Tautan Tidak Valid</h1>
          <p style={{ color: "var(--muted)", marginBottom: "24px" }}>
            {error || "Tautan reset password tidak lengkap atau parameter token hilang."}
          </p>
          <Link
            href="/forgot-password"
            className="primary-button wide"
            style={{ display: "inline-block", textAlign: "center", textDecoration: "none" }}
          >
            Minta Link Baru
          </Link>
        </section>
      </main>
    );
  }

  const tokenHash = hashToken(token);
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token: tokenHash },
    include: {
      user: true,
    },
  });

  const isExpired = resetToken ? resetToken.expiresAt < new Date() : true;
  const isUsed = Boolean(resetToken?.usedAt);

  if (!resetToken || isExpired || isUsed) {
    return (
      <main className="page-center">
        <section className="auth-card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: "42px", marginBottom: "12px" }}>⚠️</div>
          <h1>Tautan Kedaluwarsa</h1>
          <p style={{ color: "var(--muted)", marginBottom: "24px" }}>
            {isUsed
              ? "Tautan reset password ini sudah pernah digunakan."
              : "Tautan reset password ini sudah kedaluwarsa atau tidak valid."}
          </p>
          <Link
            href="/forgot-password"
            className="primary-button wide"
            style={{ display: "inline-block", textAlign: "center", textDecoration: "none" }}
          >
            Minta Link Baru
          </Link>
        </section>
      </main>
    );
  }

  const user = resetToken.user;
  const displayName = user.name || (user.username ? `@${user.username}` : user.email);

  return (
    <main className="page-center">
      <section className="auth-card">
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <img
            src={user.avatarUrl || "/uploads/default-avatar.svg"}
            alt={displayName}
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              margin: "0 auto 12px auto",
              border: "3px solid #0095f6",
              objectFit: "cover",
            }}
          />
          <h1 style={{ margin: 0, fontSize: "22px" }}>Reset Password</h1>
          <p style={{ margin: "6px 0 0 0", color: "var(--muted)", fontSize: "14px" }}>
            Atur password baru untuk akun <strong>{displayName}</strong>
          </p>
        </div>

        {error && (
          <div className="auth-error-box">
            {error}
          </div>
        )}

        <form action="/api/auth/reset-password" method="post" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <input type="hidden" name="token" value={token} />

          <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", fontWeight: 600 }}>
            Password Baru
            <input
              name="password"
              type="password"
              placeholder="Minimal 6 karakter"
              required
              minLength={6}
              autoFocus
            />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", fontWeight: 600 }}>
            Ulangi Password Baru
            <input
              name="confirmPassword"
              type="password"
              placeholder="Ketik ulang password baru"
              required
              minLength={6}
            />
          </label>

          <button
            className="primary-button wide"
            type="submit"
            style={{
              marginTop: "8px",
              background: "#0095f6",
              color: "#fff",
              fontWeight: 700,
              padding: "12px",
              borderRadius: "999px",
            }}
          >
            Simpan Password & Masuk
          </button>
        </form>

        <div className="auth-links" style={{ marginTop: "20px", textAlign: "center", fontSize: "13px" }}>
          Ingat password Anda? <Link href="/login">Kembali ke Login</Link>
        </div>
      </section>
    </main>
  );
}
