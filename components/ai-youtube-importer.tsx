"use client";

import { useState } from "react";
import type { AiItineraryResult } from "@/lib/youtube-ai";

interface AiYoutubeImporterProps {
  onExtracted: (data: AiItineraryResult) => void;
  curatedUserId?: string;
}

export function AiYoutubeImporter({ onExtracted, curatedUserId }: AiYoutubeImporterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [stepText, setStepText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<AiItineraryResult | null>(null);

  const handleExtract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoUrl.trim()) return;

    setLoading(true);
    setError(null);
    setPreviewData(null);
    setStepText("1/3 Menghubungi YouTube & mengambil transkrip video...");

    try {
      setTimeout(() => {
        setStepText("2/3 AI Gemini menganalisis transkrip perjalanan...");
      }, 3000);

      setTimeout(() => {
        setStepText("3/3 Mencocokkan titik koordinat lokasi di peta...");
      }, 7000);

      const resp = await fetch("/api/admin/ai/extract-youtube", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: videoUrl.trim(),
          curatedUserId,
        }),
      });

      const json = await resp.json();

      if (!resp.ok || !json.success) {
        throw new Error(json.error || "Gagal memproses video YouTube.");
      }

      const result: AiItineraryResult = json.data;
      setPreviewData(result);
      onExtracted(result);
      setStepText("Selesai! Formulir telah diisi otomatis.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (previewData) {
      onExtracted(previewData);
      setIsOpen(false);
    }
  };

  return (
    <div
      style={{
        margin: "12px 0 20px 0",
        background: "linear-gradient(135deg, #f0f7ff 0%, #fdf4ff 100%)",
        border: "1.5px solid #c7d2fe",
        borderRadius: "14px",
        padding: "16px",
        boxShadow: "0 4px 12px rgba(99, 102, 241, 0.08)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #6366f1, #a855f7)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
              fontWeight: 800,
            }}
          >
            ✨
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: "14px", color: "#1e1b4b" }}>
              Import Itinerary dengan AI (YouTube)
            </div>
            <div style={{ fontSize: "12px", color: "#4338ca" }}>
              Tempel link video YouTube travel vlog, AI akan otomatis menyusun rute perjalanan lengkap!
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          style={{
            background: isOpen ? "#e0e7ff" : "linear-gradient(135deg, #4f46e5, #7c3aed)",
            color: isOpen ? "#312e81" : "#fff",
            border: "none",
            borderRadius: "8px",
            padding: "8px 14px",
            fontWeight: 700,
            fontSize: "12px",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          {isOpen ? "Tutup Form AI" : "Buka AI Importer"}
        </button>
      </div>

      {isOpen && (
        <div style={{ marginTop: "14px", paddingTop: "14px", borderTop: "1px dashed #cbd5e1" }}>
          <form onSubmit={handleExtract} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=... atau https://youtu.be/..."
                required
                disabled={loading}
                style={{
                  flex: 1,
                  minWidth: "260px",
                  padding: "9px 12px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "13px",
                  background: "#fff",
                }}
              />
              <button
                type="submit"
                disabled={loading}
                style={{
                  background: loading ? "#9ca3af" : "linear-gradient(135deg, #2563eb, #7c3aed)",
                  color: "#fff",
                  border: "none",
                  padding: "9px 18px",
                  borderRadius: "8px",
                  fontWeight: 700,
                  fontSize: "13px",
                  cursor: loading ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                {loading ? "Mengekstrak..." : "🚀 Analisis & Isi Form"}
              </button>
            </div>

            <div style={{ fontSize: "11px", color: "#64748b" }}>
              Contoh link vlog: <code>https://www.youtube.com/watch?v=oNVtaHAmcSs</code> (Liburan Jogja 2H1M)
            </div>

            {loading && (
              <div
                style={{
                  padding: "12px",
                  background: "#e0f2fe",
                  border: "1px solid #bae6fd",
                  borderRadius: "8px",
                  color: "#0369a1",
                  fontSize: "13px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <div
                  style={{
                    width: "16px",
                    height: "16px",
                    border: "2px solid #0284c7",
                    borderTopColor: "transparent",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                  }}
                />
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                <span style={{ fontWeight: 600 }}>{stepText}</span>
              </div>
            )}

            {error && (
              <div
                style={{
                  padding: "10px 14px",
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: "8px",
                  color: "#dc2626",
                  fontSize: "12px",
                  fontWeight: 600,
                }}
              >
                ⚠️ {error}
              </div>
            )}

            {previewData && (
              <div
                style={{
                  marginTop: "8px",
                  padding: "14px",
                  background: "#fff",
                  border: "1.5px solid #86efac",
                  borderRadius: "10px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px", flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: "#16a34a", textTransform: "uppercase" }}>
                      ✅ Berhasil Diekstrak ({previewData.days.length} Hari, {previewData.days.reduce((acc, d) => acc + d.activities.length, 0)} Aktivitas)
                    </div>
                    <div style={{ fontSize: "15px", fontWeight: 800, color: "#111", margin: "2px 0 4px 0" }}>
                      {previewData.title}
                    </div>
                    <div style={{ fontSize: "12px", color: "#4b5563" }}>
                      📍 <strong>Destinasi:</strong> {previewData.destination} | ⏱️ <strong>Durasi:</strong> {previewData.durationDays} Hari | 🏷️ <strong>Gaya:</strong> {previewData.travelStyle} | 💰 <strong>Estimasi Budget:</strong> Rp {previewData.estimatedBudget.toLocaleString("id-ID")}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleApply}
                    style={{
                      background: "#16a34a",
                      color: "#fff",
                      border: "none",
                      padding: "6px 14px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Terapkan ke Form Utama
                  </button>
                </div>

                <div style={{ marginTop: "10px", maxHeight: "200px", overflowY: "auto", fontSize: "12px", background: "#f8fafc", padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  {previewData.days.map((day) => (
                    <div key={day.dayNumber} style={{ marginBottom: "8px" }}>
                      <div style={{ fontWeight: 700, color: "#1e293b", borderBottom: "1px solid #e2e8f0", paddingBottom: "2px", marginBottom: "4px" }}>
                        Day {day.dayNumber}: {day.title}
                      </div>
                      <div style={{ paddingLeft: "8px" }}>
                        {day.activities.map((act, i) => (
                          <div key={i} style={{ color: "#475569", lineHeight: "1.5", margin: "4px 0", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "6px" }}>
                            <div>
                              • <strong>[{act.time}]</strong> {act.title} @ <em>{act.locationName}</em> <span style={{ fontSize: "11px", color: "#64748b" }}>({act.category})</span>
                            </div>
                            {act.latitude !== null && act.latitude !== undefined && act.longitude !== null && act.longitude !== undefined && (
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "3px",
                                  background: "#ecfdf5",
                                  border: "1px solid #a7f3d0",
                                  color: "#065f46",
                                  padding: "2px 7px",
                                  borderRadius: "6px",
                                  fontSize: "11px",
                                  fontFamily: "monospace",
                                  fontWeight: 600,
                                }}
                                title={`Latitude: ${act.latitude}, Longitude: ${act.longitude}`}
                              >
                                📍 Lat: {Number(act.latitude).toFixed(4)}, Long: {Number(act.longitude).toFixed(4)}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </form>
        </div>
      )}
    </div>
  );
}
