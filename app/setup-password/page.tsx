import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function SetupPasswordPage({
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
            {error || "Tautan untuk mengatur kata sandi tidak ditemukan atau parameter token hilang."}
          </p>
          <Link href="/" className="primary-button wide" style={{ display: "inline-block", textAlign: "center", textDecoration: "none" }}>
            Kembali ke Beranda
          </Link>
        </section>
      </main>
    );
  }

  const claim = await prisma.accountClaim.findUnique({
    where: { token },
    include: {
      user: true,
    },
  });

  const isExpired = claim?.tokenExpiresAt ? claim.tokenExpiresAt < new Date() : true;

  if (!claim || isExpired || claim.status !== "APPROVED") {
    return (
      <main className="page-center">
        <section className="auth-card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: "42px", marginBottom: "12px" }}>⚠️</div>
          <h1>Tautan Kedaluwarsa</h1>
          <p style={{ color: "var(--muted)", marginBottom: "24px" }}>
            Tautan setup password ini sudah tidak berlaku atau pernah digunakan sebelumnya. Silakan ajukan klaim ulang jika Anda adalah pemilik sah profil ini.
          </p>
          <Link href="/" className="primary-button wide" style={{ display: "inline-block", textAlign: "center", textDecoration: "none" }}>
            Kembali ke Beranda
          </Link>
        </section>
      </main>
    );
  }

  const user = claim.user;
  const displayName = user.name || claim.claimantName || `@${user.username || "traveler"}`;

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
          <h1 style={{ margin: 0, fontSize: "22px" }}>Setup Password Baru</h1>
          <p style={{ margin: "6px 0 0 0", color: "var(--muted)", fontSize: "14px" }}>
            Klaim profil <strong>@{user.username || user.id}</strong> berhasil disetujui. Silakan atur kata sandi baru untuk mulai mengelola akun Anda.
          </p>
        </div>

        {error && (
          <div
            style={{
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "#ef4444",
              padding: "10px 14px",
              borderRadius: "8px",
              fontSize: "13px",
              marginBottom: "16px",
              fontWeight: 500,
            }}
          >
            {error}
          </div>
        )}

        <form action="/api/auth/setup-password" method="post" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <input type="hidden" name="token" value={token} />

          <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", fontWeight: 600 }}>
            Email Akun Anda
            <input
              type="email"
              value={claim.claimantEmail}
              disabled
              style={{
                background: "var(--surface-soft)",
                color: "var(--muted)",
                cursor: "not-allowed",
              }}
            />
          </label>

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
          Bukan akun Anda? <Link href="/">Kembali ke Beranda</Link>
        </div>
      </section>
    </main>
  );
}
