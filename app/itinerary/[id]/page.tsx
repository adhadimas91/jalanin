import Link from "next/link";
import { notFound } from "next/navigation";
import { IconSprite } from "@/components/icon-sprite";
import { ItineraryDetailActions } from "@/components/itinerary-detail-actions";
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
  const serializedItinerary = serializeItinerary(itinerary);

  return (
    <main className="page-center">
      <IconSprite />
      <div className="detail-topbar">
        <Link className="plain-link" href="/">
          Kembali ke feed
        </Link>
        {canManage ? <ItineraryDetailActions itinerary={serializedItinerary} /> : null}
      </div>
      <section className="hero-card" style={{ marginTop: 16 }}>
        <img src={itinerary.coverImageUrl} alt={itinerary.destination} />
        <div className="hero-overlay">
          <p>{itinerary.destination}</p>
          <h1>{itinerary.title}</h1>
          <div className="creator-line">
            <img src={itinerary.author.avatarUrl ?? "/uploads/default-cover.svg"} alt={itinerary.author.name ?? itinerary.author.email} />
            <span>{itinerary.author.name ?? itinerary.author.email}</span>
          </div>
        </div>
      </section>
      <section className="notes-card">
        <h3>Ringkasan</h3>
        <p>
          {itinerary.durationDays} hari, {formatRupiah(itinerary.estimatedBudget)} - {itinerary.description}
        </p>
      </section>
      <div className="server-list">
        {itinerary.days.map((day) => (
          <article className="side-card" key={day.id}>
            <h2>{day.title}</h2>
            <div className="timeline">
              {day.activities.map((activity) => (
                <article className="activity-card" key={activity.id}>
                  <div className="activity-time">{activity.time}</div>
                  <div className="activity-main">
                    <strong>{activity.title}</strong>
                    <span>{activity.locationName || activity.category}</span>
                  </div>
                  <div className="activity-cost">{activity.estimatedCost ? formatRupiah(activity.estimatedCost) : "Gratis"}</div>
                </article>
              ))}
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
