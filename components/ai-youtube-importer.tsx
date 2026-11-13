"use client";

import { useEffect, useState } from "react";
import type { AiItineraryResult, YoutubeStep1Data, YoutubeStep2Data } from "@/lib/youtube-ai";

interface AiYoutubeImporterProps {
  onExtracted: (data: AiItineraryResult) => void;
  curatedUserId?: string;
}

type StepNumber = 1 | 2 | 3;
type StepStatus = "pending" | "running" | "done" | "error";

interface StepCheckpoint {
  videoId: string;
  url: string;
  step1Data?: YoutubeStep1Data;
  step2Data?: YoutubeStep2Data;
  updatedAt: number;
}

const CHECKPOINT_PREFIX = "jalanin_yt_ai_checkpoint_";
const CHECKPOINT_TTL_MS = 24 * 60 * 60 * 1000;

function getYoutubeVideoId(inputUrl: string): string | null {
  const trimmed = inputUrl.trim();
  if (!trimmed) return null;
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  const match = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/
  );
  return match ? match[1] : null;
}

function loadCheckpoint(videoId: string): StepCheckpoint | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(`${CHECKPOINT_PREFIX}${videoId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StepCheckpoint;
    if (!parsed || parsed.videoId !== videoId || Date.now() - parsed.updatedAt > CHECKPOINT_TTL_MS) {
      window.localStorage.removeItem(`${CHECKPOINT_PREFIX}${videoId}`);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function saveCheckpoint(checkpoint: StepCheckpoint) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(`${CHECKPOINT_PREFIX}${checkpoint.videoId}`, JSON.stringify(checkpoint));
  } catch {
    // Ignore storage quota errors
  }
}

function clearCheckpoint(videoId: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(`${CHECKPOINT_PREFIX}${videoId}`);
  } catch {
    // Ignore
  }
}

const STEP_LABELS: Record<StepNumber, { title: string; subtitle: string }> = {
  1: { title: "1/3 Ambil Video & Transkrip", subtitle: "0 token AI" },
  2: { title: "2/3 Analisis Rute oleh AI Gemini", subtitle: "Pakai token AI" },
  3: { title: "3/3 Geocoding Peta & Cover", subtitle: "0 token AI" },
};

export function AiYoutubeImporter({ onExtracted, curatedUserId }: AiYoutubeImporterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState<StepNumber | null>(null);
  const [failedStep, setFailedStep] = useState<StepNumber | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step1Data, setStep1Data] = useState<YoutubeStep1Data | null>(null);
  const [step2Data, setStep2Data] = useState<YoutubeStep2Data | null>(null);
  const [previewData, setPreviewData] = useState<AiItineraryResult | null>(null);

  // Restore checkpoint automatically when user pastes/types a YouTube URL with saved progress
  useEffect(() => {
    const vid = getYoutubeVideoId(videoUrl);
    if (!vid) {
      setStep1Data(null);
      setStep2Data(null);
      setFailedStep(null);
      setError(null);
      return;
    }
    if (step1Data?.videoId === vid) return;

    const cached = loadCheckpoint(vid);
    if (cached) {
      setStep1Data(cached.step1Data ?? null);
      setStep2Data(cached.step2Data ?? null);
      setFailedStep(null);
      setError(null);
      setPreviewData(null);
    } else {
      setStep1Data(null);
      setStep2Data(null);
      setFailedStep(null);
      setError(null);
      setPreviewData(null);
    }
  }, [videoUrl, step1Data?.videoId]);

  const callExtractStep = async <T,>(payload: Record<string, unknown>): Promise<T> => {
    const resp = await fetch("/api/admin/ai/extract-youtube", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await resp.json();
    if (!resp.ok || !json.success) {
      throw new Error(json.error || "Gagal memproses video YouTube.");
    }
    return json.data as T;
  };

  const runPipeline = async (forceFresh = false) => {
    const trimmedUrl = videoUrl.trim();
    if (!trimmedUrl) return;

    const vid = getYoutubeVideoId(trimmedUrl);
    if (forceFresh && vid) {
      clearCheckpoint(vid);
    }

    setLoading(true);
    setError(null);
    setFailedStep(null);
    setPreviewData(null);

    let currentStep1 = forceFresh ? null : step1Data;
    let currentStep2 = forceFresh ? null : step2Data;
    if (forceFresh) {
      setStep1Data(null);
      setStep2Data(null);
    }

    let currentStep: StepNumber = 1;

    try {
      // Step 1: Video & Transcript (skip if already completed for this video)
      if (!currentStep1) {
        currentStep = 1;
        setActiveStep(1);
        currentStep1 = await callExtractStep<YoutubeStep1Data>({
          step: 1,
          url: trimmedUrl,
        });
        setStep1Data(currentStep1);
        saveCheckpoint({
          videoId: currentStep1.videoId,
          url: trimmedUrl,
          step1Data: currentStep1,
          updatedAt: Date.now(),
        });
      }

      // Step 2: Gemini AI Analysis (skip if already completed — saves tokens!)
      if (!currentStep2) {
        currentStep = 2;
        setActiveStep(2);
        currentStep2 = await callExtractStep<YoutubeStep2Data>({
          step: 2,
          step1Data: currentStep1,
        });
        setStep2Data(currentStep2);
        saveCheckpoint({
          videoId: currentStep1.videoId,
          url: trimmedUrl,
          step1Data: currentStep1,
          step2Data: currentStep2,
          updatedAt: Date.now(),
        });
      }

      // Step 3: Geocoding & Cover Image
      currentStep = 3;
      setActiveStep(3);
      const result = await callExtractStep<AiItineraryResult>({
        step: 3,
        step1Data: currentStep1,
        step2Data: currentStep2,
        curatedUserId,
      });

      setPreviewData(result);
      onExtracted(result);
    } catch (err) {
      setFailedStep(currentStep);
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setActiveStep(null);
      setLoading(false);
    }
  };

  const handleExtract = async (e: React.FormEvent) => {
    e.preventDefault();
    await runPipeline(false);
  };

  const handleReset = () => {
    const vid = getYoutubeVideoId(videoUrl);
    if (vid) clearCheckpoint(vid);
    setStep1Data(null);
    setStep2Data(null);
    setPreviewData(null);
    setFailedStep(null);
    setError(null);
  };

  const getStepStatus = (step: StepNumber): StepStatus => {
    if (activeStep === step) return "running";
    if (failedStep === step) return "error";
    if (step === 1 && step1Data) return "done";
    if (step === 2 && step2Data) return "done";
    if (step === 3 && previewData) return "done";
    return "pending";
  };

  const nextResumeStep: StepNumber = !step1Data ? 1 : !step2Data ? 2 : 3;
  const hasSavedProgress = Boolean(step1Data || step2Data) && !previewData;

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
                {loading
                  ? `Memproses Step ${activeStep ?? nextResumeStep}/3...`
                  : hasSavedProgress
                    ? `▶️ Lanjutkan dari Step ${nextResumeStep}`
                    : "🚀 Analisis & Isi Form"}
              </button>
              {(hasSavedProgress || previewData) && !loading && (
                <button
                  type="button"
                  onClick={handleReset}
                  style={{
                    background: "#f1f5f9",
                    color: "#475569",
                    border: "1px solid #cbd5e1",
                    padding: "9px 12px",
                    borderRadius: "8px",
                    fontWeight: 600,
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                  title="Hapus progres tersimpan dan mulai ulang dari Step 1"
                >
                  ↺ Mulai Ulang
                </button>
              )}
            </div>

            <div style={{ fontSize: "11px", color: "#64748b" }}>
              Contoh link vlog: <code>https://www.youtube.com/watch?v=oNVtaHAmcSs</code> (Liburan Jogja 2H1M)
            </div>

            {(loading || hasSavedProgress || failedStep !== null || previewData) && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: "8px",
                }}
              >
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                {([1, 2, 3] as StepNumber[]).map((step) => {
                  const status = getStepStatus(step);
                  const palette =
                    status === "done"
                      ? { bg: "#ecfdf5", border: "#86efac", text: "#166534", icon: "✅" }
                      : status === "running"
                        ? { bg: "#e0f2fe", border: "#7dd3fc", text: "#0369a1", icon: null }
                        : status === "error"
                          ? { bg: "#fef2f2", border: "#fca5a5", text: "#b91c1c", icon: "❌" }
                          : { bg: "#f8fafc", border: "#e2e8f0", text: "#64748b", icon: "⏳" };

                  return (
                    <div
                      key={step}
                      style={{
                        padding: "9px 11px",
                        borderRadius: "8px",
                        background: palette.bg,
                        border: `1px solid ${palette.border}`,
                        color: palette.text,
                        fontSize: "12px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      {status === "running" ? (
                        <div
                          style={{
                            width: "14px",
                            height: "14px",
                            flexShrink: 0,
                            border: "2px solid #0284c7",
                            borderTopColor: "transparent",
                            borderRadius: "50%",
                            animation: "spin 1s linear infinite",
                          }}
                        />
                      ) : (
                        <span style={{ fontSize: "13px", flexShrink: 0 }}>{palette.icon}</span>
                      )}
                      <div>
                        <div style={{ fontWeight: 700, lineHeight: 1.25 }}>{STEP_LABELS[step].title}</div>
                        <div style={{ fontSize: "10px", opacity: 0.85, marginTop: "2px" }}>
                          {status === "done"
                            ? "Selesai (tersimpan)"
                            : status === "running"
                              ? "Sedang berjalan..."
                              : status === "error"
                                ? "Gagal — siap dilanjutkan"
                                : STEP_LABELS[step].subtitle}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {step2Data && !previewData && !loading && (
              <div
                style={{
                  padding: "8px 12px",
                  background: "#eef2ff",
                  border: "1px solid #c7d2fe",
                  borderRadius: "8px",
                  color: "#3730a3",
                  fontSize: "12px",
                  fontWeight: 600,
                }}
              >
                🛡️ Hasil analisis AI Gemini (Step 2) sudah tersimpan aman. Melanjutkan dari Step {nextResumeStep} tidak akan membakar token AI lagi.
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
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "8px",
                }}
              >
                <span>
                  ⚠️ {failedStep ? `Gagal di Step ${failedStep}/3: ` : ""}
                  {error}
                </span>
                <button
                  type="button"
                  onClick={() => runPipeline(false)}
                  disabled={loading}
                  style={{
                    background: "#dc2626",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    padding: "5px 10px",
                    fontSize: "11px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Coba Lagi dari Step {nextResumeStep}
                </button>
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
