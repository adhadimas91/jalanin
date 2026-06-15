"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon, IconSprite } from "./icon-sprite";
import { formatRupiah } from "@/lib/format";

type SavedItinerary = {
  id: string;
  coverImageUrl: string;
  destination: string;
  title: string;
  durationDays: number;
  estimatedBudget: number;
};

export function SavedList({ initialSaves }: { initialSaves: SavedItinerary[] }) {
  const [saves, setSaves] = useState(initialSaves);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleRemove(id: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm("Hapus rute ini dari koleksi Anda?")) return;

    setLoadingId(id);
    try {
      const response = await fetch(`/api/itineraries/${id}/save`, {
        method: "DELETE",
      });
      if (response.ok) {
        setSaves((prev) => prev.filter((item) => item.id !== id));
      } else {
        alert("Gagal menghapus rute dari koleksi.");
      }
    } catch (error) {
      alert("Terjadi kesalahan koneksi.");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <>
      <IconSprite />
      <div className="server-list">
        {saves.length ? (
          saves.map((itinerary) => (
            <div
              className="server-card"
              key={itinerary.id}
              style={{ display: "grid", gridTemplateColumns: "112px 1fr auto", gap: "12px", alignItems: "center" }}
            >
              <Link
                href={`/itinerary/${itinerary.id}`}
                style={{ display: "grid", gridTemplateColumns: "112px 1fr", gap: "12px", alignItems: "center", textDecoration: "none", color: "inherit", width: "100%", height: "100%" }}
              >
                <img src={itinerary.coverImageUrl} alt={itinerary.destination} style={{ height: "96px", width: "112px", objectFit: "cover", borderRadius: "14px" }} />
                <div>
                  <h3>{itinerary.title}</h3>
                  <p>
                    {itinerary.destination} - {itinerary.durationDays} hari - {formatRupiah(itinerary.estimatedBudget)}
                  </p>
                </div>
              </Link>
              <button
                onClick={(e) => handleRemove(itinerary.id, e)}
                disabled={loadingId === itinerary.id}
                className="ghost-chip danger"
                style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 12px", marginRight: "8px" }}
              >
                <Icon name="x" />
                <span>{loadingId === itinerary.id ? "Hapus..." : "Hapus"}</span>
              </button>
            </div>
          ))
        ) : (
          <div className="empty-state">Belum ada rute tersimpan.</div>
        )}
      </div>
    </>
  );
}
