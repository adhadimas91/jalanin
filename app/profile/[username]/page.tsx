import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatRupiah } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const currentUser = await getCurrentUser();
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ username }, { id: username }],
    },
    include: {
      saves: true,
    },
  });

  if (!user) {
    notFound();
  }

  const isOwnProfile = currentUser?.id === user.id;

  const trips = await prisma.itinerary.findMany({
    where: {
      authorId: user.id,
      ...(isOwnProfile ? {} : { isPublished: true }),
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <main className="page-center">
      <Link className="plain-link" href="/">
        Kembali ke feed
      </Link>
      <article className="profile-panel" style={{ marginTop: 16 }}>
        <img src={user.avatarUrl ?? "/uploads/default-avatar.svg"} alt={user.name ?? user.email} />
        <div>
          <h2 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {user.name ?? user.email}
            {user.isPro && (
              <span className="pro-badge" style={{
                fontSize: "11px",
                fontWeight: 850,
                color: "#111",
                background: "linear-gradient(135deg, #ffd700, #ffa500)",
                padding: "2px 8px",
                borderRadius: "999px",
                border: "1px solid #ffb700",
                textTransform: "uppercase",
                display: "inline-flex",
                alignItems: "center",
                lineHeight: "1",
                height: "fit-content"
              }}>
                PRO
              </span>
            )}
          </h2>
          <p>
            @{user.username ?? user.id} - {user.city ?? "Indonesia"}. {user.bio ?? "Traveler Jalanin"}
          </p>
          <div className="profile-stats">
            <span>
              <strong>{trips.length}</strong> dibuat
            </span> 
          </div>
          {currentUser?.id === user.id ? (
            <div className="profile-actions">
              <Link className="mini-button muted" href="/saved">
                Rute tersimpan
              </Link>
              <Link className="mini-button muted" href="/settings/profile">
                Edit profil
              </Link>
              <Link className="mini-button muted" href="/settings/affiliate" style={{ marginLeft: "8px" }}>
                Link Affiliate
              </Link>
            </div>
          ) : null}
        </div>
      </article>
      <div className="server-list">
        {trips.map((trip) => (
          <Link className="server-card" href={`/itinerary/${trip.id}`} key={trip.id}>
            <img src={trip.coverImageUrl} alt={trip.destination} />
            <div>
              <h3>
                {trip.title}
                {!trip.isPublished && (
                  <span style={{ marginLeft: "8px", fontSize: "11px", padding: "2px 6px", background: "rgba(229, 62, 62, 0.2)", color: "#e53e3e", borderRadius: "4px", fontWeight: 700 }}>Privat</span>
                )}
              </h3>
              <p>
                {trip.destination} - {trip.durationDays} hari - {formatRupiah(trip.estimatedBudget)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
