import Link from "next/link";
import { getCurrentUser, getImpersonatorUser } from "@/lib/auth";

export async function ImpersonationBanner() {
  const impersonator = await getImpersonatorUser();
  if (!impersonator) {
    return null;
  }

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return null;
  }

  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 9999,
        background: "linear-gradient(90deg, #fffbeb 0%, #fef3c7 100%)",
        borderBottom: "1px solid #fde68a",
        padding: "10px 16px",
        fontSize: "13px",
        color: "#92400e",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        boxShadow: "0 2px 10px rgba(217, 119, 6, 0.08)",
        flexWrap: "wrap",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
        <span
          style={{
            backgroundColor: "#d97706",
            color: "#ffffff",
            fontSize: "10px",
            fontWeight: 800,
            padding: "3px 8px",
            borderRadius: "999px",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          Mode Kurasi
        </span>
        <span>
          Anda masuk sebagai <strong>{currentUser.name ?? currentUser.username}</strong> (@
          {currentUser.username ?? currentUser.id})
          {!currentUser.isClaimed && " • Akun Kurasi"}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <Link
          href="/create"
          style={{
            backgroundColor: "#d97706",
            color: "#ffffff",
            padding: "5px 12px",
            borderRadius: "6px",
            fontWeight: 700,
            fontSize: "12px",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          + Buat Itinerary
        </Link>
        <form action="/api/admin/impersonate/exit" method="POST" style={{ margin: 0 }}>
          <button
            type="submit"
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #d97706",
              color: "#d97706",
              padding: "5px 12px",
              borderRadius: "6px",
              fontWeight: 600,
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            Kembali ke Admin
          </button>
        </form>
      </div>
    </div>
  );
}
