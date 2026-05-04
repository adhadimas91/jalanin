import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatRupiah } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ username }, { id: username }],
    },
    include: {
      trips: {
        orderBy: {
          createdAt: "desc",
        },
      },
      saves: true,
    },
  });

  if (!user) {
    notFound();
  }

  return (
    <main className="page-center">
      <Link className="plain-link" href="/">
        Kembali ke feed
      </Link>
      <article className="profile-panel" style={{ marginTop: 16 }}>
        <img src={user.avatarUrl ?? "/uploads/default-cover.svg"} alt={user.name ?? user.email} />
        <div>
          <h2>{user.name ?? user.email}</h2>
          <p>
            @{user.username ?? user.id} - {user.city ?? "Indonesia"}. {user.bio ?? "Traveler Jalanin"}
          </p>
          <div className="profile-stats">
            <span>
              <strong>{user.trips.length}</strong> dibuat
            </span>
            <span>
              <strong>{user.saves.length}</strong> disimpan
            </span>
          </div>
        </div>
      </article>
      <div className="server-list">
        {user.trips.map((trip) => (
          <Link className="server-card" href={`/itinerary/${trip.id}`} key={trip.id}>
            <img src={trip.coverImageUrl} alt={trip.destination} />
            <div>
              <h3>{trip.title}</h3>
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
