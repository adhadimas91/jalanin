import { getCurrentUser } from "@/lib/auth";
import { getPublishedItineraries, getUserState } from "@/lib/itineraries";
import { JalaninApp } from "@/components/jalanin-app";
import { serializeItinerary, serializeUser } from "@/lib/serialize";

export const dynamic = "force-dynamic";

function DeploymentFallback({ error }: { error: unknown }) {
  const message =
    error instanceof Error ? error.message.split("\n")[0] : "Unknown server error";
  const missingEnv = [
    ["DATABASE_URL", process.env.DATABASE_URL],
    ["NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL],
    [
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    ],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);

  return (
    <main className="page-center">
      <section className="auth-card">
        <h1>Jalanin belum bisa memuat data</h1>
        <p>
          App berhasil deploy, tetapi server belum bisa mengambil data runtime.
          Cek environment variables di Vercel lalu redeploy.
        </p>
        {missingEnv.length > 0 ? (
          <div className="empty-state">
            Missing env: <strong>{missingEnv.join(", ")}</strong>
          </div>
        ) : (
          <div className="empty-state">Server error: {message}</div>
        )}
        <div className="auth-links">
          Buka <a href="/api/health">/api/health</a> untuk diagnostic aman.
        </div>
      </section>
    </main>
  );
}

export default async function Home() {
  try {
    const [currentUser, itineraries] = await Promise.all([
      getCurrentUser(),
      getPublishedItineraries(),
    ]);
    const userState = await getUserState(currentUser?.id);

    return (
      <JalaninApp
        itineraries={itineraries.map(serializeItinerary)}
        currentUser={currentUser ? serializeUser(currentUser) : null}
        savedIds={userState.savedIds}
        likedIds={userState.likedIds}
      />
    );
  } catch (error) {
    return <DeploymentFallback error={error} />;
  }
}
