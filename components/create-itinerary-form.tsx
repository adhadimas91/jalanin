"use client";

import { useState } from "react";
import { PriceInput } from "./price-input";
import { AiYoutubeImporter } from "./ai-youtube-importer";
import type { AiItineraryResult } from "@/lib/youtube-ai";

interface CreateItineraryFormProps {
  isAdmin: boolean;
  curatedUserId?: string;
}

export function CreateItineraryForm({ isAdmin, curatedUserId }: CreateItineraryFormProps) {
  const [title, setTitle] = useState("");
  const [destination, setDestination] = useState("");
  const [durationDays, setDurationDays] = useState(1);
  const [estimatedBudget, setEstimatedBudget] = useState(1_500_000);
  const [travelStyle, setTravelStyle] = useState("Budget trip");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("/uploads/default-cover.svg");
  const [daysJson, setDaysJson] = useState<string>("");
  const [aiExtractedInfo, setAiExtractedInfo] = useState<{
    daysCount: number;
    activitiesCount: number;
    videoTitle?: string;
  } | null>(null);

  const handleAiExtracted = (data: AiItineraryResult) => {
    setTitle(data.title);
    setDestination(data.destination);
    setDurationDays(data.durationDays);
    setEstimatedBudget(data.estimatedBudget || 1_500_000);
    setTravelStyle(data.travelStyle || "Budget trip");
    setDescription(data.description);
    setNotes(data.notes || (data.originalVideoUrl ? `Sumber video: ${data.originalVideoUrl}` : ""));
    if (data.coverImageUrl) {
      setCoverImageUrl(data.coverImageUrl);
    }

    if (data.days && data.days.length > 0) {
      setDaysJson(JSON.stringify(data.days));
      const totalActs = data.days.reduce((acc, d) => acc + d.activities.length, 0);
      setAiExtractedInfo({
        daysCount: data.days.length,
        activitiesCount: totalActs,
        videoTitle: data.title,
      });
    }
  };

  return (
    <>
      {isAdmin && (
        <AiYoutubeImporter onExtracted={handleAiExtracted} curatedUserId={curatedUserId} />
      )}

      {aiExtractedInfo && (
        <div
          style={{
            margin: "0 0 16px 0",
            padding: "12px 16px",
            background: "#f0fdf4",
            border: "1.5px solid #86efac",
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div style={{ fontWeight: 800, color: "#166534", fontSize: "13px" }}>
              ✨ Data AI Siap Disimpan!
            </div>
            <div style={{ fontSize: "12px", color: "#15803d" }}>
              {aiExtractedInfo.daysCount} Hari & {aiExtractedInfo.activitiesCount} Aktivitas dari YouTube telah diintegrasikan. Tekan tombol buat di bawah untuk langsung menyimpan draft lengkap ke sistem.
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setAiExtractedInfo(null);
              setDaysJson("");
            }}
            style={{
              background: "transparent",
              border: "1px solid #bbf7d0",
              color: "#166534",
              borderRadius: "6px",
              padding: "4px 8px",
              fontSize: "11px",
              cursor: "pointer",
            }}
          >
            Reset Data AI
          </button>
        </div>
      )}

      <form className="stack-form" action="/api/itineraries" method="post" encType="multipart/form-data">
        <input type="hidden" name="daysJson" value={daysJson} />
        <input type="hidden" name="coverImageUrl" value={coverImageUrl} />
        <input type="hidden" name="isPublished" value="false" />

        <label>
          Judul itinerary
          <input
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="Misal: Liburan Seru di Jogja 2 Hari 1 Malam"
          />
        </label>

        <label>
          Destinasi utama
          <input
            name="destination"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            required
            placeholder="Misal: Yogyakarta"
          />
        </label>

        <div className="form-grid">
          <label>
            Durasi (Hari)
            <input
              name="durationDays"
              type="number"
              min="1"
              max="25"
              value={durationDays}
              onChange={(e) => setDurationDays(Number(e.target.value) || 1)}
              required
            />
          </label>
          <label>
            Budget (IDR)
            <PriceInput
              name="estimatedBudget"
              value={estimatedBudget}
              onChange={setEstimatedBudget}
              required
              placeholder="1.500.000"
            />
          </label>
        </div>

        <label>
          Travel style
          <select
            name="travelStyle"
            value={travelStyle}
            onChange={(e) => setTravelStyle(e.target.value)}
          >
            <option>Budget trip</option>
            <option>Kuliner</option>
            <option>Couple</option>
            <option>Nature</option>
            <option>City tour</option>
            <option>Family</option>
          </select>
        </label>

        <label>
          Cover image {coverImageUrl !== "/uploads/default-cover.svg" && "(Thumbnail AI Terpasang)"}
          {coverImageUrl !== "/uploads/default-cover.svg" && (
            <div style={{ margin: "4px 0 8px 0" }}>
              <img
                src={coverImageUrl}
                alt="Cover Preview"
                style={{ width: "100%", maxHeight: "180px", objectFit: "cover", borderRadius: "8px", border: "1px solid #e5e7eb" }}
              />
            </div>
          )}
          <input name="imageFile" type="file" accept="image/png,image/jpeg,image/webp" />
        </label>

        <label>
          Deskripsi
          <textarea
            name="description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            placeholder="Ceritakan gambaran singkat perjalanan ini..."
          />
        </label>

        <label>
          Catatan & Tips
          <textarea
            name="notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Tips perjalanan, rekomendasi pakaian, atau referensi vlog..."
          />
        </label>

        <button className="primary-button wide" type="submit">
          {aiExtractedInfo ? "💾 Simpan Draft Itinerary & Aktivitas Lengkap" : "Buat Itinerary & Lanjut Tambah Aktivitas"}
        </button>

        <p style={{ fontSize: "12px", color: "var(--muted)", textAlign: "center", margin: "4px 0 0 0" }}>
          Itinerary akan disimpan sebagai draf privat terlebih dahulu. Anda dapat mempublikasikannya setelah melengkapi aktivitas hari pertama di halaman detail.
          {isAdmin && (
            <span style={{ display: "block", color: "#166534", marginTop: "4px", fontWeight: 600 }}>
              👑 Mode Admin: Batas maksimal kuota publik dan privat akan di-bypass secara otomatis saat mempublikasikan itinerary yang sudah dilengkapi.
            </span>
          )}
        </p>
      </form>
    </>
  );
}
