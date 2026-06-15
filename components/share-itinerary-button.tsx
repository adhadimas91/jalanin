"use client";

import { useState, useEffect } from "react";
import { Icon } from "./icon-sprite";
import { formatRupiah } from "@/lib/format";
import { trackEvent } from "@/lib/analytics";

type Props = {
  itinerary: {
    id: string;
    title: string;
    destination: string;
    durationDays: number;
    estimatedBudget: number;
    travelStyle: string;
    description?: string;
    coverImageUrl: string;
  };
  variant?: "ghost-chip" | "icon-action" | "feed-card";
};

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
    <path d="M12.012 2c-5.506 0-9.988 4.482-9.988 9.988 0 1.76.457 3.473 1.328 4.98L2 22l5.176-1.358c1.45.79 3.08 1.208 4.83 1.21h.005c5.507 0 9.99-4.482 9.99-9.99A9.99 9.99 0 0 0 12.012 2zm5.556 14.156c-.305.856-1.503 1.564-2.072 1.666-.514.093-1.185.163-3.415-.76-2.853-1.18-4.688-4.08-4.83-4.272-.143-.19-.142-.25-.143-.889l-.002-.556c.057-.406.27-.604.37-.704.09-.093.2-.138.3-.138.1 0 .2.022.285.04.135.03.25.07.315.222.083.193.29.702.316.757.026.053.042.115.007.185-.034.07-.075.153-.15.238-.074.086-.157.19-.225.26-.08.083-.164.172-.07.332.093.16.417.688.89 1.11.61.543 1.123.712 1.285.793.16.082.256.07.35-.04.095-.107.412-.48.522-.643.11-.164.22-.136.37-.08.15.056.953.45 1.117.53.164.083.273.125.314.195.04.07.04.407-.265 1.265z"/>
  </svg>
);

const XIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
    <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.8c4.56-.93 8-4.96 8-9.8z"/>
  </svg>
);

const SystemShareIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
);

export function ShareItineraryButton({ itinerary, variant = "ghost-chip" }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<"casual" | "detailed">("casual");
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [instaFeedback, setInstaFeedback] = useState<"Post" | "Reel" | null>(null);
  const [isShareSupported, setIsShareSupported] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setShareUrl(`${window.location.origin}/itinerary/${itinerary.id}`);
      setIsShareSupported(!!navigator.share);
    }
  }, [itinerary.id]);

  const budgetStr = itinerary.estimatedBudget > 0 
    ? formatRupiah(itinerary.estimatedBudget) 
    : "Hemat";

  // Template texts
  const templates = {
    casual: `Rencana jalan-jalan gua ke ${itinerary.destination} besok nih, udah lengkap sama rekomendasi hotel & tempat makannya: ${shareUrl}`,
    detailed: `🚗 Akhirnya rute liburan ke *${itinerary.destination}* (${itinerary.durationDays} hari) beres juga! Lengkap dengan rekomendasi hotel, kuliner hits, dan estimasi budget (${budgetStr}). Intip detail itinerary gua di sini: ${shareUrl}`
  };

  const activeText = templates[selectedTemplate];

  // Event handlers
  const handleCopyLink = async () => {
    trackEvent("share_copy_link", { itinerary_id: itinerary.id });
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (err) {
      console.error("Gagal menyalin link:", err);
    }
  };

  const handleCopyText = async () => {
    trackEvent("share_copy_text", { itinerary_id: itinerary.id, template: selectedTemplate });
    try {
      await navigator.clipboard.writeText(activeText);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    } catch (err) {
      console.error("Gagal menyalin teks:", err);
    }
  };

  const handleInstagramShare = async (type: "Post" | "Reel") => {
    trackEvent("share_instagram", { itinerary_id: itinerary.id, type });
    try {
      await navigator.clipboard.writeText(activeText);
      setInstaFeedback(type);
      setTimeout(() => setInstaFeedback(null), 8000);
      window.open("https://instagram.com", "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error("Gagal menyalin teks untuk Instagram:", err);
    }
  };

  const handleSystemShare = async () => {
    trackEvent("share_system", { itinerary_id: itinerary.id });
    try {
      const shareData: ShareData = {
        title: itinerary.title,
        text: activeText,
        url: shareUrl,
      };

      // Try to fetch cover image and convert to File to share via Web Share API if supported
      if (navigator.canShare) {
        try {
          const response = await fetch(itinerary.coverImageUrl);
          const blob = await response.blob();
          const cleanDest = itinerary.destination.toLowerCase().replace(/[^a-z0-9]+/g, "-");
          const file = new File([blob], `${cleanDest}-cover.jpg`, { type: "image/jpeg" });
          if (navigator.canShare({ files: [file] })) {
            shareData.files = [file];
          }
        } catch (e) {
          console.log("Gagal menyertakan file cover image pada sharing:", e);
        }
      }

      await navigator.share(shareData);
    } catch (err) {
      console.log("System share batal/gagal:", err);
    }
  };

  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(activeText)}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(activeText)}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;

  // Disable scroll when modal open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const renderTriggerButton = () => {
    if (variant === "feed-card") {
      return (
        <button 
          className="feed-card-share-btn" 
          type="button" 
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(true);
            trackEvent("share_modal_open", { itinerary_id: itinerary.id, variant });
          }}
          aria-label="Bagikan"
        >
          <Icon name="share" />
        </button>
      );
    }

    if (variant === "icon-action") {
      return (
        <button 
          className="icon-action" 
          type="button" 
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(true);
            trackEvent("share_modal_open", { itinerary_id: itinerary.id, variant });
          }}
          aria-label="Bagikan itinerary"
        >
          <Icon name="share" />
        </button>
      );
    }

    // Default: "ghost-chip"
    return (
      <button 
        className="ghost-chip share-btn-trigger" 
        type="button" 
        onClick={() => {
          setIsOpen(true);
          trackEvent("share_modal_open", { itinerary_id: itinerary.id, variant });
        }}
        style={{ display: "inline-flex", gap: "8px", alignItems: "center" }}
      >
        <Icon name="share" />
        <span>Bagikan</span>
      </button>
    );
  };

  return (
    <>
      {renderTriggerButton()}

      {isOpen && (
        <div 
          className="share-modal-overlay" 
          onClick={() => setIsOpen(false)}
          aria-modal="true"
          role="dialog"
        >
          <div 
            className="share-modal-card" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="share-modal-header">
              <div>
                <h3 className="share-modal-title">Bagikan Itinerary</h3>
                <p className="share-modal-subtitle">Ajak teman atau komunitas jalan-jalan bareng!</p>
              </div>
              <button 
                className="tool-button" 
                type="button" 
                onClick={() => setIsOpen(false)}
                aria-label="Tutup"
              >
                <Icon name="x" />
              </button>
            </div>

            {/* Platform Quick Shares */}
            <div className="share-platforms-grid">
              <button 
                type="button"
                onClick={() => handleInstagramShare("Post")} 
                className="share-platform-btn instagram"
              >
                <span className="share-platform-icon"><InstagramIcon /></span>
                <span>Insta Post</span>
              </button>

              <button 
                type="button"
                onClick={() => handleInstagramShare("Reel")} 
                className="share-platform-btn instagram"
              >
                <span className="share-platform-icon"><InstagramIcon /></span>
                <span>Insta Reel</span>
              </button>

              <a 
                href={whatsappUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="share-platform-btn whatsapp"
                onClick={() => trackEvent("share_platform", { platform: "whatsapp", itinerary_id: itinerary.id })}
              >
                <span className="share-platform-icon"><WhatsAppIcon /></span>
                <span>WhatsApp</span>
              </a>

              <a 
                href={twitterUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="share-platform-btn twitter"
                onClick={() => trackEvent("share_platform", { platform: "twitter", itinerary_id: itinerary.id })}
              >
                <span className="share-platform-icon"><XIcon /></span>
                <span>Twitter / X</span>
              </a>

              <a 
                href={facebookUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="share-platform-btn facebook"
                onClick={() => trackEvent("share_platform", { platform: "facebook", itinerary_id: itinerary.id })}
              >
                <span className="share-platform-icon"><FacebookIcon /></span>
                <span>Facebook</span>
              </a>

              {isShareSupported ? (
                <button 
                  onClick={handleSystemShare} 
                  className="share-platform-btn system-share"
                >
                  <span className="share-platform-icon"><SystemShareIcon /></span>
                  <span>Lainnya</span>
                </button>
              ) : (
                <button 
                  onClick={handleCopyLink} 
                  className={`share-platform-btn copy-btn-grid ${copiedLink ? "success" : ""}`}
                >
                  <span className="share-platform-icon">
                    {copiedLink ? <Icon name="shield" /> : <Icon name="copy" />}
                  </span>
                  <span>{copiedLink ? "Tersalin!" : "Salin Link"}</span>
                </button>
              )}
            </div>

            {/* Instagram Copy Helper Notification */}
            {instaFeedback && (
              <div className="share-insta-feedback" style={{
                background: "rgba(225, 48, 108, 0.08)",
                border: "1px solid rgba(225, 48, 108, 0.2)",
                borderRadius: "var(--radius-sm)",
                padding: "12px 14px",
                fontSize: "12px",
                color: "#e1306c",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                margin: "-6px 0",
                animation: "shareFadeIn 0.2s ease-out",
                lineHeight: "1.5"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "16px" }}>📸</span>
                  <span>Teks disalin! Silakan buat <strong>Instagram {instaFeedback}</strong> baru dan paste caption ini.</span>
                </div>
                <div style={{ marginTop: "6px", fontSize: "11px", opacity: 0.95 }}>
                  💡 Tip: Anda bisa <a href={itinerary.coverImageUrl} download={`cover-${itinerary.id}.jpg`} target="_blank" rel="noreferrer" style={{ color: "#e1306c", textDecoration: "underline", fontWeight: 800 }}>unduh cover rute ini</a> untuk dijadikan foto postingan Anda.
                </div>
              </div>
            )}

            {/* Template Caption Picker & Preview */}
            <div className="share-caption-container">
              <div className="share-caption-header">
                <span className="share-caption-label">Pilih Format Teks Otomatis</span>
                <div className="share-template-tabs">
                  <button 
                    type="button" 
                    className={`share-template-tab ${selectedTemplate === "casual" ? "active" : ""}`}
                    onClick={() => setSelectedTemplate("casual")}
                  >
                    Santai & Gaul
                  </button>
                  <button 
                    type="button" 
                    className={`share-template-tab ${selectedTemplate === "detailed" ? "active" : ""}`}
                    onClick={() => setSelectedTemplate("detailed")}
                  >
                    Informatif
                  </button>
                </div>
              </div>

              {/* Live Preview Box */}
              <div className="share-preview-box">
                <p className="share-preview-text">{activeText}</p>
              </div>

              {/* Copy Caption Button */}
              <button 
                type="button"
                className={`primary-button wide share-copy-caption-btn ${copiedText ? "copied" : ""}`}
                onClick={handleCopyText}
                style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px" }}
              >
                <Icon name={copiedText ? "shield" : "copy"} />
                <span>{copiedText ? "Teks Berhasil Disalin!" : "Salin Teks untuk Sosmed"}</span>
              </button>
            </div>

            {/* Direct Link Panel */}
            <div className="share-link-panel">
              <span className="share-link-label">Link Itinerary</span>
              <div className="share-link-input-row">
                <input 
                  type="text" 
                  readOnly 
                  value={shareUrl} 
                  onClick={(e) => (e.target as HTMLInputElement).select()} 
                  className="share-link-input"
                />
                <button 
                  type="button" 
                  className={`ghost-chip share-link-copy-btn ${copiedLink ? "copied" : ""}`}
                  onClick={handleCopyLink}
                  style={{ whiteSpace: "nowrap" }}
                >
                  <span>{copiedLink ? "Tersalin!" : "Salin"}</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
