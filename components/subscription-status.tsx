"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Icon, IconSprite } from "./icon-sprite";

type UserProps = {
  email: string;
  username?: string | null;
  isPro: boolean;
  proExpiresAt?: string | null | Date;
  maxPrivate: number;
  maxPublic: number;
  maxSaved: number;
  maxMyLink: number;
};

type Props = {
  user: UserProps;
  privateCount: number;
  publicCount: number;
  savedCount: number;
  myLinkCount: number;
  whatsappNumber?: string;
  price1m?: string;
  rate1m?: string;
  promo1m?: string;
  price3m?: string;
  rate3m?: string;
  promo3m?: string;
  price6m?: string;
  rate6m?: string;
  promo6m?: string;
  price1y?: string;
  rate1y?: string;
  promo1y?: string;
};

export function SubscriptionStatus({
  user,
  privateCount,
  publicCount,
  savedCount,
  myLinkCount,
  whatsappNumber = "088293681133",
  price1m = "Rp 29.900",
  rate1m = "/bulan",
  promo1m = "hemat",
  price3m = "Rp 79.900",
  rate3m = "Rp 26.633/bln",
  promo3m = "11% Hemat",
  price6m = "Rp 149.000",
  rate6m = "Rp 24.833/bln",
  promo6m = "17% Hemat",
  price1y = "Rp 249.000",
  rate1y = "Rp 20.750/bln",
  promo1y = "31% Hemat",
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showPlanModal, setShowPlanModal] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && (window.location.hash === "#upgrade" || window.location.search.includes("scroll=upgrade"))) {
      const el = document.querySelector(".upgrade-btn") || document.querySelector(".subscription-actions");
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 300);
      }
    }
  }, []);

  async function handleSubscription(action: "upgrade" | "downgrade") {
    if (
      action === "downgrade" &&
      !confirm(
        "Apakah Anda yakin ingin membatalkan langganan PRO? Batas kuota Anda akan dikembalikan ke level FREE."
      )
    ) {
      return;
    }

    setBusy(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      setMessage(
        action === "upgrade"
          ? "Selamat! Anda sekarang adalah pengguna PRO 🎉"
          : "Langganan PRO berhasil dibatalkan."
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setBusy(false);
    }
  }

  function renderLimitValue(value: number) {
    return value >= 9999 ? "Tanpa Batas (PRO)" : value;
  }

  return (
    <>
      <IconSprite />
      <div className="auth-card settings-card">
        <div className="subscription-header">
          <div>
            <h3>Status Langganan</h3>
            <p className="subscription-subtitle">
              {user.isPro ? (
                user.proExpiresAt ? (
                  <>Langganan aktif sampai <strong>{new Date(user.proExpiresAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</strong></>
                ) : (
                  "Langganan PRO aktif selamanya."
                )
              ) : (
                "Kelola batas kuota dan fitur premium akun traveler Anda."
              )}
            </p>
          </div>
          <span className={`plan-badge ${user.isPro ? "pro" : "free"}`}>
            {user.isPro ? (
              <>
                <Icon name="star" />
                <span>PRO PLAN</span>
              </>
            ) : (
              "FREE PLAN"
            )}
          </span>
        </div>

        <div className="limits-grid">
          <div className="limit-item">
            <div className="limit-label-container">
              <span className="limit-name">Itinerary Privat</span>
              <span className="limit-progress">
                {user.isPro ? privateCount : `${privateCount} / ${renderLimitValue(user.maxPrivate)}`}
              </span>
            </div>
            <div className="limit-bar-bg">
              <div
                className={`limit-bar ${user.isPro ? "pro-bar" : ""}`}
                style={{
                  width: `${user.isPro ? 100 : Math.min((privateCount / user.maxPrivate) * 100, 100)}%`,
                }}
              />
            </div>
          </div>

          <div className="limit-item">
            <div className="limit-label-container">
              <span className="limit-name">Itinerary Publik</span>
              <span className="limit-progress">
                {user.isPro ? publicCount : `${publicCount} / ${renderLimitValue(user.maxPublic)}`}
              </span>
            </div>
            <div className="limit-bar-bg">
              <div
                className={`limit-bar ${user.isPro ? "pro-bar" : ""}`}
                style={{
                  width: `${user.isPro ? 100 : Math.min((publicCount / user.maxPublic) * 100, 100)}%`,
                }}
              />
            </div>
          </div>

          <div className="limit-item">
            <div className="limit-label-container">
              <span className="limit-name">Rute Tersimpan</span>
              <span className="limit-progress">
                {user.isPro ? savedCount : `${savedCount} / ${renderLimitValue(user.maxSaved)}`}
              </span>
            </div>
            <div className="limit-bar-bg">
              <div
                className={`limit-bar ${user.isPro ? "pro-bar" : ""}`}
                style={{
                  width: `${user.isPro ? 100 : Math.min((savedCount / user.maxSaved) * 100, 100)}%`,
                }}
              />
            </div>
          </div>

          <div className="limit-item">
            <div className="limit-label-container">
              <span className="limit-name">Tautan MyLink</span>
              <span className="limit-progress">
                {user.isPro ? myLinkCount : `${myLinkCount} / ${renderLimitValue(user.maxMyLink)}`}
              </span>
            </div>
            <div className="limit-bar-bg">
              <div
                className={`limit-bar ${user.isPro ? "pro-bar" : ""}`}
                style={{
                  width: `${user.isPro ? 100 : Math.min((myLinkCount / user.maxMyLink) * 100, 100)}%`,
                }}
              />
            </div>
          </div>
        </div>

        {error && <p className="error-text subscription-message">{error}</p>}
        {message && <p className="success-text subscription-message">{message}</p>}

        <div className="subscription-actions">
          {user.isPro ? (
            <button
              type="button"
              className="ghost-chip danger wide"
              onClick={() => handleSubscription("downgrade")}
              disabled={busy}
            >
              {busy ? "Memproses..." : "Batalkan Langganan PRO"}
            </button>
          ) : (
            <button
              type="button"
              className="primary-button wide upgrade-btn"
              onClick={() => setShowPlanModal(true)}
              disabled={busy}
            >
              <Icon name="star" />
              <span>Upgrade ke PRO 🚀</span>
            </button>
          )}
        </div>
      </div>

      {showPlanModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(0, 0, 0, 0.4)",
          backdropFilter: "blur(8px)",
          padding: "20px"
        }} onClick={() => setShowPlanModal(false)}>
          <div style={{
            background: "rgba(255, 255, 255, 0.96)",
            border: "1px solid var(--line-strong)",
            borderRadius: "28px",
            boxShadow: "var(--shadow-pop)",
            width: "100%",
            maxWidth: "420px",
            padding: "32px 24px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            gap: "16px"
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: "36px" }}>💎</div>
            <h3 style={{ fontSize: "18px", fontWeight: 850, color: "var(--ink)", margin: 0 }}>Pilih Durasi Plan PRO</h3>
            <p style={{ fontSize: "13px", color: "var(--muted)", margin: 0, lineHeight: 1.5 }}>
              Upgrade akun Anda ke PRO untuk mendapatkan kuota privat, publik, saves, dan mylink tanpa batasan (100 limit).
            </p>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", margin: "8px 0" }}>
              {[
                { label: "1 Bulan", value: "1 Bulan", price: price1m, rate: rate1m, promo: promo1m },
                { label: "3 Bulan", value: "3 Bulan", price: price3m, rate: rate3m, promo: promo3m },
                { label: "6 Bulan", value: "6 Bulan", price: price6m, rate: rate6m, promo: promo6m },
                { label: "1 Tahun", value: "1 Tahun", price: price1y, rate: rate1y, promo: promo1y }
              ].map((plan) => (
                <button
                  key={plan.value}
                  type="button"
                  className="plan-option-card"
                  onClick={() => {
                    setShowPlanModal(false);
                    let phone = whatsappNumber.replace(/[^0-9]/g, "");
                    if (phone.startsWith("0")) {
                      phone = "62" + phone.slice(1);
                    }
                    const text = `Halo Admin Jalanin, saya ingin memesan plan PRO (${plan.label}) untuk email: ${user.email}${user.username ? ` / username: ${user.username}` : ""}.`;
                    const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
                    window.open(waUrl, "_blank");
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <strong style={{ fontSize: "14px", color: "var(--ink)", fontWeight: 800 }}>PRO {plan.label}</strong>
                    <span style={{ fontSize: "12px", color: "var(--muted)", fontWeight: 600 }}>
                      {plan.price} <span style={{ fontSize: "11px", color: "var(--muted)", fontWeight: 400 }}>({plan.rate})</span>
                    </span>
                  </div>
                  {plan.promo && (
                    <span style={{
                      fontSize: "10px",
                      fontWeight: 850,
                      color: plan.promo.includes("Hemat") ? "#b42318" : "#027a48",
                      background: plan.promo.includes("Hemat") ? "#fff2f0" : "#ecfdf3",
                      border: plan.promo.includes("Hemat") ? "1px solid #f6c5bf" : "1px solid #abefc6",
                      padding: "4px 8px",
                      borderRadius: "8px",
                      textTransform: "uppercase"
                    }}>
                      {plan.promo}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <button 
              type="button" 
              className="ghost-chip danger wide" 
              style={{ justifyContent: "center", border: "none", background: "transparent", cursor: "pointer" }}
              onClick={() => setShowPlanModal(false)}
            >
              Batal
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .plan-option-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 18px;
          border-radius: 16px;
          border: 1px solid var(--line-strong);
          background: var(--surface);
          cursor: pointer;
          text-align: left;
          width: 100%;
          transition: all 0.2s ease;
          outline: none;
        }
        .plan-option-card:hover {
          border-color: var(--blue);
          background: var(--surface-soft);
          transform: translateY(-1px);
        }
        .subscription-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
          gap: 16px;
        }
        .subscription-header h3 {
          margin: 0 0 4px 0;
          font-size: 18px;
          font-weight: 800;
          color: var(--ink);
        }
        .subscription-subtitle {
          margin: 0;
          font-size: 13px;
          color: var(--muted);
        }
        .plan-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          font-size: 11px;
          font-weight: 800;
          border-radius: 999px;
          text-transform: uppercase;
        }
        .plan-badge.free {
          background: var(--surface-soft);
          color: var(--muted);
          border: 1px solid var(--line-strong);
        }
        .plan-badge.pro {
          background: linear-gradient(135deg, #ffd700, #ffa500);
          color: #111;
          border: 1px solid #ffb700;
          box-shadow: 0 2px 8px rgba(255, 215, 0, 0.3);
        }
        .plan-badge :global(svg) {
          width: 14px;
          height: 14px;
          fill: currentColor;
        }
        .limits-grid {
          display: grid;
          gap: 16px;
          margin-bottom: 24px;
        }
        .limit-item {
          display: grid;
          gap: 6px;
        }
        .limit-label-container {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
        }
        .limit-name {
          font-weight: 700;
          color: var(--text);
        }
        .limit-progress {
          color: var(--muted);
          font-weight: 600;
        }
        .limit-bar-bg {
          height: 8px;
          background: var(--surface-soft);
          border-radius: 999px;
          overflow: hidden;
        }
        .limit-bar {
          height: 100%;
          background: var(--blue);
          border-radius: 999px;
          transition: width 0.3s ease;
        }
        .limit-bar.pro-bar {
          background: linear-gradient(90deg, var(--blue), #a855f7);
        }
        .subscription-message {
          margin: 0 0 16px 0;
          font-size: 13px;
          font-weight: 700;
        }
        .success-text {
          color: #10b981;
        }
        .subscription-actions {
          display: flex;
          gap: 12px;
        }
        .upgrade-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: linear-gradient(135deg, var(--blue), #8b5cf6) !important;
          border: none !important;
          color: white !important;
          font-weight: 850 !important;
        }
        .upgrade-btn:hover {
          opacity: 0.9;
        }
        .upgrade-btn :global(svg) {
          width: 16px;
          height: 16px;
          fill: currentColor;
        }
      `}</style>
    </>
  );
}
