import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="page-center">
      <section className="auth-card">
        <h1>Login Jalanin</h1>
        <p>Masuk untuk menyimpan rute, membuat itinerary, dan memakai template traveler lain.</p>
        <form action="/api/auth/login" method="post">
          <label>
            Email
            <input name="email" type="email" required defaultValue="" />
          </label>
          <label>
            Password
            <input name="password" type="password" required defaultValue="" />
          </label>
          <button className="primary-button wide" type="submit">
            Login
          </button>
        </form>
        <div className="auth-links">
          Belum punya akun? <Link href="/register">Daftar</Link>
        </div>
      </section>
    </main>
  );
}
