"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon, IconSprite } from "@/components/icon-sprite";
import type { AdminSnapshot, AdminTable } from "@/lib/admin";

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
    columns: ["email", "username", "name", "role", "city", "createdAt"],
    template: {
      email: "new-user@example.com",
      username: "newuser",
      passwordHash: "",
      name: "New User",
      avatarUrl: "",
      bio: "",
      city: "Jakarta",
      role: "USER",
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
    columns: ["itineraryDayId", "time", "title", "category", "estimatedCost", "orderIndex"],
    template: {
      itineraryDayId: "",
      time: "09.00",
      title: "Aktivitas baru",
      locationName: "",
      description: "",
      estimatedCost: 0,
      category: "Activity",
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
                    const id = String(record.id ?? "");
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
                              }}
                            >
                              Edit
                            </button>
                            <button className="ghost-chip danger" onClick={() => handleDelete(id)}>
                              Delete
                            </button>
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

            <textarea
              className="admin-editor"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              spellCheck={false}
            />

            <div className="admin-editor-actions">
              <button className="primary-button wide" onClick={handleSave} disabled={busy}>
                {busy ? "Menyimpan..." : editorMode === "create" ? "Create record" : "Update record"}
              </button>
              <button className="ghost-chip wide" onClick={() => resetDraft(currentTable)} disabled={busy}>
                Reset template
              </button>
            </div>

            <div className="empty-state">
              Gunakan JSON untuk mengelola semua field pada tabel ini. Field tambahan dengan prefix
              `_` hanya untuk display dan akan diabaikan saat simpan.
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
