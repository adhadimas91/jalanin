import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SavedList } from "@/components/saved-list";

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

  const formattedSaves = saves.map((save) => ({
    id: save.itinerary.id,
    coverImageUrl: save.itinerary.coverImageUrl,
    destination: save.itinerary.destination,
    title: save.itinerary.title,
    durationDays: save.itinerary.durationDays,
    estimatedBudget: save.itinerary.estimatedBudget,
  }));

  return (
    <main className="page-center">
      <Link className="plain-link" href="/">
        Kembali ke feed
      </Link>
      <section className="side-card" style={{ marginTop: 16 }}>
        <h1>Koleksi Kamu</h1>
        <p>Itinerary yang kamu simpan untuk dipakai nanti.</p>
        <SavedList initialSaves={formattedSaves} />
      </section>
    </main>
  );
}
