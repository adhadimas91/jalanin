"use client";

import { useState } from "react";
import { Icon } from "./icon-sprite";

export function CloneItineraryButton({ itineraryId }: { itineraryId: string }) {
  const [loading, setLoading] = useState(false);

  async function handleClone() {
    setLoading(true);
    try {
      const response = await fetch(`/api/itineraries/${itineraryId}/clone`, {
        method: "POST",
      });

      if (response.status === 401) {
        alert("Login dulu untuk memakai fitur ini.");
        window.location.href = "/login";
        return;
      }

      if (!response.ok) {
        const text = await response.text();
        alert(text || "Gagal menyalin itinerary.");
        return;
      }

      const result = await response.json();
      window.location.href = `/itinerary/${result.id}`;
    } catch (error) {
      alert("Terjadi kesalahan koneksi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button className="primary-button" onClick={handleClone} disabled={loading}>
      <Icon name="copy" />
      <span>{loading ? "Menyalin..." : "Jalanin Rute Ini"}</span>
    </button>
  );
}
