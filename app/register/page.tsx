import Link from "next/link";

export default function RegisterPage() {
  return (
    <main className="page-center">
      <section className="auth-card">
        <h1>Buat Akun</h1>
        <p>Daftar untuk mulai menyimpan dan membagikan itinerary.</p>
        <form action="/api/auth/register" method="post">
          <label>
            Nama
            <input name="name" required />
          </label>
          <label>
            Email
            <input name="email" type="email" required />
          </label>
          <label>
            Password
            <input name="password" type="password" minLength={8} required />
          </label>
          <button className="primary-button wide" type="submit">
            Daftar
          </button>
        </form>
        <div className="auth-links">
          Sudah punya akun? <Link href="/login">Login</Link>
        </div>
      </section>
    </main>
  );
}
