"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { Icon, IconSprite } from "./icon-sprite";
import { formatCompact, formatRupiah } from "@/lib/format";

export type JalaninUser = {
  id: string;
  name: string | null;
  username: string | null;
  email: string;
  avatarUrl: string | null;
  bio: string | null;
  city: string | null;
};

export type JalaninActivity = {
  id: string;
  time: string;
  title: string;
  locationName: string;
  estimatedCost: number;
  category: string;
  orderIndex: number;
};

export type JalaninDay = {
  id: string;
  dayNumber: number;
  title: string;
  activities: JalaninActivity[];
};

export type JalaninItinerary = {
  id: string;
  title: string;
  destination: string;
  description: string;
  durationDays: number;
  estimatedBudget: number;
  travelStyle: string;
  coverImageUrl: string;
  notes: string;
  author: JalaninUser;
  days: JalaninDay[];
  savesCount: number;
  likesCount: number;
  copiesCount: number;
};

type Props = {
  itineraries: JalaninItinerary[];
  currentUser: JalaninUser | null;
  savedIds: string[];
  likedIds: string[];
};

const filters = ["Semua", "Budget trip", "Kuliner", "Nature", "Family", "City tour"];

function activityIcon(category: string) {
  const value = category.toLowerCase();
  if (value.includes("makan") || value.includes("kuliner")) return "food";
  if (value.includes("transport")) return "car";
  if (value.includes("stay") || value.includes("hotel")) return "hotel";
  if (value.includes("flight") || value.includes("tiba")) return "plane";
  return "camera";
}

export function JalaninApp({ itineraries, currentUser, savedIds, likedIds }: Props) {
  const [items, setItems] = useState(itineraries);
  const [currentId, setCurrentId] = useState(itineraries[0]?.id ?? "");
  const [tab, setTab] = useState<"summary" | "days" | "map">("summary");
  const [dayIndex, setDayIndex] = useState(0);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("Semua");
  const [saved, setSaved] = useState(savedIds);
  const [liked, setLiked] = useState(likedIds);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [cloneSource, setCloneSource] = useState<JalaninItinerary | null>(null);
  const [toast, setToast] = useState("");
  const current = items.find((item) => item.id === currentId) ?? items[0];

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return items.filter((item) => {
      const matchesFilter = filter === "Semua" || item.travelStyle === filter;
      const haystack = `${item.title} ${item.destination} ${item.travelStyle}`.toLowerCase();
      return matchesFilter && (!normalized || haystack.includes(normalized));
    });
  }, [filter, items, query]);

  function flash(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2400);
  }

  async function mutate(url: string, init?: RequestInit) {
    const response = await fetch(url, init);

    if (response.status === 401) {
      flash("Login dulu untuk memakai fitur ini.");
      return null;
    }

    if (!response.ok) {
      flash(await response.text());
      return null;
    }

    return response.json();
  }

  async function toggleSave() {
    if (!current) return;

    const isSaved = saved.includes(current.id);
    const result = await mutate(`/api/itineraries/${current.id}/save`, {
      method: isSaved ? "DELETE" : "POST",
    });

    if (!result) return;
    setSaved((previous) => (isSaved ? previous.filter((id) => id !== current.id) : [...previous, current.id]));
    setItems((previous) =>
      previous.map((item) =>
        item.id === current.id
          ? {
              ...item,
              savesCount: Math.max(0, item.savesCount + (isSaved ? -1 : 1)),
            }
          : item,
      ),
    );
    flash(isSaved ? "Rute dihapus dari koleksi." : "Rute berhasil disimpan.");
  }

  async function toggleLike() {
    if (!current) return;

    const isLiked = liked.includes(current.id);
    const result = await mutate(`/api/itineraries/${current.id}/like`, {
      method: isLiked ? "DELETE" : "POST",
    });

    if (!result) return;
    setLiked((previous) => (isLiked ? previous.filter((id) => id !== current.id) : [...previous, current.id]));
    setItems((previous) =>
      previous.map((item) =>
        item.id === current.id
          ? {
              ...item,
              likesCount: Math.max(0, item.likesCount + (isLiked ? -1 : 1)),
            }
          : item,
      ),
    );
  }

  async function cloneItinerary() {
    if (!current) return;

    const result = await mutate(`/api/itineraries/${current.id}/clone`, {
      method: "POST",
    });

    if (!result) return;
    window.location.href = `/itinerary/${result.id}`;
  }

  async function submitCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const imageFile = formData.get("imageFile");

    if (imageFile instanceof File && imageFile.size > 0) {
      const uploadData = new FormData();
      uploadData.set("file", imageFile);
      const upload = await mutate("/api/upload", {
        method: "POST",
        body: uploadData,
      });
      if (!upload) return;
      formData.set("coverImageUrl", upload.url);
    }

    const result = await mutate("/api/itineraries", {
      method: "POST",
      body: formData,
    });

    if (!result) return;
    setItems((previous) => [result, ...previous]);
    setCurrentId(result.id);
    setDrawerOpen(false);
    setCloneSource(null);
    flash("Itinerary berhasil dipublish.");
    form.reset();
  }

  if (!current) {
    return (
      <div className="page-center">
        <div className="empty-state">Belum ada itinerary. Login dan buat itinerary pertama.</div>
      </div>
    );
  }

  const currentDay = current.days[dayIndex] ?? current.days[0];
  const savedItems = items.filter((item) => saved.includes(item.id));

  return (
    <>
      <IconSprite />
      <div className="app-shell">
        <header className="topbar">
          <button className="brand" onClick={() => setCurrentId(items[0]?.id ?? current.id)} aria-label="Jalanin home">
            <span className="brand-mark" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
            <span>Jalanin</span>
          </button>

          <label className="searchbox">
            <Icon name="search" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} type="search" placeholder="Cari Bali 3 hari, Jogja kuliner..." />
          </label>

          <nav className="top-actions" aria-label="Navigasi utama">
            <Link className="tool-button" href="/saved" data-tooltip="Rute tersimpan">
              <Icon name="bookmark" />
            </Link>
            <button className="primary-button" onClick={() => setDrawerOpen(true)}>
              <Icon name="plus" />
              <span>Buat Itinerary</span>
            </button>
            {currentUser ? (
              <Link className="avatar-button" href={`/profile/${currentUser.username ?? currentUser.id}`} aria-label="Profil">
                <img src={currentUser.avatarUrl ?? "/uploads/default-cover.svg"} alt={currentUser.name ?? currentUser.email} />
              </Link>
            ) : (
              <Link className="mini-button" href="/login">
                Login
              </Link>
            )}
          </nav>
        </header>

        <main className="workspace">
          <section className="main-column">
            <section className="hero-card">
              <img src={current.coverImageUrl} alt={current.destination} />
              <div className="hero-overlay">
                <p>{current.destination}</p>
                <h1>{current.title}</h1>
                <div className="creator-line">
                  <img src={current.author.avatarUrl ?? "/uploads/default-cover.svg"} alt={current.author.name ?? current.author.email} />
                  <span>{current.author.name ?? current.author.username ?? current.author.email}</span>
                </div>
              </div>
            </section>

            <section className="quick-meta" aria-label="Ringkasan itinerary">
              <span className="meta-item">
                <Icon name="calendar" />
                <span>
                  Durasi: <strong>{current.durationDays} hari</strong>
                </span>
              </span>
              <span className="meta-item">
                <Icon name="wallet" />
                <span>
                  Total: <strong>{formatRupiah(current.estimatedBudget)}</strong>
                </span>
              </span>
              <span className="meta-item">
                <Icon name="route" />
                <span>
                  Biaya/hari: <strong>{formatRupiah(Math.round(current.estimatedBudget / current.durationDays))}</strong>
                </span>
              </span>
              <span className="meta-item">
                <Icon name="star" />
                <span>
                  Style: <strong>{current.travelStyle}</strong>
                </span>
              </span>
            </section>

            <section className="action-row" aria-label="Aksi itinerary">
              <button className={`pill-button ${liked.includes(current.id) ? "active" : ""}`} onClick={toggleLike}>
                <Icon name="heart" />
                <span>Suka ({formatCompact(current.likesCount)})</span>
              </button>
              <button className={`pill-button ${saved.includes(current.id) ? "active" : ""}`} onClick={toggleSave}>
                <Icon name="bookmark" />
                <span>{saved.includes(current.id) ? "Tersimpan" : `Simpan Rute (${formatCompact(current.savesCount)})`}</span>
              </button>
              <button className="pill-button strong" onClick={cloneItinerary}>
                <Icon name="copy" />
                <span>Jalanin Rute Ini</span>
              </button>
              <button
                className="pill-button"
                onClick={() => {
                  navigator.clipboard?.writeText(`${location.origin}/itinerary/${current.id}`);
                  flash("Tautan itinerary berhasil disalin.");
                }}
              >
                <Icon name="share" />
                <span>Bagikan</span>
              </button>
            </section>

            <section className="tabs" aria-label="Konten itinerary">
              {[
                ["summary", "grid", "Ringkasan"],
                ["days", "calendar", "Hari demi Hari"],
                ["map", "route", "Peta"],
              ].map(([value, icon, label]) => (
                <button key={value} className={`tab ${tab === value ? "active" : ""}`} onClick={() => setTab(value as typeof tab)}>
                  <Icon name={icon} />
                  {label}
                </button>
              ))}
            </section>

            <section className="tab-panel">
              {tab === "summary" && (
                <>
                  <div className="summary-grid">
                    <article className="summary-card">
                      <span className="summary-icon">
                        <Icon name="compass" />
                      </span>
                      <h3>Konsep Trip</h3>
                      <p>{current.description}</p>
                    </article>
                    <article className="summary-card">
                      <span className="summary-icon">
                        <Icon name="wallet" />
                      </span>
                      <h3>Budget Realistis</h3>
                      <p>
                        {formatRupiah(current.estimatedBudget)} untuk {current.durationDays} hari, sekitar{" "}
                        {formatRupiah(Math.round(current.estimatedBudget / current.durationDays))} per hari.
                      </p>
                    </article>
                    <article className="summary-card">
                      <span className="summary-icon">
                        <Icon name="route" />
                      </span>
                      <h3>Siap Digunakan</h3>
                      <p>{current.copiesCount} traveler sudah memakai rute ini sebagai template perjalanan pribadi.</p>
                    </article>
                  </div>
                  <article className="notes-card">
                    <h3>Catatan creator</h3>
                    <p>{current.notes || "Belum ada catatan tambahan."}</p>
                  </article>
                </>
              )}

              {tab === "days" && currentDay && (
                <>
                  <div className="day-title">
                    <h2>{currentDay.title}</h2>
                    <div className="day-switcher">
                      {current.days.map((day, index) => (
                        <button key={day.id} className={index === dayIndex ? "active" : ""} onClick={() => setDayIndex(index)}>
                          {day.dayNumber}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="timeline">
                    {currentDay.activities.map((activity) => (
                      <article className="activity-card" key={activity.id}>
                        <div className="activity-time">{activity.time}</div>
                        <div className="activity-icon">
                          <Icon name={activityIcon(activity.category)} />
                        </div>
                        <div className="activity-main">
                          <strong>{activity.title}</strong>
                          <span>{activity.locationName || activity.category}</span>
                        </div>
                        <div className="activity-cost">{activity.estimatedCost ? formatRupiah(activity.estimatedCost) : "Gratis"}</div>
                      </article>
                    ))}
                  </div>
                </>
              )}

              {tab === "map" && (
                <div className="route-board">
                  <div className="large-map">
                    <span className="map-pin">1</span>
                    <span className="map-pin">2</span>
                    <span className="map-pin">3</span>
                    <span className="map-pin">4</span>
                  </div>
                  <div className="route-list">
                    {current.days
                      .flatMap((day) => day.activities)
                      .slice(0, 4)
                      .map((activity, index) => (
                        <article className="route-step" key={activity.id}>
                          <span>{index + 1}</span>
                          <div>
                            <strong>{activity.title}</strong>
                            <small>
                              {activity.time} - {activity.category}
                            </small>
                          </div>
                        </article>
                      ))}
                  </div>
                </div>
              )}
            </section>

            <section className="feed-section">
              <div className="section-heading">
                <div>
                  <p>Jelajah itinerary</p>
                  <h2>Rute populer minggu ini</h2>
                </div>
                <div className="filter-chips">
                  {filters.map((option) => (
                    <button key={option} className={`chip ${filter === option ? "active" : ""}`} onClick={() => setFilter(option)}>
                      {option}
                    </button>
                  ))}
                </div>
              </div>
              <div className="feed-grid">
                {filteredItems.map((item) => (
                  <article className="feed-card" key={item.id}>
                    <button
                      onClick={() => {
                        setCurrentId(item.id);
                        setDayIndex(0);
                        setTab("summary");
                        document.querySelector(".app-shell")?.scrollIntoView({ behavior: "smooth", block: "start" });
                      }}
                    >
                      <img src={item.coverImageUrl} alt={item.destination} />
                      <div className="feed-card-body">
                        <h3>{item.title}</h3>
                        <p>{item.destination}</p>
                        <div className="feed-card-meta">
                          <span>
                            <Icon name="calendar" />
                            {item.durationDays} hari
                          </span>
                          <span>
                            <Icon name="wallet" />
                            {formatRupiah(item.estimatedBudget)}
                          </span>
                        </div>
                        <span className="detail-link">Buka detail</span>
                      </div>
                    </button>
                  </article>
                ))}
              </div>
            </section>
          </section>

          <aside className="sidebar">
            <section className="side-card budget-card">
              <div className="side-heading">
                <h2>Ringkasan Biaya</h2>
                <span>{current.travelStyle}</span>
              </div>
              <div className="budget-total">
                <span>Total</span>
                <strong>{formatRupiah(current.estimatedBudget)}</strong>
              </div>
              <div className="budget-meter">
                <span />
              </div>
              <div className="budget-lines">
                {["Transport", "Makan", "Tiket", "Stay"].map((label, index) => (
                  <div className="budget-line" key={label}>
                    <Icon name={index === 0 ? "car" : index === 1 ? "food" : index === 2 ? "camera" : "hotel"} />
                    <span>{label}</span>
                    <strong>{formatRupiah(Math.round(current.estimatedBudget * [0.25, 0.3, 0.2, 0.25][index]))}</strong>
                  </div>
                ))}
              </div>
            </section>

            <section className="side-card">
              <div className="side-heading">
                <h2>Tag & Musim</h2>
              </div>
              <div className="tag-list">
                {[current.travelStyle, current.destination.split(",")[0], `${current.durationDays} hari`, "MVP"].map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            </section>

            <section className="side-card author-card">
              <div className="side-heading">
                <h2>Author Box</h2>
              </div>
              <div className="author-row">
                <img src={current.author.avatarUrl ?? "/uploads/default-cover.svg"} alt={current.author.name ?? current.author.email} />
                <div>
                  <strong>{current.author.name ?? current.author.username ?? current.author.email}</strong>
                  <span>{current.author.bio ?? "Traveler Jalanin"}</span>
                </div>
                <Link className="mini-button" href={`/profile/${current.author.username ?? current.author.id}`}>
                  Profil
                </Link>
              </div>
            </section>

            <section className="side-card map-card">
              <div className="map-preview" aria-label="Preview peta rute">
                <span className="mini-pin">1</span>
                <span className="mini-pin">2</span>
                <span className="mini-pin">3</span>
                <span className="mini-pin">4</span>
              </div>
              <div className="map-controls">
                <button className="mini-button muted">Day Switcher</button>
                <button className="mini-button">Day {dayIndex + 1}</button>
              </div>
            </section>

            <section className="side-card saved-card">
              <div className="side-heading">
                <h2>Koleksi Kamu</h2>
                <span>{savedItems.length}</span>
              </div>
              <div className="compact-list">
                {savedItems.length ? (
                  savedItems.map((item) => (
                    <button key={item.id} className="compact-item" onClick={() => setCurrentId(item.id)}>
                      <img src={item.coverImageUrl} alt={item.destination} />
                      <span>
                        <strong>{item.title}</strong>
                        <span>
                          {item.durationDays} hari - {formatRupiah(item.estimatedBudget)}
                        </span>
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="empty-state">Belum ada rute tersimpan. Simpan itinerary yang ingin kamu pakai nanti.</div>
                )}
              </div>
            </section>
          </aside>
        </main>
      </div>

      <section className={`drawer ${drawerOpen ? "open" : ""}`} aria-hidden={!drawerOpen} aria-label="Form itinerary">
        <div className="drawer-backdrop" onClick={() => setDrawerOpen(false)} />
        <div className="drawer-panel" role="dialog" aria-modal="true" aria-labelledby="drawerTitle">
          <div className="drawer-header">
            <div>
              <p>Itinerary pribadi</p>
              <h2 id="drawerTitle">{cloneSource ? "Edit Rute Salinan" : "Buat Itinerary"}</h2>
            </div>
            <button className="tool-button" onClick={() => setDrawerOpen(false)} aria-label="Tutup">
              <Icon name="x" />
            </button>
          </div>
          <form className="itinerary-form" onSubmit={submitCreate}>
            <label>
              <span>Judul itinerary</span>
              <input name="title" required defaultValue={cloneSource ? `${cloneSource.title} (Versi Saya)` : ""} />
            </label>
            <div className="form-grid">
              <label>
                <span>Destinasi utama</span>
                <input name="destination" required defaultValue={cloneSource?.destination ?? ""} />
              </label>
              <label>
                <span>Durasi</span>
                <input name="durationDays" type="number" min="1" required defaultValue={cloneSource?.durationDays ?? 3} />
              </label>
            </div>
            <label>
              <span>Cover image upload</span>
              <input name="imageFile" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" />
            </label>
            <input type="hidden" name="coverImageUrl" defaultValue={cloneSource?.coverImageUrl ?? "/uploads/default-cover.svg"} />
            <div className="form-grid">
              <label>
                <span>Estimasi budget</span>
                <input name="estimatedBudget" type="number" min="0" step="50000" required defaultValue={cloneSource?.estimatedBudget ?? 1500000} />
              </label>
              <label>
                <span>Travel style</span>
                <select name="travelStyle" defaultValue={cloneSource?.travelStyle ?? "Budget trip"}>
                  <option>Budget trip</option>
                  <option>Kuliner</option>
                  <option>Couple</option>
                  <option>Nature</option>
                  <option>City tour</option>
                  <option>Family</option>
                </select>
              </label>
            </div>
            <label>
              <span>Deskripsi singkat</span>
              <textarea name="description" rows={4} required defaultValue={cloneSource?.description ?? ""} />
            </label>
            <label>
              <span>Catatan tambahan</span>
              <textarea name="notes" rows={3} defaultValue={cloneSource?.notes ?? ""} />
            </label>
            <label>
              <span>Aktivitas hari pertama</span>
              <textarea
                name="activities"
                rows={5}
                placeholder={"09.00 - Tiba di kota tujuan\n12.00 - Makan siang lokal"}
                defaultValue={cloneSource?.days[0]?.activities.map((activity) => `${activity.time} - ${activity.title}`).join("\n") ?? ""}
              />
            </label>
            <button className="primary-button wide" type="submit">
              <Icon name="plus" />
              <span>Publish Itinerary</span>
            </button>
          </form>
        </div>
      </section>

      <nav className="mobile-nav" aria-label="Navigasi mobile">
        <button onClick={() => document.querySelector(".feed-section")?.scrollIntoView({ behavior: "smooth", block: "start" })}>
          <Icon name="compass" />
          <span>Jelajah</span>
        </button>
        <Link href="/saved">
          <Icon name="bookmark" />
          <span>Simpan</span>
        </Link>
        <button onClick={() => setDrawerOpen(true)}>
          <Icon name="plus" />
          <span>Buat</span>
        </button>
        <Link href={currentUser ? `/profile/${currentUser.username ?? currentUser.id}` : "/login"}>
          <Icon name="user" />
          <span>Profil</span>
        </Link>
      </nav>

      <div className={`toast ${toast ? "show" : ""}`} role="status">
        {toast}
      </div>
    </>
  );
}
