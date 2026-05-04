import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatRupiah } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function SavedPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const saves = await prisma.savedItinerary.findMany({
    where: {
      userId: user.id,
    },
    include: {
      itinerary: true,
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
      <section className="side-card" style={{ marginTop: 16 }}>
        <h1>Koleksi Kamu</h1>
        <p>Itinerary yang kamu simpan untuk dipakai nanti.</p>
        <div className="server-list">
          {saves.length ? (
            saves.map(({ itinerary }) => (
              <Link className="server-card" href={`/itinerary/${itinerary.id}`} key={itinerary.id}>
                <img src={itinerary.coverImageUrl} alt={itinerary.destination} />
                <div>
                  <h3>{itinerary.title}</h3>
                  <p>
                    {itinerary.destination} - {itinerary.durationDays} hari - {formatRupiah(itinerary.estimatedBudget)}
                  </p>
                </div>
              </Link>
            ))
          ) : (
            <div className="empty-state">Belum ada rute tersimpan.</div>
          )}
        </div>
      </section>
    </main>
  );
}
