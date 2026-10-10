"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
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

type ToastItem = { id: number; kind: "success" | "error"; message: string };

const PROVIDER_META: Record<string, { color: string; soft: string; letter: string }> = {
  Klook: { color: "#ff5e00", soft: "rgba(255, 94, 0, 0.12)", letter: "K" },
  Agoda: { color: "#0096ff", soft: "rgba(0, 150, 255, 0.12)", letter: "A" },
  Traveloka: { color: "#2f86ff", soft: "rgba(47, 134, 255, 0.12)", letter: "T" },
  "Tiket.com": { color: "#e11d48", soft: "rgba(225, 29, 72, 0.12)", letter: "T" },
  "Booking.com": { color: "#003b95", soft: "rgba(0, 59, 149, 0.12)", letter: "B" },
  WhatsApp: { color: "#25d366", soft: "rgba(37, 211, 102, 0.14)", letter: "W" },
  Custom: { color: "#737373", soft: "rgba(115, 115, 115, 0.12)", letter: "L" },
};

const ITEMS_PER_PAGE = 5;
const USAGE_PREVIEW_LIMIT = 2;

function getHostname(urlStr: string): string | null {
  try {
    const trimmed = urlStr.trim();
    const normalized = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    return new URL(normalized).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function detectProvider(urlStr: string): string {
  const hostname = getHostname(urlStr);
  if (!hostname) return "Custom";
  if (hostname.includes("klook.com")) return "Klook";
  if (hostname.includes("agoda.com")) return "Agoda";
  if (hostname.includes("traveloka.com")) return "Traveloka";
  if (hostname.includes("tiket.com")) return "Tiket.com";
  if (hostname.includes("booking.com")) return "Booking.com";
  if (hostname === "wa.me" || hostname.includes("whatsapp.com")) return "WhatsApp";
  return "Custom";
}

function getProviderMeta(provider: string) {
  return PROVIDER_META[provider] ?? PROVIDER_META.Custom;
}

function getProviderNameFromPattern(pattern: string): string {
  const clean = pattern.replace("*.", "").toLowerCase();
  if (clean.includes("klook")) return "Klook";
  if (clean.includes("agoda")) return "Agoda";
  if (clean.includes("traveloka")) return "Traveloka";
  if (clean.includes("tiket.com")) return "Tiket.com";
  if (clean.includes("booking")) return "Booking.com";
  if (clean.includes("wa.me") || clean.includes("whatsapp")) return "WhatsApp";
  const part = clean.split(".")[0] ?? "";
  return part.charAt(0).toUpperCase() + part.slice(1);
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

/* ---------- Inline icons (stroke style, matches app svg defaults) ---------- */

function IconLink(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path d="M10 13.2a5 5 0 0 0 7.5.4l2.8-2.8a5 5 0 0 0-7-7.1l-1.7 1.6" />
      <path d="M14 10.8a5 5 0 0 0-7.5-.4l-2.8 2.8a5 5 0 0 0 7 7.1l1.7-1.6" />
    </svg>
  );
}

function IconRoute(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <circle cx="6" cy="18" r="2.5" />
      <circle cx="18" cy="6" r="2.5" />
      <path d="M8 18h5a3 3 0 0 0 0-6h-2a3 3 0 0 1 0-6h4.5" />
    </svg>
  );
}

function IconClock(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

function IconTag(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path d="M20.6 13.4 11 3.8A2 2 0 0 0 9.6 3H5a2 2 0 0 0-2 2v4.6c0 .5.2 1 .6 1.4l9.6 9.6a2 2 0 0 0 2.8 0l4.6-4.6a2 2 0 0 0 0-2.6Z" />
      <circle cx="7.5" cy="7.5" r="1.2" />
    </svg>
  );
}

function IconShield(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path d="M12 3 5 5.8v5.4c0 4.4 3 8.2 7 9.8 4-1.6 7-5.4 7-9.8V5.8L12 3Z" />
      <path d="m9 11.8 2.2 2.2 4-4.2" />
    </svg>
  );
}

function IconCopy(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path d="M8 8V5.5C8 4.7 8.7 4 9.5 4h8C18.3 4 19 4.7 19 5.5v10c0 .8-.7 1.5-1.5 1.5H15" />
      <rect x="5" y="8" width="10" height="12" rx="1.5" />
    </svg>
  );
}

function IconExternal(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path d="M14 4h6v6" />
      <path d="M20 4 10 14" />
      <path d="M19 13.5V19a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19V7.5A1.5 1.5 0 0 1 6.5 6H12" />
    </svg>
  );
}

function IconEdit(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path d="M16.8 3.8a2.1 2.1 0 0 1 3 3L8 18.6l-4.2 1.2L5 15.6l11.8-11.8Z" />
    </svg>
  );
}

function IconTrash(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path d="M4 6.5h16" />
      <path d="M9 6V4.5c0-.8.7-1.5 1.5-1.5h3c.8 0 1.5.7 1.5 1.5V6" />
      <path d="M6.5 6.5 7.4 20c0 .8.7 1.5 1.5 1.5h6.2c.8 0 1.5-.7 1.5-1.5l.9-13.5" />
      <path d="M10 10.5v6" />
      <path d="M14 10.5v6" />
    </svg>
  );
}

function IconCheck(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path d="m4.5 12.5 5 5 10-11" />
    </svg>
  );
}

function IconAlert(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V13" />
      <circle cx="12" cy="16.2" r="0.4" fill="currentColor" />
    </svg>
  );
}

function IconCompass(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" />
    </svg>
  );
}

function IconPlus(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function IconBookmark(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path d="M6 4.8c0-.9.7-1.6 1.6-1.6h8.8c.9 0 1.6.7 1.6 1.6v16l-6-3.7-6 3.7v-16Z" />
    </svg>
  );
}

export default function MyLinkSettingsPage() {
  const [links, setLinks] = useState<MyLink[]>([]);
  const [whitelist, setWhitelist] = useState<WhitelistDomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [currentUser, setCurrentUser] = useState<{ id: string; username: string | null } | null>(null);

  // Form state
  const [label, setLabel] = useState("");
  const [actualUrl, setActualUrl] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  // Search, filter, sort & paging state
  const [searchQuery, setSearchQuery] = useState("");
  const [providerFilter, setProviderFilter] = useState("Semua");
  const [usageFilter, setUsageFilter] = useState("Semua");
  const [sortBy, setSortBy] = useState("terbaru");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedUsage, setExpandedUsage] = useState<Record<string, boolean>>({});
  const [deleteTarget, setDeleteTarget] = useState<MyLink | null>(null);

  const formCardRef = useRef<HTMLElement>(null);
  const labelInputRef = useRef<HTMLInputElement>(null);

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

        const linksData = (await linksRes.json()) as MyLink[];
        const whitelistData = (await whitelistRes.json()) as WhitelistDomain[];
        const profileData = (await profileRes.json()) as { id: string; username: string | null };

        setLinks(linksData);
        setWhitelist(whitelistData);
        setCurrentUser(profileData);
      } catch (err) {
        pushToast("error", err instanceof Error ? err.message : "Terjadi kesalahan.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close delete modal with Escape
  useEffect(() => {
    if (!deleteTarget) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setDeleteTarget(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [deleteTarget]);

  function pushToast(kind: ToastItem["kind"], message: string) {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, kind, message }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3600);
  }

  // Handle Submit (Create or Update)
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!label.trim() || !actualUrl.trim() || submitting) return;

    setSubmitting(true);
    try {
      const response = await fetch("/api/mylink/links", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId || undefined,
          label: label.trim(),
          actualUrl: actualUrl.trim(),
        }),
      });

      if (!response.ok) {
        const errMsg = await response.text();
        throw new Error(errMsg || "Gagal menyimpan tautan.");
      }

      const savedLink = (await response.json()) as MyLink;

      if (editingId) {
        setLinks((prev) =>
          prev.map((l) => (l.id === editingId ? { ...savedLink, activities: l.activities } : l)),
        );
        pushToast("success", "Tautan MyLink berhasil diperbarui.");
      } else {
        setLinks((prev) => [savedLink, ...prev]);
        pushToast("success", "Tautan MyLink baru berhasil ditambahkan.");
      }

      setLabel("");
      setActualUrl("");
      setEditingId(null);
    } catch (err) {
      pushToast("error", err instanceof Error ? err.message : "Gagal memproses request.");
    } finally {
      setSubmitting(false);
    }
  }

  function startEdit(link: MyLink) {
    setEditingId(link.id);
    setLabel(link.label);
    setActualUrl(link.actualUrl);
    formCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => labelInputRef.current?.focus(), 350);
  }

  function cancelEdit() {
    setEditingId(null);
    setLabel("");
    setActualUrl("");
  }

  async function confirmDelete() {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/mylink/links?id=${deleteTarget.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errMsg = await response.text();
        throw new Error(errMsg || "Gagal menghapus tautan.");
      }

      setLinks((prev) => prev.filter((l) => l.id !== deleteTarget.id));
      setDeleteTarget(null);
      pushToast("success", "Tautan MyLink berhasil dihapus.");
    } catch (err) {
      pushToast("error", err instanceof Error ? err.message : "Gagal menghapus.");
    } finally {
      setDeleting(false);
    }
  }

  async function copyUrl(link: MyLink) {
    try {
      await navigator.clipboard.writeText(link.actualUrl);
      pushToast("success", "URL berhasil disalin ke clipboard.");
    } catch {
      pushToast("error", "Gagal menyalin URL.");
    }
  }

  function toggleUsage(id: string) {
    setExpandedUsage((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  // Provider unik dari whitelist mitra resmi
  const dynamicProviders = useMemo(
    () => Array.from(new Set(whitelist.map((item) => getProviderNameFromPattern(item.domainPattern)).filter(Boolean))),
    [whitelist],
  );

  const usedCount = useMemo(
    () => links.filter((l) => (l.activities?.length ?? 0) > 0).length,
    [links],
  );
  const totalUsage = useMemo(
    () => links.reduce((sum, l) => sum + (l.activities?.length ?? 0), 0),
    [links],
  );

  // Logika filter & pencarian lokal
  const filteredLinks = useMemo(() => {
    return links.filter((link) => {
      const matchesQuery =
        link.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        link.actualUrl.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesProvider =
        providerFilter === "Semua" || link.provider.toLowerCase() === providerFilter.toLowerCase();

      const hasUsage = link.activities && link.activities.length > 0;
      const matchesUsage =
        usageFilter === "Semua" ||
        (usageFilter === "Terpakai" && hasUsage) ||
        (usageFilter === "TidakTerpakai" && !hasUsage);

      return matchesQuery && matchesProvider && matchesUsage;
    });
  }, [links, searchQuery, providerFilter, usageFilter]);

  const sortedLinks = useMemo(() => {
    const list = [...filteredLinks];
    if (sortBy === "terbaru") {
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === "terlama") {
      list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (sortBy === "namaAsc") {
      list.sort((a, b) => a.label.localeCompare(b.label));
    } else if (sortBy === "namaDesc") {
      list.sort((a, b) => b.label.localeCompare(a.label));
    } else if (sortBy === "terpopuler") {
      list.sort((a, b) => (b.activities?.length ?? 0) - (a.activities?.length ?? 0));
    }
    return list;
  }, [filteredLinks, sortBy]);

  const totalPages = Math.ceil(sortedLinks.length / ITEMS_PER_PAGE);
  const safePage = Math.min(currentPage, Math.max(totalPages, 1));
  const startIndex = (safePage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, sortedLinks.length);
  const paginatedLinks = sortedLinks.slice(startIndex, endIndex);

  // Live URL detection untuk preview di form
  const liveHostname = actualUrl.trim() ? getHostname(actualUrl) : null;
  const liveProvider = actualUrl.trim() ? detectProvider(actualUrl) : null;

  return (
    <main className="page-center">
      {/* Toasts */}
      <div className="mylink-toast-stack" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`mylink-toast ${toast.kind === "error" ? "error" : "success"}`}>
            {toast.kind === "error" ? <IconAlert /> : <IconCheck />}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>

      {/* Header */}
      <header className="mylink-header">
        <div className="mylink-header-icon">
          <IconLink />
        </div>
        <div>
          <h1 className="mylink-title">Kelola Link MyLink</h1>
          <p className="mylink-subtitle">
            Simpan tautan afiliasi Anda sekali, lalu sematkan ke aktivitas rute perjalanan kapan pun.
          </p>
        </div>
      </header>

      {/* Stats */}
      <div className="mylink-stats">
        <div className="mylink-stat">
          <div
            className="mylink-stat-icon"
            style={{ color: "#ff5e00", background: "rgba(255, 94, 0, 0.12)" }}
          >
            <IconLink />
          </div>
          <div>
            <div className="mylink-stat-value">{links.length}</div>
            <div className="mylink-stat-label">Total Link</div>
          </div>
        </div>
        <div className="mylink-stat">
          <div
            className="mylink-stat-icon"
            style={{ color: "#15803d", background: "rgba(34, 197, 94, 0.12)" }}
          >
            <IconRoute />
          </div>
          <div>
            <div className="mylink-stat-value">{usedCount}</div>
            <div className="mylink-stat-label">Dipakai di Rute</div>
          </div>
        </div>
        <div className="mylink-stat">
          <div
            className="mylink-stat-icon"
            style={{ color: "#0095f6", background: "rgba(0, 149, 246, 0.12)" }}
          >
            <IconBookmark />
          </div>
          <div>
            <div className="mylink-stat-value">{totalUsage}</div>
            <div className="mylink-stat-label">Total Penyematan</div>
          </div>
        </div>
      </div>

      <div className="mylink-grid">
        {/* Kolom Kiri: Form Add/Edit */}
        <section className="auth-card mylink-form-card" ref={formCardRef}>
          <h2 className="mylink-card-title">
            {editingId ? "Edit Tautan MyLink" : "Tambah Tautan MyLink"}
          </h2>
          <p className="mylink-card-desc">
            {editingId
              ? "Perbarui label atau URL tautan yang sudah terdaftar."
              : "Daftarkan link MyLink Anda di sini agar bisa digunakan berulang kali di berbagai aktivitas."}
          </p>

          <form className="stack-form" onSubmit={handleSubmit}>
            <div className="mylink-field">
              <label className="mylink-field-label" htmlFor="mylink-label">
                Label Tautan
              </label>
              <div className="mylink-input-wrap">
                <IconTag className="mylink-input-icon" />
                <input
                  id="mylink-label"
                  ref={labelInputRef}
                  type="text"
                  className="mylink-input"
                  required
                  placeholder="Contoh: Tiket Klook Borobudur, Hotel Agoda Kuta"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                />
              </div>
            </div>

            <div className="mylink-field">
              <label className="mylink-field-label" htmlFor="mylink-url">
                Tautan MyLink (URL)
                {liveProvider && liveProvider !== "Custom" && (
                  <span style={{ fontWeight: 600 }} className="mylink-field-hint">
                    terdeteksi otomatis
                  </span>
                )}
              </label>
              <div className="mylink-input-wrap">
                <IconLink className="mylink-input-icon" />
                <input
                  id="mylink-url"
                  type="url"
                  className="mylink-input"
                  required
                  placeholder="https://www.klook.com/... atau https://www.agoda.com/..."
                  value={actualUrl}
                  onChange={(e) => setActualUrl(e.target.value)}
                />
              </div>
              {actualUrl.trim() && (
                <div className="mylink-url-preview">
                  {liveProvider && (
                    <span
                      className="provider-chip"
                      style={{
                        color: getProviderMeta(liveProvider).color,
                        background: getProviderMeta(liveProvider).soft,
                      }}
                    >
                      <span className="provider-dot" style={{ background: getProviderMeta(liveProvider).color }} />
                      {liveProvider}
                    </span>
                  )}
                  {liveHostname && <span className="mylink-hostname">{liveHostname}</span>}
                </div>
              )}
            </div>

            <div className="mylink-form-actions">
              <button className="primary-button" type="submit" disabled={submitting}>
                {submitting && <span className="spinner" />}
                {submitting
                  ? "Menyimpan..."
                  : editingId
                    ? "Simpan Perubahan"
                    : "Tambah ke Pustaka"}
              </button>
              {editingId && (
                <button className="ghost-chip" type="button" onClick={cancelEdit} style={{ height: "42px" }}>
                  Batal
                </button>
              )}
            </div>
          </form>

          <hr className="mylink-divider" />

          {/* Bagian Whitelist Domains Info */}
          <div>
            <h3 className="mylink-section-title">
              <IconShield />
              Mitra Resmi yang Diizinkan
            </h3>
            <div className="whitelist-chips">
              {whitelist.map((domain) => (
                <span
                  key={domain.id}
                  className="whitelist-chip"
                  title={domain.description ?? domain.domainPattern}
                >
                  {domain.domainPattern}
                </span>
              ))}
            </div>
            <p style={{ fontSize: "11.5px", color: "var(--muted-2)", margin: "10px 0 0", lineHeight: 1.6 }}>
              Hanya URL dari domain di atas yang bisa didaftarkan. Domain lainnya akan ditolak oleh sistem.
            </p>
          </div>
        </section>

        {/* Kolom Kanan: Daftar Link */}
        <section className="auth-card">
          <h2 className="mylink-card-title">Pustaka Link MyLink Anda</h2>
          <p className="mylink-card-desc">
            Tautan di bawah ini dapat disematkan langsung saat Anda menyusun aktivitas rute perjalanan.
          </p>

          {links.length > 0 && (
            <div className="mylink-toolbar">
              <div className="searchbox">
                <svg viewBox="0 0 24 24" style={{ width: "16px", height: "16px", flexShrink: 0 }}>
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
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

              <div className="mylink-filter-row">
                {["Semua", ...dynamicProviders].map((prov) => (
                  <button
                    key={prov}
                    type="button"
                    className={`chip ${providerFilter === prov ? "active" : ""}`}
                    onClick={() => {
                      setProviderFilter(prov);
                      setCurrentPage(1);
                    }}
                  >
                    {prov === "Semua" ? "Semua Partner" : prov}
                  </button>
                ))}
                {links.some((l) => l.provider === "Custom" || l.provider === "Lainnya") && (
                  <button
                    type="button"
                    className={`chip ${providerFilter === "Custom" ? "active" : ""}`}
                    onClick={() => {
                      setProviderFilter("Custom");
                      setCurrentPage(1);
                    }}
                  >
                    Custom / Lainnya
                  </button>
                )}
              </div>

              <div className="mylink-filter-row">
                {[
                  { value: "Semua", label: "Semua Status" },
                  { value: "Terpakai", label: "Terpakai" },
                  { value: "TidakTerpakai", label: "Belum Dipakai" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`chip ${usageFilter === opt.value ? "active" : ""}`}
                    onClick={() => {
                      setUsageFilter(opt.value);
                      setCurrentPage(1);
                    }}
                  >
                    {opt.label}
                  </button>
                ))}

                <select
                  className="mylink-select"
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setCurrentPage(1);
                  }}
                  aria-label="Urutkan tautan"
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

          {loading ? (
            <div className="mylink-skeleton">
              <div className="skeleton-card" />
              <div className="skeleton-card" />
              <div className="skeleton-card" />
            </div>
          ) : links.length === 0 ? (
            <div className="mylink-empty">
              <div className="mylink-empty-icon">
                <IconCompass />
              </div>
              <h3 className="mylink-empty-title">Belum ada link MyLink</h3>
              <p className="mylink-empty-text">
                Mulai dengan mendaftarkan tautan afiliasi pertama Anda di form sebelah kiri, lalu
                sematkan ke aktivitas rute perjalanan.
              </p>
              <button
                className="ghost-chip"
                type="button"
                onClick={() => {
                  formCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                  window.setTimeout(() => labelInputRef.current?.focus(), 350);
                }}
                style={{ height: "36px", display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                <IconPlus style={{ width: "14px", height: "14px" }} />
                Tambah Link Pertama
              </button>
            </div>
          ) : filteredLinks.length === 0 ? (
            <div className="mylink-empty">
              <div className="mylink-empty-icon">
                <IconCompass />
              </div>
              <h3 className="mylink-empty-title">Tidak ada yang cocok</h3>
              <p className="mylink-empty-text">
                Tidak ada tautan MyLink yang cocok dengan kriteria pencarian atau penyaringan Anda.
              </p>
            </div>
          ) : (
            <>
              <div className="mylink-list">
                {paginatedLinks.map((link) => {
                  const meta = getProviderMeta(link.provider);
                  const usageCount = link.activities?.length ?? 0;
                  const isExpanded = expandedUsage[link.id] === true;
                  const visibleUsage = isExpanded
                    ? (link.activities ?? [])
                    : (link.activities ?? []).slice(0, USAGE_PREVIEW_LIMIT);
                  const hiddenUsage = usageCount - visibleUsage.length;

                  return (
                    <article key={link.id} className="link-card">
                      <div className="link-card-top">
                        <div
                          className="link-avatar"
                          style={{ background: meta.color }}
                          aria-hidden="true"
                        >
                          {meta.letter}
                        </div>
                        <div className="link-card-info">
                          <div className="link-card-label" title={link.label}>
                            {link.label}
                          </div>
                          <div className="link-card-url" title={link.actualUrl}>
                            {link.actualUrl}
                          </div>
                        </div>
                        <div className="link-card-actions">
                          <button
                            className="icon-btn"
                            type="button"
                            onClick={() => copyUrl(link)}
                            title="Salin URL"
                            aria-label="Salin URL"
                          >
                            <IconCopy />
                          </button>
                          <a
                            className="icon-btn"
                            href={link.actualUrl}
                            target="_blank"
                            rel="noopener noreferrer nofollow"
                            title="Buka tautan"
                            aria-label="Buka tautan"
                          >
                            <IconExternal />
                          </a>
                          <button
                            className="icon-btn"
                            type="button"
                            onClick={() => startEdit(link)}
                            title="Edit tautan"
                            aria-label="Edit tautan"
                          >
                            <IconEdit />
                          </button>
                          <button
                            className="icon-btn danger"
                            type="button"
                            onClick={() => setDeleteTarget(link)}
                            title="Hapus tautan"
                            aria-label="Hapus tautan"
                          >
                            <IconTrash />
                          </button>
                        </div>
                      </div>

                      <div className="link-card-meta">
                        <span
                          className="provider-chip"
                          style={{ color: meta.color, background: meta.soft }}
                        >
                          <span className="provider-dot" style={{ background: meta.color }} />
                          {link.provider}
                        </span>
                        {usageCount > 0 ? (
                          <span className="usage-badge used">
                            <IconRoute />
                            Dipakai di {usageCount} aktivitas
                          </span>
                        ) : (
                          <span className="usage-badge unused">Belum dipakai</span>
                        )}
                        {usageCount > 0 && (
                          <button
                            className="link-usage-toggle"
                            type="button"
                            onClick={() => toggleUsage(link.id)}
                          >
                            {isExpanded ? "Sembunyikan" : `Lihat ${usageCount} rute`}
                          </button>
                        )}
                        <span style={{ marginLeft: "auto", fontSize: "10.5px", color: "var(--muted-2)", fontWeight: 600 }}>
                          {formatDate(link.createdAt)}
                        </span>
                      </div>

                      {usageCount > 0 && isExpanded && (
                        <div className="usage-list">
                          {visibleUsage.map((act) => (
                            <div className="usage-item" key={act.id}>
                              <Link
                                href={`/itinerary/${act.day.itinerary.id}`}
                                style={{ fontWeight: 700, color: "var(--blue-strong)" }}
                              >
                                {act.day.itinerary.title}
                              </Link>
                              <span>
                                — Hari {act.day.dayNumber}: {act.title}
                              </span>
                            </div>
                          ))}
                          {hiddenUsage > 0 && (
                            <div className="usage-item" style={{ fontStyle: "italic" }}>
                              +{hiddenUsage} aktivitas lainnya
                            </div>
                          )}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="mylink-pagination">
                  <span className="mylink-page-info">
                    Menampilkan {startIndex + 1}–{endIndex} dari {sortedLinks.length} tautan
                  </span>
                  <div className="mylink-page-buttons">
                    <button
                      className="page-nav"
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={safePage === 1}
                    >
                      &larr;
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                      <button
                        key={pageNum}
                        className={`page-nav ${safePage === pageNum ? "active" : ""}`}
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </button>
                    ))}
                    <button
                      className="page-nav"
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                      disabled={safePage === totalPages}
                    >
                      &rarr;
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div
          className="mylink-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDeleteTarget(null);
          }}
        >
          <div className="mylink-modal" role="dialog" aria-modal="true" aria-labelledby="delete-title">
            <div className="mylink-modal-icon">
              <IconTrash />
            </div>
            <h2 className="mylink-modal-title" id="delete-title">
              Hapus tautan MyLink?
            </h2>
            <p className="mylink-modal-text">
              <strong>{deleteTarget.label}</strong> akan dihapus permanen dari pustaka Anda.{" "}
              {deleteTarget.activities && deleteTarget.activities.length > 0 ? (
                <>
                  {deleteTarget.activities.length} aktivitas itinerary yang menggunakan tautan ini akan
                  tetap ada, namun tidak lagi terhubung ke link MyLink.
                </>
              ) : (
                <>Tautan ini belum digunakan di aktivitas rute mana pun.</>
              )}
            </p>
            <div className="mylink-modal-actions">
              <button className="btn btn-ghost" type="button" onClick={() => setDeleteTarget(null)}>
                Batal
              </button>
              <button className="btn btn-danger" type="button" onClick={confirmDelete} disabled={deleting}>
                {deleting ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Kembali ke profil */}
      <div style={{ marginTop: "24px" }}>
        <Link className="plain-link" href={`/profile/${currentUser?.username ?? currentUser?.id ?? ""}`}>
          &larr; Kembali ke profil
        </Link>
      </div>
    </main>
  );
}
