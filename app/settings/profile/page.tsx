import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SubscriptionStatus } from "@/components/subscription-status";

export const dynamic = "force-dynamic";

export default async function ProfileSettingsPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const { error } = (await searchParams) ?? {};
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const [privateCount, publicCount, savedCount, myLinkCount, appSettingsList] = await Promise.all([
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
    prisma.myLink.count({
      where: {
        userId: user.id,
      },
    }),
    prisma.appSetting.findMany(),
  ]);

  const settingsMap = Object.fromEntries(appSettingsList.map((s) => [s.key, s.value]));

  return (
    <main className="page-center">
      <Link className="plain-link" href={`/profile/${user.username ?? user.id}`}>
        Kembali ke profil
      </Link>
      <section className="auth-card settings-card">
        <div className="settings-heading">
          <img className="settings-avatar" src={user.avatarUrl ?? "/uploads/default-avatar.svg"} alt={user.name ?? user.email} />
          <div>
            <h1 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              Edit Profil
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
            <p>Perbarui identitas traveler dan foto avatar kamu.</p>
          </div>
        </div>
        {error && (
          <div style={{
            padding: "10px 14px",
            background: "#fef2f2",
            color: "#b91c1c",
            border: "1px solid #fecaca",
            borderRadius: "10px",
            marginBottom: "16px",
            fontSize: "13px",
            fontWeight: 500,
          }}>
            {error}
          </div>
        )}
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
          <div style={{ marginTop: "12px", paddingTop: "14px", borderTop: "1px solid var(--line)" }}>
            <div style={{ marginBottom: "12px" }}>
              <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)" }}>Media Sosial</span>
              <p style={{ fontSize: "12px", color: "var(--muted)", margin: "4px 0 0 0" }}>
                Hubungkan akun media sosial kamu agar muncul di profil dan dapat dikunjungi traveler lain.
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <label>
                Instagram
                <input
                  name="instagram"
                  placeholder="@username atau https://instagram.com/..."
                  defaultValue={user.instagram ?? ""}
                />
              </label>
              <label>
                TikTok
                <input
                  name="tiktok"
                  placeholder="@username atau https://tiktok.com/@..."
                  defaultValue={user.tiktok ?? ""}
                />
              </label>
              <label>
                YouTube
                <input
                  name="youtube"
                  placeholder="@channel atau https://youtube.com/@..."
                  defaultValue={user.youtube ?? ""}
                />
              </label>
            </div>
          </div>
          <button className="primary-button wide" type="submit" style={{ marginTop: "16px" }}>
            Simpan Profil
          </button>
        </form>
        <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1px solid var(--line)" }}>
          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              className="ghost-chip danger"
              style={{ width: "100%", justifyContent: "center", display: "flex", padding: "12px", color: "#e53e3e", borderColor: "rgba(229, 62, 62, 0.4)" }}
            >
              Logout dari Akun
            </button>
          </form>
        </div>
      </section>

      <SubscriptionStatus
        user={user}
        privateCount={privateCount}
        publicCount={publicCount}
        savedCount={savedCount}
        myLinkCount={myLinkCount}
        whatsappNumber={settingsMap.whatsapp_number}
        price1m={settingsMap.price_1m}
        rate1m={settingsMap.rate_1m}
        promo1m={settingsMap.promo_1m}
        price3m={settingsMap.price_3m}
        rate3m={settingsMap.rate_3m}
        promo3m={settingsMap.promo_3m}
        price6m={settingsMap.price_6m}
        rate6m={settingsMap.rate_6m}
        promo6m={settingsMap.promo_6m}
        price1y={settingsMap.price_1y}
        rate1y={settingsMap.rate_1y}
        promo1y={settingsMap.promo_1y}
      />
    </main>
  );
}
