"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type MyLink = {
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

// Helper untuk mengekstrak nama provider secara dinamis dari domain pattern di whitelist
function getProviderNameFromPattern(pattern: string): string {
  const clean = pattern.replace("*.", "").toLowerCase();
  if (clean.includes("klook")) return "Klook";
  if (clean.includes("agoda")) return "Agoda";
  if (clean.includes("traveloka")) return "Traveloka";
  if (clean.includes("tiket.com")) return "Tiket.com";
  if (clean.includes("booking")) return "Booking.com";
  if (clean.includes("wa.me") || clean.includes("whatsapp")) return "WhatsApp";
  
  const part = clean.split(".")[0];
  return part.charAt(0).toUpperCase() + part.slice(1);
}

export default function MyLinkSettingsPage() {
  const [links, setLinks] = useState<MyLink[]>([]);
  const [whitelist, setWhitelist] = useState<WhitelistDomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: string; username: string | null; isPro: boolean } | null>(null);

  // Form State
  const [label, setLabel] = useState("");
  const [actualUrl, setActualUrl] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  // Search, Filter, Sort & Paging State
  const [searchQuery, setSearchQuery] = useState("");
  const [providerFilter, setProviderFilter] = useState("Semua");
  const [usageFilter, setUsageFilter] = useState("Semua");
  const [sortBy, setSortBy] = useState("terbaru");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Load data
  useEffect(() => {
    async function loadData() {
      try {
        const [linksRes, whitelistRes, profileRes] = await Promise.all([
          fetch("/api/mylink/links"),
          fetch("/api/mylink/whitelist"),
          fetch("/api/profile"),
        ]);

        if (linksRes.status === 401 || profileRes.status === 401) {
          window.location.href = "/login";
          return;
        }

        if (!linksRes.ok || !whitelistRes.ok || !profileRes.ok) {
          throw new Error("Gagal mengambil data dari server.");
        }

        const linksData = await linksRes.json();
        const whitelistData = await whitelistRes.json();
        const profileData = await profileRes.json();

        setLinks(linksData);
        setWhitelist(whitelistData);
        setCurrentUser(profileData);
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
      const response = await fetch("/api/mylink/links", {
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
        showSuccess("Tautan MyLink berhasil diperbarui.");
      } else {
        setLinks((prev) => [savedLink, ...prev]);
        showSuccess("Tautan MyLink baru berhasil ditambahkan.");
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
  function startEdit(link: MyLink) {
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
    if (!confirm("Apakah Anda yakin ingin menghapus link MyLink ini? Semua aktivitas itinerary yang menunjuk ke link ini tidak akan terhubung lagi.")) {
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/mylink/links?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errMsg = await response.text();
        throw new Error(errMsg || "Gagal menghapus tautan.");
      }

      setLinks((prev) => prev.filter((l) => l.id !== id));
      showSuccess("Tautan MyLink berhasil dihapus.");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Gagal menghapus.");
    }
  }

  // Ambil list provider unik dari data whitelist mitra resmi
  const dynamicProviders = Array.from(
    new Set(
      whitelist
        .map((item) => getProviderNameFromPattern(item.domainPattern))
        .filter(Boolean)
    )
  );

  // Logika filter & pencarian lokal
  const filteredLinks = links.filter((link) => {
    const matchesQuery =
      link.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      link.actualUrl.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesProvider =
      providerFilter === "Semua" ||
      link.provider.toLowerCase() === providerFilter.toLowerCase();

    const hasUsage = link.activities && link.activities.length > 0;
    const matchesUsage =
      usageFilter === "Semua" ||
      (usageFilter === "Terpakai" && hasUsage) ||
      (usageFilter === "TidakTerpakai" && !hasUsage);

    return matchesQuery && matchesProvider && matchesUsage;
  });

  // Logika pengurutan (Sorting) lokal
  const sortedLinks = [...filteredLinks].sort((a, b) => {
    if (sortBy === "terbaru") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sortBy === "terlama") {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    if (sortBy === "namaAsc") {
      return a.label.localeCompare(b.label);
    }
    if (sortBy === "namaDesc") {
      return b.label.localeCompare(a.label);
    }
    if (sortBy === "terpopuler") {
      const aUsage = a.activities?.length || 0;
      const bUsage = b.activities?.length || 0;
      return bUsage - aUsage;
    }
    return 0;
  });

  const totalPages = Math.ceil(filteredLinks.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedLinks = sortedLinks.slice(startIndex, endIndex);

  if (loading) {
    return (
      <main className="page-center">
        <div style={{ textAlign: "center", padding: "40px" }}>Memuat pengaturan MyLink...</div>
      </main>
    );
  }

  return (
    <main className="page-center">
      <Link className="plain-link" href={`/profile/${currentUser?.username ?? currentUser?.id ?? ""}`}>
        &larr; Kembali ke profil
      </Link>
      
      <div className="mylink-grid">
        
        {/* Kolom Kiri: Form Add/Edit */}
        <section className="auth-card">
          <h1>{editingId ? "Edit Tautan MyLink" : "Tambah Tautan MyLink"}</h1>
          <p style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "16px" }}>
            Daftarkan link MyLink Anda di sini agar bisa digunakan berulang kali di berbagai aktivitas.
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
              Tautan MyLink (URL)
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
          <h1 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            Pustaka Link MyLink Anda
            {currentUser?.isPro && (
              <span className="pro-badge" style={{
                fontSize: "11px",
                fontWeight: 850,
                color: "#111",
                background: "linear-gradient(135deg, #ffd700, #ffa500)",
                padding: "2px 8px",
                borderRadius: "999px",
                border: "1px solid #ffb700",
                textTransform: "uppercase",
                display: "inline-flex",
                alignItems: "center",
                lineHeight: "1",
                height: "fit-content"
              }}>
                PRO
              </span>
            )}
          </h1>
          <p style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "16px" }}>
            Tautan di bawah ini dapat disematkan langsung saat Anda menyusun aktivitas rute perjalanan.
          </p>

          {/* Controls: Search & Filters (Hanya muncul jika ada link terdaftar atau filter aktif) */}
          {(links.length > 0 || searchQuery || providerFilter !== "Semua" || usageFilter !== "Semua") && (
            <div style={{ marginBottom: "16px", display: "grid", gap: "10px" }}>
              {/* Searchbox Input */}
              <div className="searchbox">
                <svg viewBox="0 0 24 24" style={{ width: "16px", height: "16px", flexShrink: 0 }}>
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input
                  type="text"
                  placeholder="Cari label atau URL..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>

              {/* Filters & Sorting Dropdown */}
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <select
                  value={providerFilter}
                  onChange={(e) => {
                    setProviderFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  style={{
                    flex: 1,
                    minWidth: "120px",
                    padding: "8px 12px",
                    fontSize: "13px",
                    background: "var(--surface-soft)",
                    border: "1px solid var(--line)",
                    borderRadius: "999px",
                    outline: "none",
                    cursor: "pointer",
                  }}
                >
                  <option value="Semua">Semua Partner</option>
                  {dynamicProviders.map((prov) => (
                    <option key={prov} value={prov}>
                      {prov}
                    </option>
                  ))}
                  {links.some((l) => l.provider === "Custom" || l.provider === "Lainnya") && (
                    <option value="Custom">Custom / Lainnya</option>
                  )}
                </select>

                <select
                  value={usageFilter}
                  onChange={(e) => {
                    setUsageFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  style={{
                    flex: 1,
                    minWidth: "120px",
                    padding: "8px 12px",
                    fontSize: "13px",
                    background: "var(--surface-soft)",
                    border: "1px solid var(--line)",
                    borderRadius: "999px",
                    outline: "none",
                    cursor: "pointer",
                  }}
                >
                  <option value="Semua">Semua Status</option>
                  <option value="Terpakai">Terpakai di Rute</option>
                  <option value="TidakTerpakai">Belum Digunakan</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setCurrentPage(1);
                  }}
                  style={{
                    flex: 1,
                    minWidth: "120px",
                    padding: "8px 12px",
                    fontSize: "13px",
                    background: "var(--surface-soft)",
                    border: "1px solid var(--line)",
                    borderRadius: "999px",
                    outline: "none",
                    cursor: "pointer",
                  }}
                >
                  <option value="terbaru">Terbaru</option>
                  <option value="terlama">Terlama</option>
                  <option value="namaAsc">Nama (A-Z)</option>
                  <option value="namaDesc">Nama (Z-A)</option>
                  <option value="terpopuler">Terbanyak Digunakan</option>
                </select>
              </div>
            </div>
          )}

          {links.length === 0 ? (
            <div style={{ textAlign: "center", color: "var(--muted)", padding: "40px 0" }}>
              Belum ada link MyLink terdaftar. Mulai dengan menambahkannya di form sebelah kiri.
            </div>
          ) : filteredLinks.length === 0 ? (
            <div style={{ textAlign: "center", color: "var(--muted)", padding: "40px 0" }}>
              Tidak ada tautan MyLink yang cocok dengan kriteria pencarian/penyaringan.
            </div>
          ) : (
            <>
              <div style={{ display: "grid", gap: "12px" }}>
                {paginatedLinks.map((link) => (
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

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: "20px",
                    paddingTop: "12px",
                    borderTop: "1px solid var(--line)",
                    gap: "12px",
                    flexWrap: "wrap",
                  }}
                >
                  <span style={{ fontSize: "12px", color: "var(--muted)" }}>
                    Menampilkan {startIndex + 1}–{Math.min(endIndex, filteredLinks.length)} dari {filteredLinks.length} tautan
                  </span>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="ghost-chip"
                      style={{
                        height: "32px",
                        minHeight: "32px",
                        fontSize: "12px",
                        padding: "0 10px",
                        opacity: currentPage === 1 ? 0.5 : 1,
                        cursor: currentPage === 1 ? "default" : "pointer",
                      }}
                    >
                      &larr; Seb.
                    </button>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`chip ${currentPage === pageNum ? "active" : ""}`}
                        style={{
                          height: "32px",
                          minHeight: "32px",
                          width: "32px",
                          padding: 0,
                          display: "grid",
                          placeItems: "center",
                          fontSize: "12px",
                          fontWeight: 800,
                          cursor: "pointer",
                        }}
                      >
                        {pageNum}
                      </button>
                    ))}

                    <button
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="ghost-chip"
                      style={{
                        height: "32px",
                        minHeight: "32px",
                        fontSize: "12px",
                        padding: "0 10px",
                        opacity: currentPage === totalPages ? 0.5 : 1,
                        cursor: currentPage === totalPages ? "default" : "pointer",
                      }}
                    >
                      Sel. &rarr;
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>

      </div>
    </main>
  );
}
