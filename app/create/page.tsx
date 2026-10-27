import { CreateItineraryForm } from "@/components/create-itinerary-form";
import { getCurrentUser, getImpersonatorUser, isAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function CreatePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const impersonator = await getImpersonatorUser();
  const isAdmin = isAdminUser(user) || !!impersonator;

  const curatedUsers =
    !impersonator && isAdmin
      ? await prisma.user.findMany({
          where: { isClaimed: false },
          select: { id: true, username: true, name: true, city: true },
          orderBy: { createdAt: "desc" },
        })
      : [];

  return (
    <main className="page-center">
      <section className="auth-card">
        <h1 style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          Buat Itinerary
          {user.isPro && (
            <span
              className="pro-badge"
              style={{
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
                height: "fit-content",
              }}
            >
              PRO
            </span>
          )}
          {!user.isClaimed && (
            <span
              style={{
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
                height: "fit-content",
              }}
            >
              Akun Kurasi
            </span>
          )}
        </h1>

        {!user.isClaimed && (
          <div
            style={{
              margin: "10px 0 16px 0",
              padding: "10px 14px",
              background: "#fffbeb",
              border: "1px solid #fde68a",
              borderRadius: "10px",
              fontSize: "13px",
              color: "#92400e",
            }}
          >
            Itinerary ini akan diterbitkan atas nama Akun Kurasi:{" "}
            <strong>@{user.username ?? user.id}</strong> {user.name ? `(${user.name})` : ""}.
          </div>
        )}

        {isAdmin && !impersonator && curatedUsers.length > 0 && (
          <div
            style={{
              margin: "10px 0 18px 0",
              padding: "14px",
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              borderRadius: "10px",
              fontSize: "13px",
            }}
          >
            <div style={{ fontWeight: 700, color: "#166534", marginBottom: "4px" }}>
              💡 Mode Kurasi Admin
            </div>
            <p style={{ margin: "0 0 10px 0", color: "#15803d", fontSize: "12px" }}>
              Ingin membuat itinerary untuk akun kurasi influencer/traveler? Pilih akun di bawah untuk langsung beralih:
            </p>
            <form
              action="/api/admin/impersonate"
              method="POST"
              style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}
            >
              <select
                name="userId"
                required
                style={{
                  padding: "6px 10px",
                  borderRadius: "8px",
                  border: "1px solid #86efac",
                  fontSize: "13px",
                  flex: 1,
                  minWidth: "220px",
                  background: "#fff",
                }}
              >
                <option value="">-- Pilih Akun Kurasi --</option>
                {curatedUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    @{u.username ?? u.id} {u.name ? `(${u.name})` : ""} - {u.city ?? "Indonesia"}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="primary-button"
                style={{
                  background: "#16a34a",
                  color: "#fff",
                  padding: "6px 14px",
                  borderRadius: "8px",
                  border: "none",
                  fontWeight: 700,
                  fontSize: "12px",
                  cursor: "pointer",
                }}
              >
                Masuk & Buat Itinerary
              </button>
            </form>
          </div>
        )}

        <p>
          Isi rincian perjalanan Anda secara manual atau gunakan bantuan AI untuk mengekstrak langsung dari link video YouTube travel vlog.
        </p>

        <CreateItineraryForm isAdmin={isAdmin} curatedUserId={!user.isClaimed ? user.id : undefined} />
      </section>
    </main>
  );
}
