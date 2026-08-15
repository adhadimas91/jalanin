import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatRupiah } from "@/lib/format";
import { ProfileAnalytics, TrackedLink } from "@/components/tracked-link";

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

  const profileUsername = user.username || user.id;

  return (
    <main className="page-center">
      <ProfileAnalytics username={profileUsername} isOwnProfile={isOwnProfile} />
      <TrackedLink
        className="plain-link"
        href="/"
        eventName="profile_back_to_feed"
        eventParams={{ username: profileUsername }}
      >
        Kembali ke feed
      </TrackedLink>
      <article className="profile-panel" style={{ marginTop: 16 }}>
        <img src={user.avatarUrl ?? "/uploads/default-avatar.svg"} alt={user.name ?? user.email} />
        <div>
          <h2 style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
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
            {!user.isClaimed && (
              <span style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "#d97706",
                background: "#fef3c7",
                padding: "2px 8px",
                borderRadius: "999px",
                border: "1px solid #fde68a",
                display: "inline-flex",
                alignItems: "center",
                lineHeight: "1",
                height: "fit-content"
              }}>
                Akun Kurasi
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

          {!user.isClaimed && !isOwnProfile && (
            <div style={{
              margin: "12px 0 6px 0",
              padding: "12px 14px",
              background: "linear-gradient(135deg, rgba(0, 149, 246, 0.08), rgba(255, 45, 85, 0.08))",
              border: "1px solid rgba(0, 149, 246, 0.2)",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              flexWrap: "wrap",
            }}>
              <div style={{ fontSize: "13px", color: "var(--text)", flex: 1, minWidth: "220px" }}>
                <strong>Pemilik konten ini?</strong> Klaim akun Anda untuk mengelola rute perjalanan & kontak sendiri.
              </div>
              <TrackedLink
                className="primary-button"
                href={`/claim/${profileUsername}`}
                style={{
                  fontSize: "13px",
                  padding: "8px 16px",
                  borderRadius: "999px",
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                  background: "#0095f6",
                  color: "#fff",
                  fontWeight: 700,
                }}
                eventName="profile_click_claim_account"
                eventParams={{ username: profileUsername }}
              >
                Klaim Akun Ini
              </TrackedLink>
            </div>
          )}

          {currentUser?.id === user.id ? (
            <div className="profile-actions">
              <TrackedLink
                className="mini-button muted"
                href="/saved"
                eventName="profile_click_saved_routes"
                eventParams={{ username: profileUsername }}
              >
                Rute tersimpan
              </TrackedLink>
              <TrackedLink
                className="mini-button muted"
                href="/settings/profile"
                eventName="profile_click_edit_profile"
                eventParams={{ username: profileUsername }}
              >
                Edit profil
              </TrackedLink>
              <TrackedLink
                className="mini-button muted"
                href="/settings/mylink"
                style={{ marginLeft: "8px" }}
                eventName="profile_click_mylink_settings"
                eventParams={{ username: profileUsername }}
              >
                Link MyLink
              </TrackedLink>
            </div>
          ) : null}
        </div>
      </article>
      <div className="server-list">
        {trips.map((trip) => (
          <TrackedLink
            className="server-card"
            href={`/itinerary/${trip.id}`}
            key={trip.id}
            eventName="profile_click_itinerary"
            eventParams={{
              itinerary_id: trip.id,
              title: trip.title,
              destination: trip.destination,
              username: profileUsername,
            }}
          >
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
          </TrackedLink>
        ))}
      </div>
    </main>
  );
}
