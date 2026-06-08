"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type AffiliateLink = {
  id: string;
  label: string;
  provider: string;
  actualUrl: string;
  createdAt: string;
  activities?: Array<{
    id: string;
    title: string;
    day: {
      dayNumber: number;
      itinerary: {
        id: string;
        title: string;
        destination: string;
      };
    };
  }>;
};

type WhitelistDomain = {
  id: string;
  domainPattern: string;
  description: string | null;
};

export default function AffiliateSettingsPage() {
  const [links, setLinks] = useState<AffiliateLink[]>([]);
  const [whitelist, setWhitelist] = useState<WhitelistDomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form State
  const [label, setLabel] = useState("");
  const [actualUrl, setActualUrl] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  // Load data
  useEffect(() => {
    async function loadData() {
      try {
        const [linksRes, whitelistRes] = await Promise.all([
          fetch("/api/affiliate/links"),
          fetch("/api/affiliate/whitelist"),
        ]);

        if (linksRes.status === 401) {
          window.location.href = "/login";
          return;
        }

        if (!linksRes.ok || !whitelistRes.ok) {
          throw new Error("Gagal mengambil data dari server.");
        }

        const linksData = await linksRes.json();
        const whitelistData = await whitelistRes.json();

        setLinks(linksData);
        setWhitelist(whitelistData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Show status alerts temporarily
  function showSuccess(msg: string) {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3000);
  }

  function showError(msg: string) {
    setError(msg);
    setTimeout(() => setError(null), 4000);
  }

  // Handle Submit (Create or Update)
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim() || !actualUrl.trim()) return;

    setError(null);
    setSuccess(null);

    const payload = {
      id: editingId || undefined,
      label: label.trim(),
      actualUrl: actualUrl.trim(),
    };

    try {
      const response = await fetch("/api/affiliate/links", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errMsg = await response.text();
        throw new Error(errMsg || "Gagal menyimpan tautan.");
      }

      const savedLink = await response.json();

      if (editingId) {
        setLinks((prev) => prev.map((l) => (l.id === editingId ? { ...savedLink, activities: l.activities } : l)));
        showSuccess("Tautan affiliate berhasil diperbarui.");
      } else {
        setLinks((prev) => [savedLink, ...prev]);
        showSuccess("Tautan affiliate baru berhasil ditambahkan.");
      }

      // Reset form
      setLabel("");
      setActualUrl("");
      setEditingId(null);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Gagal memproses request.");
    }
  }

  // Handle Edit Click
  function startEdit(link: AffiliateLink) {
    setEditingId(link.id);
    setLabel(link.label);
    setActualUrl(link.actualUrl);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Cancel Edit
  function cancelEdit() {
    setEditingId(null);
    setLabel("");
    setActualUrl("");
  }

  // Handle Delete
  async function handleDelete(id: string) {
    if (!confirm("Apakah Anda yakin ingin menghapus link affiliate ini? Semua aktivitas itinerary yang menunjuk ke link ini tidak akan terhubung lagi.")) {
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/affiliate/links?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errMsg = await response.text();
        throw new Error(errMsg || "Gagal menghapus tautan.");
      }

      setLinks((prev) => prev.filter((l) => l.id !== id));
      showSuccess("Tautan affiliate berhasil dihapus.");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Gagal menghapus.");
    }
  }

  if (loading) {
    return (
      <main className="page-center">
        <div style={{ textAlign: "center", padding: "40px" }}>Memuat pengaturan affiliate...</div>
      </main>
    );
  }

  return (
    <main className="page-center">
      <Link className="plain-link" href="/profile">
        &larr; Kembali ke profil
      </Link>
      
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "24px", alignItems: "start" }}>
        
        {/* Kolom Kiri: Form Add/Edit */}
        <section className="auth-card">
          <h1>{editingId ? "Edit Tautan Affiliate" : "Tambah Tautan Affiliate"}</h1>
          <p style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "16px" }}>
            Daftarkan link affiliate Anda di sini agar bisa digunakan berulang kali di berbagai aktivitas.
          </p>

          {error && <div className="error-message" style={{ color: "red", fontSize: "13px", marginBottom: "12px" }}>{error}</div>}
          {success && <div className="success-message" style={{ color: "green", fontSize: "13px", marginBottom: "12px" }}>{success}</div>}

          <form className="stack-form" onSubmit={handleSubmit}>
            <label>
              Label Tautan
              <input
                type="text"
                required
                placeholder="Contoh: Tiket Klook Borobudur, Hotel Agoda Kuta"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </label>

            <label>
              Tautan Affiliate (URL)
              <input
                type="url"
                required
                placeholder="https://www.klook.com/... atau https://www.agoda.com/..."
                value={actualUrl}
                onChange={(e) => setActualUrl(e.target.value)}
              />
            </label>

            <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
              <button className="primary-button wide" type="submit">
                {editingId ? "Simpan Perubahan" : "Tambah ke Pustaka"}
              </button>
              {editingId && (
                <button className="ghost-chip" type="button" onClick={cancelEdit} style={{ height: "42px" }}>
                  Batal
                </button>
              )}
            </div>
          </form>

          {/* Bagian Whitelist Domains Info */}
          <div style={{ marginTop: "24px", paddingTop: "16px", borderTop: "1px solid var(--line)" }}>
            <h3 style={{ fontSize: "14px", margin: "0 0 8px 0" }}>Mitra Resmi yang Diizinkan:</h3>
            <ul style={{ fontSize: "12px", color: "var(--muted)", paddingLeft: "16px", margin: 0, display: "grid", gap: "4px" }}>
              {whitelist.map((domain) => (
                <li key={domain.id}>
                  <strong>{domain.domainPattern}</strong> {domain.description ? `- ${domain.description}` : ""}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Kolom Kanan: Daftar Link */}
        <section className="auth-card">
          <h1>Pustaka Link Affiliate Anda</h1>
          <p style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "16px" }}>
            Tautan di bawah ini dapat disematkan langsung saat Anda menyusun aktivitas rute perjalanan.
          </p>

          {links.length === 0 ? (
            <div style={{ textAlign: "center", color: "var(--muted)", padding: "40px 0" }}>
              Belum ada link affiliate terdaftar. Mulai dengan menambahkannya di form sebelah kiri.
            </div>
          ) : (
            <div style={{ display: "grid", gap: "12px" }}>
              {links.map((link) => (
                <div
                  key={link.id}
                  style={{
                    padding: "12px 14px",
                    border: "1px solid var(--line)",
                    borderRadius: "8px",
                    background: "var(--surface-soft)",
                    display: "grid",
                    gap: "6px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <strong style={{ fontSize: "14px" }}>{link.label}</strong>
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 800,
                        padding: "2px 6px",
                        borderRadius: "12px",
                        background: link.provider === "Klook" ? "rgba(255, 94, 0, 0.15)" : link.provider === "Agoda" ? "rgba(0, 150, 255, 0.15)" : "rgba(128,128,128,0.15)",
                        color: link.provider === "Klook" ? "var(--orange)" : link.provider === "Agoda" ? "var(--blue)" : "var(--muted)",
                      }}
                    >
                      {link.provider}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "var(--muted)",
                      wordBreak: "break-all",
                      fontFamily: "monospace",
                    }}
                  >
                    {link.actualUrl}
                  </div>

                  {/* Tempat Link Digunakan */}
                  <div
                    style={{
                      marginTop: "8px",
                      paddingTop: "8px",
                      borderTop: "1px dashed var(--line)",
                      fontSize: "12px",
                    }}
                  >
                    <span style={{ fontWeight: 600, color: "var(--foreground)", display: "block", marginBottom: "4px" }}>
                      Digunakan di rute Anda:
                    </span>
                    {!link.activities || link.activities.length === 0 ? (
                      <span style={{ color: "var(--muted)", fontStyle: "italic", fontSize: "11px" }}>
                        Belum digunakan di rute Anda
                      </span>
                    ) : (
                      <ul style={{ margin: 0, paddingLeft: "16px", display: "grid", gap: "4px" }}>
                        {link.activities.map((act) => (
                          <li key={act.id} style={{ color: "var(--muted)", fontSize: "11px" }}>
                            <Link
                              href={`/itinerary/${act.day.itinerary.id}`}
                              className="plain-link"
                              style={{
                                color: "var(--blue)",
                                fontWeight: 500,
                                textDecoration: "underline",
                              }}
                            >
                              {act.day.itinerary.title}
                            </Link>{" "}
                            — Hari {act.day.dayNumber}: {act.title}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: "12px", marginTop: "4px", justifyContent: "flex-end" }}>
                    <button
                      onClick={() => startEdit(link)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--blue)",
                        fontSize: "12px",
                        fontWeight: 700,
                        cursor: "pointer",
                        padding: 0,
                      }}
                    >
                      Edit URL
                    </button>
                    <button
                      onClick={() => handleDelete(link.id)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "red",
                        fontSize: "12px",
                        fontWeight: 700,
                        cursor: "pointer",
                        padding: 0,
                      }}
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </main>
  );
}
