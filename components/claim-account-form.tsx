"use client";

import { useState } from "react";
import Link from "next/link";

type Props = {
  targetUser?: {
    id: string;
    username: string | null;
    name: string | null;
    avatarUrl: string | null;
    city: string | null;
    bio: string | null;
    isClaimed: boolean;
  } | null;
  initialUsername?: string;
};

export function ClaimAccountForm({ targetUser, initialUsername = "" }: Props) {
  const [username, setUsername] = useState(initialUsername || targetUser?.username || "");
  const [claimantName, setClaimantName] = useState("");
  const [claimantEmail, setClaimantEmail] = useState("");
  const [socialHandle, setSocialHandle] = useState(targetUser?.username ? `@${targetUser.username}` : "");
  const [proofNotes, setProofNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/claim", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          claimantName,
          claimantEmail,
          socialHandle,
          proofNotes,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Gagal mengajukan klaim.");
      } else {
        setIsSuccess(true);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Terjadi kesalahan jaringan.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <section className="auth-card" style={{ textAlign: "center", maxWidth: "520px" }}>
        <div style={{ fontSize: "48px", marginBottom: "12px" }}>🎉</div>
        <h2 style={{ fontSize: "22px", margin: "0 0 8px 0" }}>Permohonan Klaim Terkirim!</h2>
        <p style={{ color: "var(--muted)", fontSize: "14px", lineHeight: "1.6", marginBottom: "20px" }}>
          Terima kasih! Kami telah menerima permohonan klaim untuk profil <strong>@{username}</strong>.
          <br />
          Tim admin Jalanin akan meninjau bukti kepemilikan Anda. Setelah disetujui, kami akan mengirimkan tautan untuk mengatur kata sandi ke email:
          <br />
          <strong style={{ color: "var(--text)" }}>{claimantEmail}</strong>
        </p>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
          {username ? (
            <Link
              href={`/profile/${username}`}
              className="primary-button"
              style={{ textDecoration: "none", borderRadius: "999px", padding: "10px 24px" }}
            >
              Kembali ke Profil
            </Link>
          ) : (
            <Link
              href="/"
              className="primary-button"
              style={{ textDecoration: "none", borderRadius: "999px", padding: "10px 24px" }}
            >
              Kembali ke Beranda
            </Link>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="auth-card" style={{ maxWidth: "520px" }}>
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ fontSize: "24px", margin: "0 0 6px 0", fontWeight: 800 }}>Klaim Akun Saya</h1>
        <p style={{ margin: 0, color: "var(--muted)", fontSize: "14px", lineHeight: "1.5" }}>
          Apakah ini akun atau profil kurasi konten perjalanan Anda? Ajukan klaim kepemilikan untuk mengelola rute, menambahkan kontak MyLink, dan mengedit konten Anda sendiri.
        </p>
      </div>

      {targetUser && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
            background: "var(--surface-soft)",
            border: "1px solid var(--line)",
            padding: "12px 16px",
            borderRadius: "12px",
            marginBottom: "20px",
          }}
        >
          <img
            src={targetUser.avatarUrl || "/uploads/default-avatar.svg"}
            alt={targetUser.name || targetUser.username || "User"}
            style={{ width: "48px", height: "48px", borderRadius: "50%", objectFit: "cover" }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: "15px", color: "var(--text)" }}>
              {targetUser.name || `@${targetUser.username}`}
            </div>
            <div style={{ fontSize: "13px", color: "var(--muted)" }}>
              @{targetUser.username || targetUser.id} &bull; {targetUser.city || "Indonesia"}
            </div>
          </div>
          {targetUser.isClaimed ? (
            <span style={{ fontSize: "11px", padding: "3px 8px", background: "#e0f2fe", color: "#0284c7", borderRadius: "999px", fontWeight: 600 }}>
              Sudah Aktif
            </span>
          ) : (
            <span style={{ fontSize: "11px", padding: "3px 8px", background: "#fef3c7", color: "#d97706", borderRadius: "999px", fontWeight: 600 }}>
              Belum Diklaim
            </span>
          )}
        </div>
      )}

      {errorMessage && (
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
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {!targetUser && (
          <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", fontWeight: 600 }}>
            Username Akun Target di Jalanin
            <input
              type="text"
              placeholder="Contoh: travel_bali"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </label>
        )}

        <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", fontWeight: 600 }}>
          Nama Lengkap Pemohon
          <input
            type="text"
            placeholder="Nama asli Anda / nama kreator"
            value={claimantName}
            onChange={(e) => setClaimantName(e.target.value)}
            required
          />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", fontWeight: 600 }}>
          Email Resmi Anda
          <span style={{ fontSize: "11px", color: "var(--muted)", fontWeight: 400 }}>
            Link aktivasi dan password baru akan dikirimkan ke email ini setelah disetujui.
          </span>
          <input
            type="email"
            placeholder="nama@email.com"
            value={claimantEmail}
            onChange={(e) => setClaimantEmail(e.target.value)}
            required
          />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", fontWeight: 600 }}>
          Handle Media Sosial Asli (Instagram / TikTok)
          <input
            type="text"
            placeholder="@nama_akun_ig"
            value={socialHandle}
            onChange={(e) => setSocialHandle(e.target.value)}
            required
          />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", fontWeight: 600 }}>
          Catatan & Bukti Kepemilikan (Opsional)
          <span style={{ fontSize: "11px", color: "var(--muted)", fontWeight: 400 }}>
            Misal: Link postingan Instagram asli, tangkapan layar akun, atau tautan verifikasi.
          </span>
          <textarea
            rows={3}
            placeholder="Contoh: Saya adalah pemilik sah akun Instagram @... Konten rute ini diadaptasi dari reel saya di link..."
            value={proofNotes}
            onChange={(e) => setProofNotes(e.target.value)}
            style={{
              padding: "10px 12px",
              borderRadius: "8px",
              border: "1px solid var(--line)",
              background: "var(--surface)",
              color: "var(--text)",
              fontSize: "14px",
              resize: "vertical",
            }}
          />
        </label>

        <button
          className="primary-button wide"
          type="submit"
          disabled={isLoading}
          style={{
            marginTop: "8px",
            background: "#0095f6",
            color: "#ffffff",
            fontWeight: 700,
            padding: "12px",
            borderRadius: "999px",
            opacity: isLoading ? 0.7 : 1,
            cursor: isLoading ? "not-allowed" : "pointer",
          }}
        >
          {isLoading ? "Mengirim Permohonan..." : "Kirim Permohonan Klaim Akun"}
        </button>
      </form>

      <div className="auth-links" style={{ marginTop: "20px", textAlign: "center", fontSize: "13px" }}>
        {targetUser ? (
          <Link href={`/profile/${targetUser.username || targetUser.id}`}>Batal & Kembali ke Profil</Link>
        ) : (
          <Link href="/">Batal & Kembali ke Beranda</Link>
        )}
      </div>
    </section>
  );
}
