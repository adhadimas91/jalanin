"use client";

import { useState } from "react";
import { Icon } from "./icon-sprite";
import { trackEvent } from "@/lib/analytics";

export function CloneItineraryButton({ itineraryId }: { itineraryId: string }) {
  const [loading, setLoading] = useState(false);

  async function handleClone() {
    setLoading(true);
    trackEvent("clone_itinerary_start", { itinerary_id: itineraryId });
    try {
      const response = await fetch(`/api/itineraries/${itineraryId}/clone`, {
        method: "POST",
      });

      if (response.status === 401) {
        trackEvent("clone_itinerary_unauthorized", { itinerary_id: itineraryId });
        alert("Login dulu untuk memakai fitur ini.");
        window.location.href = "/login";
        return;
      }

      if (!response.ok) {
        const text = await response.text();
        trackEvent("clone_itinerary_failed", { itinerary_id: itineraryId, error: text || "Gagal menyalin" });
        alert(text || "Gagal menyalin itinerary.");
        return;
      }

      const result = await response.json();
      trackEvent("clone_itinerary_success", { itinerary_id: itineraryId, cloned_id: result.id });
      window.location.href = `/itinerary/${result.id}`;
    } catch (error: any) {
      trackEvent("clone_itinerary_error", { itinerary_id: itineraryId, error: error?.message || "Koneksi error" });
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
