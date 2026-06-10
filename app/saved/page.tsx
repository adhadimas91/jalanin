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
        <h1 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          Koleksi Kamu
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
        </h1>
        <p>Itinerary yang kamu simpan untuk dipakai nanti.</p>
        <SavedList initialSaves={formattedSaves} />
      </section>
    </main>
  );
}
