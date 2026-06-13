"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon, IconSprite } from "@/components/icon-sprite";
import type { AdminSnapshot, AdminTable } from "@/lib/admin";
import { DEFAULT_ACTIVITY_TYPE } from "@/lib/activity-types";

type Props = {
  initialData: AdminSnapshot;
  adminEmail: string;
};

type TableConfig = {
  label: string;
  description: string;
  columns: string[];
  template: Record<string, unknown>;
};

const tableConfigs: Record<AdminTable, TableConfig> = {
  users: {
    label: "Users",
    description: "Kelola akun, profil, password hash, dan role admin.",
    columns: ["email", "username", "name", "role", "isPro", "proExpiresAt", "maxPrivate", "maxPublic", "maxSaved", "maxMyLink", "city", "createdAt"],
    template: {
      email: "new-user@example.com",
      username: "newuser",
      passwordHash: "",
      name: "New User",
      avatarUrl: "",
      bio: "",
      city: "Jakarta",
      role: "USER",
      isPro: false,
      proExpiresAt: null,
      maxPrivate: 2,
      maxPublic: 5,
      maxSaved: 5,
      maxMyLink: 50,
    },
  },
  itineraries: {
    label: "Itineraries",
    description: "Kelola record utama perjalanan beserta author, budget, dan status publish.",
    columns: ["title", "destination", "authorId", "travelStyle", "estimatedBudget", "isPublished"],
    template: {
      title: "Trip Baru",
      destination: "Bandung",
      description: "",
      durationDays: 3,
      estimatedBudget: 1500000,
      travelStyle: "Budget trip",
      coverImageUrl: "/uploads/default-cover.svg",
      notes: "",
      isPublished: true,
      originalItineraryId: null,
      authorId: "",
    },
  },
  days: {
    label: "Itinerary Days",
    description: "Atur hari per itinerary dengan nomor hari dan judulnya.",
    columns: ["itineraryId", "dayNumber", "title"],
    template: {
      itineraryId: "",
      dayNumber: 1,
      title: "Hari 1 - Kota Tujuan",
    },
  },
  activities: {
    label: "Activities",
    description: "Kelola aktivitas, urutan, kategori, dan biaya di tiap hari itinerary.",
    columns: ["itineraryDayId", "time", "title", "locationName", "latitude", "longitude", "category", "estimatedCost", "orderIndex"],
    template: {
      itineraryDayId: "",
      time: "09.00",
      title: "Aktivitas baru",
      locationName: "",
      formattedAddress: "",
      latitude: null,
      longitude: null,
      mapProvider: "",
      mapPlaceId: "",
      customLocation: false,
      description: "",
      estimatedCost: 0,
      category: DEFAULT_ACTIVITY_TYPE,
      orderIndex: 0,
    },
  },
  saves: {
    label: "Saved Itineraries",
    description: "Kelola hubungan user yang menyimpan itinerary.",
    columns: ["userId", "itineraryId", "createdAt"],
    template: {
      userId: "",
      itineraryId: "",
      createdAt: new Date().toISOString(),
    },
  },
  likes: {
    label: "Likes",
    description: "Kelola hubungan like antara user dan itinerary.",
    columns: ["userId", "itineraryId", "createdAt"],
    template: {
      userId: "",
      itineraryId: "",
      createdAt: new Date().toISOString(),
    },
  },
  sessions: {
    label: "Sessions",
    description: "Kelola session aktif, token hash, dan masa berlakunya.",
    columns: ["userId", "token", "expiresAt", "createdAt"],
    template: {
      userId: "",
      token: "",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
    },
  },
  myLinkWhitelistDomains: {
    label: "Whitelist Domains MyLink",
    description: "Kelola domain partner resmi yang diizinkan sistem (misal *.klook.com, wa.me).",
    columns: ["domainPattern", "isActive", "description", "createdAt"],
    template: {
      domainPattern: "*.klook.com",
      isActive: true,
      description: "Klook Partner Link",
    },
  },
  appSettings: {
    label: "App Settings",
    description: "Kelola konfigurasi aplikasi (seperti nomor whatsapp).",
    columns: ["key", "value"],
    template: {
      key: "whatsapp_number",
      value: "088293681133",
    },
  },
};

function stripMeta(record: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(record).filter(([key]) => !key.startsWith("_")));
}

function formatCell(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

export function AdminConsole({ initialData, adminEmail }: Props) {
  const [tables, setTables] = useState(initialData);
  const [currentTable, setCurrentTable] = useState<AdminTable>("users");
  const [editorMode, setEditorMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState(JSON.stringify(tableConfigs.users.template, null, 2));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [editorTab, setEditorTab] = useState<"form" | "json">("form");

  const config = tableConfigs[currentTable];
  const records = tables[currentTable];

  function setToast(next: string) {
    setMessage(next);
    window.setTimeout(() => setMessage(""), 2600);
  }

  function resetDraft(table: AdminTable) {
    setEditorMode("create");
    setEditingId(null);
    setDraft(JSON.stringify(tableConfigs[table].template, null, 2));
    setEditorTab("form");
  }

  function updateDraftField(key: string, value: unknown) {
    try {
      const parsed = JSON.parse(draft) as Record<string, unknown>;
      parsed[key] = value;
      setDraft(JSON.stringify(parsed, null, 2));
    } catch (err) {
      // ignore
    }
  }

  function formatLabel(key: string) {
    return key
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase());
  }

  async function refreshTable(table: AdminTable) {
    const response = await fetch(`/api/admin/${table}`);
    if (!response.ok) {
      throw new Error(await response.text());
    }

    const payload = (await response.json()) as { records: Record<string, unknown>[] };
    setTables((previous) => ({
      ...previous,
      [table]: payload.records,
    }));
  }

  async function handleSave() {
    setBusy(true);

    try {
      const parsed = JSON.parse(draft) as Record<string, unknown>;
      const targetUrl =
        editorMode === "create"
          ? `/api/admin/${currentTable}`
          : `/api/admin/${currentTable}/${editingId}`;
      const method = editorMode === "create" ? "POST" : "PATCH";

      const response = await fetch(targetUrl, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ data: parsed }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      await refreshTable(currentTable);
      resetDraft(currentTable);
      setToast(editorMode === "create" ? "Record berhasil dibuat." : "Record berhasil diperbarui.");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Gagal menyimpan record.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Hapus record ini? Aksi ini tidak bisa dibatalkan.")) {
      return;
    }

    setBusy(true);

    try {
      const response = await fetch(`/api/admin/${currentTable}/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      await refreshTable(currentTable);
      if (editingId === id) {
        resetDraft(currentTable);
      }
      setToast("Record berhasil dihapus.");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Gagal menghapus record.");
    } finally {
      setBusy(false);
    }
  }

  function getSubscriptionOption(expiryDateStr: string | null | undefined, isPro: boolean) {
    if (!isPro) return "free";
    if (!expiryDateStr) return "pro_indefinite";
    
    const expiry = new Date(expiryDateStr);
    const diffTime = expiry.getTime() - Date.now();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) return "free";
    if (diffDays <= 32) return "pro_1m";
    if (diffDays <= 93) return "pro_3m";
    if (diffDays <= 185) return "pro_6m";
    if (diffDays <= 367) return "pro_1y";
    return "pro_indefinite";
  }

  async function handleSubscriptionChange(id: string, record: Record<string, unknown>, value: string) {
    setBusy(true);
    try {
      let isPro = false;
      let proExpiresAt: string | null = null;
      let limits = {
        maxPrivate: 2,
        maxPublic: 5,
        maxSaved: 5,
        maxMyLink: 50,
      };

      if (value !== "free") {
        isPro = true;
        limits = {
          maxPrivate: 100,
          maxPublic: 100,
          maxSaved: 100,
          maxMyLink: 100,
        };

        const now = new Date();
        if (value === "pro_1m") {
          now.setMonth(now.getMonth() + 1);
          proExpiresAt = now.toISOString();
        } else if (value === "pro_3m") {
          now.setMonth(now.getMonth() + 3);
          proExpiresAt = now.toISOString();
        } else if (value === "pro_6m") {
          now.setMonth(now.getMonth() + 6);
          proExpiresAt = now.toISOString();
        } else if (value === "pro_1y") {
          now.setFullYear(now.getFullYear() + 1);
          proExpiresAt = now.toISOString();
        }
      }

      const updatedData = {
        ...stripMeta(record),
        isPro,
        proExpiresAt,
        ...limits,
      };

      const response = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ data: updatedData }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      await refreshTable("users");
      setToast("Langganan berhasil diperbarui.");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Gagal memperbarui langganan.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <IconSprite />
      <main className="admin-shell">
        <header className="admin-topbar">
          <div>
            <p>Admin Console</p>
            <h1>Kelola semua tabel Jalanin</h1>
            <span>{adminEmail}</span>
          </div>
          <div className="admin-topbar-actions">
            <form action="/api/auth/logout" method="post">
              <button className="ghost-chip" type="submit">
                Logout
              </button>
            </form>
            <Link className="ghost-chip" href="/">
              Kembali ke app
            </Link>
            <button
              className="primary-button"
              onClick={() => refreshTable(currentTable).then(() => setToast("Data diperbarui."))}
              disabled={busy}
            >
              <Icon name="route" />
              <span>Refresh tabel</span>
            </button>
          </div>
        </header>

        <section className="admin-summary-grid">
          {(Object.keys(tableConfigs) as AdminTable[]).map((table) => (
            <button
              key={table}
              className={`admin-summary-card ${currentTable === table ? "active" : ""}`}
              onClick={() => {
                setCurrentTable(table);
                resetDraft(table);
              }}
            >
              <strong>{tables[table].length}</strong>
              <span>{tableConfigs[table].label}</span>
            </button>
          ))}
        </section>

        <section className="admin-workspace">
          <div className="admin-table-panel">
            <div className="admin-panel-heading">
              <div>
                <p>{config.label}</p>
                <h2>{config.description}</h2>
              </div>
              <button className="ghost-chip" onClick={() => resetDraft(currentTable)}>
                <Icon name="plus" />
                <span>New record</span>
              </button>
            </div>

            <div className="admin-table-scroll">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    {config.columns.map((column) => (
                      <th key={column}>{column}</th>
                    ))}
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => {
                    const id = String(record.id ?? record.key ?? "");
                    return (
                      <tr key={id}>
                        <td className="mono-cell">{id}</td>
                        {config.columns.map((column) => (
                          <td key={column}>{formatCell(record[column])}</td>
                        ))}
                        <td>
                          <div className="admin-row-actions">
                            <button
                              className="ghost-chip"
                              onClick={() => {
                                setEditorMode("edit");
                                setEditingId(id);
                                setDraft(JSON.stringify(stripMeta(record), null, 2));
                                setEditorTab("form");
                              }}
                            >
                              Edit
                            </button>
                            <button className="ghost-chip danger" onClick={() => handleDelete(id)}>
                              Delete
                            </button>
                            {currentTable === "users" && (
                              <select
                                className="admin-select-sub"
                                value={getSubscriptionOption(record.proExpiresAt as string | null | undefined, record.isPro as boolean)}
                                onChange={(e) => handleSubscriptionChange(id, record, e.target.value)}
                                disabled={busy}
                              >
                                <option value="free">Plan: FREE</option>
                                <option value="pro_1m">PRO (1 Bulan)</option>
                                <option value="pro_3m">PRO (3 Bulan)</option>
                                <option value="pro_6m">PRO (6 Bulan)</option>
                                <option value="pro_1y">PRO (1 Tahun)</option>
                                <option value="pro_indefinite">PRO (Seterusnya)</option>
                              </select>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <aside className="admin-editor-panel">
            <div className="admin-panel-heading">
              <div>
                <p>{editorMode === "create" ? "Create" : "Edit"}</p>
                <h2>{editorMode === "create" ? `Buat ${config.label}` : `Edit ${config.label}`}</h2>
              </div>
            </div>

            <div className="admin-tab-bar">
              <button
                type="button"
                className={`admin-tab-btn ${editorTab === "form" ? "active" : ""}`}
                onClick={() => setEditorTab("form")}
              >
                Form Editor
              </button>
              <button
                type="button"
                className={`admin-tab-btn ${editorTab === "json" ? "active" : ""}`}
                onClick={() => setEditorTab("json")}
              >
                JSON Editor
              </button>
            </div>

            {(() => {
              let parsedDraft: Record<string, unknown> = {};
              let parseError = "";
              try {
                parsedDraft = JSON.parse(draft);
              } catch (err) {
                parseError = err instanceof Error ? err.message : "Invalid JSON";
              }
              const formFields = Object.keys(parsedDraft).filter(key => !key.startsWith("_"));

              if (editorTab === "form" && !parseError) {
                return (
                  <div className="admin-form-container">
                    {formFields.map((key) => {
                      const value = parsedDraft[key];
                      const labelText = formatLabel(key);

                      if (currentTable === "users" && (key === "isPro" || key === "proExpiresAt")) {
                        if (key === "proExpiresAt") return null;

                        const isProVal = !!parsedDraft.isPro;
                        const expiresAtVal = parsedDraft.proExpiresAt as string | null | undefined;
                        const currentPlan = getSubscriptionOption(expiresAtVal, isProVal);

                        return (
                          <div key="plan-selector" className="admin-form-group">
                            <label htmlFor="form-field-plan">Subscription Plan</label>
                            <select
                              id="form-field-plan"
                              value={currentPlan}
                              onChange={(e) => {
                                const val = e.target.value;
                                let isPro = false;
                                let proExpiresAt: string | null = null;
                                let limits = {
                                  maxPrivate: 2,
                                  maxPublic: 5,
                                  maxSaved: 5,
                                  maxMyLink: 50,
                                };

                                if (val !== "free") {
                                  isPro = true;
                                  limits = {
                                    maxPrivate: 100,
                                    maxPublic: 100,
                                    maxSaved: 100,
                                    maxMyLink: 100,
                                  };

                                  const now = new Date();
                                  if (val === "pro_1m") {
                                    now.setMonth(now.getMonth() + 1);
                                    proExpiresAt = now.toISOString();
                                  } else if (val === "pro_3m") {
                                    now.setMonth(now.getMonth() + 3);
                                    proExpiresAt = now.toISOString();
                                  } else if (val === "pro_6m") {
                                    now.setMonth(now.getMonth() + 6);
                                    proExpiresAt = now.toISOString();
                                  } else if (val === "pro_1y") {
                                    now.setFullYear(now.getFullYear() + 1);
                                    proExpiresAt = now.toISOString();
                                  }
                                }

                                try {
                                  const parsed = JSON.parse(draft) as Record<string, unknown>;
                                  parsed.isPro = isPro;
                                  parsed.proExpiresAt = proExpiresAt;
                                  parsed.maxPrivate = limits.maxPrivate;
                                  parsed.maxPublic = limits.maxPublic;
                                  parsed.maxSaved = limits.maxSaved;
                                  parsed.maxMyLink = limits.maxMyLink;
                                  setDraft(JSON.stringify(parsed, null, 2));
                                } catch (err) {
                                  // ignore
                                }
                              }}
                            >
                              <option value="free">FREE PLAN</option>
                              <option value="pro_1m">PRO (1 Bulan)</option>
                              <option value="pro_3m">PRO (3 Bulan)</option>
                              <option value="pro_6m">PRO (6 Bulan)</option>
                              <option value="pro_1y">PRO (1 Tahun)</option>
                              <option value="pro_indefinite">PRO (Seterusnya)</option>
                            </select>
                          </div>
                        );
                      }

                      if (typeof value === "boolean") {
                        return (
                          <div key={key} className="admin-form-checkbox">
                            <input
                              id={`form-field-${key}`}
                              type="checkbox"
                              checked={value}
                              onChange={(e) => updateDraftField(key, e.target.checked)}
                            />
                            <label htmlFor={`form-field-${key}`}>{labelText}</label>
                          </div>
                        );
                      }

                      return (
                        <div key={key} className="admin-form-group">
                          <label htmlFor={`form-field-${key}`}>{labelText}</label>
                          {currentTable === "appSettings" && key === "key" && editorMode === "edit" ? (
                            <input
                              id={`form-field-${key}`}
                              type="text"
                              value={value !== null && value !== undefined ? String(value) : ""}
                              disabled
                              style={{ background: "var(--surface-soft)", color: "var(--muted)", cursor: "not-allowed" }}
                            />
                          ) : key === "role" ? (
                            <select
                              id={`form-field-${key}`}
                              value={String(value ?? "USER")}
                              onChange={(e) => updateDraftField(key, e.target.value)}
                            >
                              <option value="USER">USER</option>
                              <option value="ADMIN">ADMIN</option>
                            </select>
                          ) : key === "bio" || key === "description" || key === "notes" ? (
                            <textarea
                              id={`form-field-${key}`}
                              value={String(value ?? "")}
                              onChange={(e) => updateDraftField(key, e.target.value)}
                              rows={3}
                            />
                          ) : key.endsWith("At") ? (
                            <input
                              id={`form-field-${key}`}
                              type="datetime-local"
                              value={value ? new Date(String(value)).toISOString().slice(0, 16) : ""}
                              onChange={(e) => updateDraftField(key, e.target.value ? new Date(e.target.value).toISOString() : null)}
                            />
                          ) : typeof value === "number" ? (
                            <input
                              id={`form-field-${key}`}
                              type="number"
                              value={value !== null && value !== undefined ? String(value) : ""}
                              onChange={(e) => updateDraftField(key, e.target.value === "" ? null : Number(e.target.value))}
                            />
                          ) : (
                            <input
                              id={`form-field-${key}`}
                              type="text"
                              value={value !== null && value !== undefined ? String(value) : ""}
                              onChange={(e) => updateDraftField(key, e.target.value)}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              }

              return (
                <>
                  {parseError && (
                    <div className="admin-form-error">
                      Format JSON tidak valid: {parseError}. Menampilkan JSON Editor.
                    </div>
                  )}
                  <textarea
                    className="admin-editor"
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    spellCheck={false}
                  />
                </>
              );
            })()}

            <div className="admin-editor-actions">
              <button className="primary-button wide" onClick={handleSave} disabled={busy}>
                {busy ? "Menyimpan..." : editorMode === "create" ? "Create record" : "Update record"}
              </button>
              <button className="ghost-chip wide" onClick={() => resetDraft(currentTable)} disabled={busy}>
                Reset template
              </button>
            </div>

            <div className="empty-state">
              {currentTable === "appSettings" ? (
                <div style={{ textAlign: "left", fontSize: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                  <strong style={{ color: "var(--ink)" }}>Panduan Kunci App Settings:</strong>
                  <ul style={{ paddingLeft: "16px", margin: 0, display: "flex", flexDirection: "column", gap: "4px" }}>
                    <li><code>whatsapp_number</code>: Nomor WhatsApp Admin (contoh: <code>088293681133</code>)</li>
                    <li><code>price_1m / 3m / 6m / 1y</code>: Harga Plan (contoh: <code>Rp 29.900</code>)</li>
                    <li><code>rate_1m / 3m / 6m / 1y</code>: Biaya/Keterangan (contoh: <code>/bulan</code>, <code>Rp 26.633/bln</code>)</li>
                    <li><code>promo_1m / 3m / 6m / 1y</code>: Badge Promo/Hemat (contoh: <code>hemat</code>, <code>11% Hemat</code>)</li>
                    <li><code>email_whitelist</code>: Whitelist domain email yang diperbolehkan daftar (contoh: <code>gmail.com,outlook.com,yahoo.com,icloud.com</code>)</li>
                  </ul>
                </div>
              ) : (
                <>
                  Gunakan JSON untuk mengelola semua field pada tabel ini. Field tambahan dengan prefix
                  `_` hanya untuk display dan akan diabaikan saat simpan.
                </>
              )}
            </div>
          </aside>
        </section>
      </main>

      <div className={`toast ${message ? "show" : ""}`} role="status">
        {message}
      </div>
    </>
  );
}
