import Link from "next/link";
import { notFound } from "next/navigation";
import { IconSprite, Icon } from "@/components/icon-sprite";
import { ItineraryDetailActions } from "@/components/itinerary-detail-actions";
import { ItineraryInteractiveView } from "@/components/itinerary-interactive-view";
import { CloneItineraryButton } from "@/components/clone-itinerary-button";
import { getCurrentUser, isAdminUser } from "@/lib/auth";
import { getItineraryById } from "@/lib/itineraries";
import { formatRupiah } from "@/lib/format";
import { serializeItinerary } from "@/lib/serialize";

export const dynamic = "force-dynamic";

export default async function ItineraryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [itinerary, currentUser] = await Promise.all([getItineraryById(id), getCurrentUser()]);

  if (!itinerary) {
    notFound();
  }

  const canManage = currentUser && (currentUser.id === itinerary.authorId || isAdminUser(currentUser));

  if (!itinerary.isPublished && !canManage) {
    notFound();
  }

  const serializedItinerary = serializeItinerary(itinerary);

  return (
    <main className="page-center">
      <IconSprite />
      <div className="detail-topbar">
        <Link className="plain-link" href="/">
          Kembali ke feed
        </Link>
        {canManage ? (
          <ItineraryDetailActions itinerary={serializedItinerary} />
        ) : (
          <CloneItineraryButton itineraryId={itinerary.id} />
        )}
      </div>
      <section className="hero-card" style={{ marginTop: 16 }}>
        <img src={itinerary.coverImageUrl} alt={itinerary.destination} />
        <div className="hero-overlay">
          <p>{itinerary.destination}</p>
          <h1>{itinerary.title}</h1>
          <div className="creator-line">
            <img src={itinerary.author.avatarUrl ?? "/uploads/default-avatar.svg"} alt={itinerary.author.name ?? itinerary.author.email} />
            <span>{itinerary.author.name ?? itinerary.author.email}</span>
          </div>
          {!itinerary.isPublished && (
            <div className="remix-badge" style={{ marginTop: "12px", display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(229, 62, 62, 0.85)", padding: "5px 12px", borderRadius: "12px", fontSize: "11px", color: "#ffffff", fontWeight: 700, border: "1px solid rgba(255, 255, 255, 0.15)", marginRight: "8px" }}>
              <Icon name="shield" />
              <span>Itinerary Privat</span>
            </div>
          )}
          {itinerary.originalItinerary && (
            <div className="remix-badge" style={{ marginTop: "12px", display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(23, 33, 43, 0.82)", padding: "5px 12px", borderRadius: "12px", fontSize: "11px", color: "#f7fafc", fontWeight: 700, border: "1px solid rgba(255, 255, 255, 0.15)" }}>
              <Icon name="copy" />
              <span>
                Remix dari <Link href={`/itinerary/${itinerary.originalItinerary.id}`} style={{ color: "#ffffff", textDecoration: "underline", fontWeight: 800 }}>{itinerary.originalItinerary.title}</Link> oleh <Link href={`/profile/${itinerary.originalItinerary.author.username ?? itinerary.originalItinerary.author.id}`} style={{ color: "#ffffff", textDecoration: "underline", fontWeight: 800 }}>@{itinerary.originalItinerary.author.username ?? "creator"}</Link>
              </span>
            </div>
          )}
        </div>
      </section>
      <section className="quick-meta" style={{ marginTop: 16, paddingBottom: 0 }} aria-label="Ringkasan itinerary">
        <span className="meta-item">
          <Icon name="calendar" />
          <span>
            Durasi <strong>{itinerary.durationDays} hari</strong>
          </span>
        </span>
        <span className="meta-item">
          <Icon name="wallet" />
          <span>
            Estimasi <strong>{formatRupiah(itinerary.estimatedBudget)}</strong>
          </span>
        </span>
        <span className="meta-item">
          <Icon name="route" />
          <span>
            Per hari <strong>{formatRupiah(Math.round(itinerary.estimatedBudget / (itinerary.durationDays || 1)))}</strong>
          </span>
        </span>
        <span className="meta-item">
          <Icon name="star" />
          <span>
            Style <strong>{itinerary.travelStyle}</strong>
          </span>
        </span>
      </section>
      <section className="caption-block" style={{ marginTop: 16 }}>
        <p>
          <strong>{itinerary.author.username ?? itinerary.author.name ?? "jalanin"}</strong> {itinerary.description}
        </p>
        {itinerary.notes && (
          <div style={{ marginTop: 8, fontSize: "13px", color: "var(--muted)", lineHeight: "1.5" }}>
            <strong>Catatan:</strong> {itinerary.notes}
          </div>
        )}
      </section>
      <ItineraryInteractiveView itinerary={serializedItinerary} />
    </main>
  );
}
