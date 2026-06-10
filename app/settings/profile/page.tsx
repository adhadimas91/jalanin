import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SubscriptionStatus } from "@/components/subscription-status";

export const dynamic = "force-dynamic";

export default async function ProfileSettingsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const [privateCount, publicCount, savedCount, affiliateCount] = await Promise.all([
    prisma.itinerary.count({
      where: {
        authorId: user.id,
        isPublished: false,
      },
    }),
    prisma.itinerary.count({
      where: {
        authorId: user.id,
        isPublished: true,
      },
    }),
    prisma.savedItinerary.count({
      where: {
        userId: user.id,
      },
    }),
    prisma.affiliateLink.count({
      where: {
        userId: user.id,
      },
    }),
  ]);

  return (
    <main className="page-center">
      <Link className="plain-link" href={`/profile/${user.username ?? user.id}`}>
        Kembali ke profil
      </Link>
      <section className="auth-card settings-card">
        <div className="settings-heading">
          <img className="settings-avatar" src={user.avatarUrl ?? "/uploads/default-avatar.svg"} alt={user.name ?? user.email} />
          <div>
            <h1>Edit Profil</h1>
            <p>Perbarui identitas traveler dan foto avatar kamu.</p>
          </div>
        </div>
        <form className="stack-form" action="/api/profile" method="post" encType="multipart/form-data">
          <label>
            Avatar upload
            <input name="avatarFile" type="file" accept="image/png,image/jpeg,image/webp" />
          </label> 
          <label>
            Nama
            <input name="name" defaultValue={user.name ?? ""} />
          </label>
          <label>
            Username
            <input name="username" required defaultValue={user.username ?? user.id} />
          </label>
          <label>
            Kota
            <input name="city" defaultValue={user.city ?? ""} />
          </label>
          <label>
            Bio
            <textarea name="bio" rows={4} defaultValue={user.bio ?? ""} />
          </label>
          <button className="primary-button wide" type="submit">
            Simpan Profil
          </button>
        </form>
      </section>

      <SubscriptionStatus
        user={user}
        privateCount={privateCount}
        publicCount={publicCount}
        savedCount={savedCount}
        affiliateCount={affiliateCount}
      />
    </main>
  );
}
