"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon, IconSprite } from "./icon-sprite";

type UserProps = {
  isPro: boolean;
  proExpiresAt?: string | null | Date;
  maxPrivate: number;
  maxPublic: number;
  maxSaved: number;
  maxAffiliate: number;
};

type Props = {
  user: UserProps;
  privateCount: number;
  publicCount: number;
  savedCount: number;
  affiliateCount: number;
};

export function SubscriptionStatus({
  user,
  privateCount,
  publicCount,
  savedCount,
  affiliateCount,
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

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
                {privateCount} / {renderLimitValue(user.maxPrivate)}
              </span>
            </div>
            <div className="limit-bar-bg">
              <div
                className={`limit-bar ${user.isPro ? "pro-bar" : ""}`}
                style={{
                  width: `${user.maxPrivate >= 9999 ? 100 : Math.min((privateCount / user.maxPrivate) * 100, 100)}%`,
                }}
              />
            </div>
          </div>

          <div className="limit-item">
            <div className="limit-label-container">
              <span className="limit-name">Itinerary Publik</span>
              <span className="limit-progress">
                {publicCount} / {renderLimitValue(user.maxPublic)}
              </span>
            </div>
            <div className="limit-bar-bg">
              <div
                className={`limit-bar ${user.isPro ? "pro-bar" : ""}`}
                style={{
                  width: `${user.maxPublic >= 9999 ? 100 : Math.min((publicCount / user.maxPublic) * 100, 100)}%`,
                }}
              />
            </div>
          </div>

          <div className="limit-item">
            <div className="limit-label-container">
              <span className="limit-name">Rute Tersimpan</span>
              <span className="limit-progress">
                {savedCount} / {renderLimitValue(user.maxSaved)}
              </span>
            </div>
            <div className="limit-bar-bg">
              <div
                className={`limit-bar ${user.isPro ? "pro-bar" : ""}`}
                style={{
                  width: `${user.maxSaved >= 9999 ? 100 : Math.min((savedCount / user.maxSaved) * 100, 100)}%`,
                }}
              />
            </div>
          </div>

          <div className="limit-item">
            <div className="limit-label-container">
              <span className="limit-name">Tautan Affiliate</span>
              <span className="limit-progress">
                {affiliateCount} / {renderLimitValue(user.maxAffiliate)}
              </span>
            </div>
            <div className="limit-bar-bg">
              <div
                className={`limit-bar ${user.isPro ? "pro-bar" : ""}`}
                style={{
                  width: `${user.maxAffiliate >= 9999 ? 100 : Math.min((affiliateCount / user.maxAffiliate) * 100, 100)}%`,
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
              onClick={() => handleSubscription("upgrade")}
              disabled={busy}
            >
              <Icon name="star" />
              <span>{busy ? "Memproses..." : "Upgrade ke PRO 🚀"}</span>
            </button>
          )}
        </div>
      </div>

      <style jsx>{`
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
