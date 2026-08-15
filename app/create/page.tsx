import { BudgetField } from "@/components/budget-field";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function CreatePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="page-center">
      <section className="auth-card">
        <h1 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          Buat Itinerary
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
        <p>Form ini menyimpan itinerary langsung ke database Jalanin.</p>
        <form className="stack-form" action="/api/itineraries" method="post" encType="multipart/form-data">
          <label>
            Judul itinerary
            <input name="title" required />
          </label>
          <label>
            Destinasi utama
            <input name="destination" required />
          </label>
          <div className="form-grid">
            <label>
              Durasi
              <input name="durationDays" type="number" min="1" max="25" defaultValue={1} required />
            </label>
            <BudgetField />
          </div>
          <label>
            Travel style
            <select name="travelStyle" defaultValue="Budget trip">
              <option>Budget trip</option>
              <option>Kuliner</option>
              <option>Couple</option>
              <option>Nature</option>
              <option>City tour</option>
              <option>Family</option>
            </select>
          </label>
          <label>
            Visibilitas
            <select name="isPublished" defaultValue="true">
              <option value="true">Publik (Bisa dilihat semua orang, batas maks 5)</option>
              <option value="false">Privat (Hanya bisa dilihat oleh Anda, batas maks 2)</option>
            </select>
          </label>
          <label>
            Cover image
            <input name="imageFile" type="file" accept="image/png,image/jpeg,image/webp" />
          </label>
          <input type="hidden" name="coverImageUrl" value="/uploads/default-cover.svg" />
          <label>
            Deskripsi
            <textarea name="description" rows={4} required />
          </label>
          <label>
            Catatan
            <textarea name="notes" rows={3} />
          </label>
          <label>
            Aktivitas hari pertama
            <textarea name="activities" rows={5} placeholder={"09.00 - Tiba di kota tujuan\n12.00 - Makan siang lokal"} />
          </label>
          <button className="primary-button wide" type="submit">
            Publish Itinerary
          </button>
        </form>
      </section>
    </main>
  );
}
