import Link from "next/link";

interface Props {
  searchParams: Promise<{ error?: string; success?: string }>;
}

export default async function ForgotPasswordPage({ searchParams }: Props) {
  const params = await searchParams;
  const error = params.error;
  const success = params.success === "1";

  return (
    <main className="page-center">
      <section className="auth-card">
        <h1>Lupa Password</h1>
        {success ? (
          <>
            <div className="auth-success-box">
              <div className="auth-success-icon">✉️</div>
              <p>
                Jika email tersebut terdaftar di Jalanin, kami sudah mengirimkan link reset password.
                Cek inbox (atau folder spam) Anda.
              </p>
            </div>
            <div className="auth-links">
              <Link href="/login">← Kembali ke Login</Link>
            </div>
          </>
        ) : (
          <>
            <p>
              Masukkan email akun Anda dan kami akan mengirimkan link untuk mereset password.
            </p>
            {error && <p className="auth-error">{error}</p>}
            <form action="/api/auth/forgot-password" method="post">
              <label>
                Email
                <input name="email" type="email" required autoFocus placeholder="email@kamu.com" />
              </label>
              <button className="primary-button wide" type="submit">
                Kirim Link Reset
              </button>
            </form>
            <div className="auth-links">
              Ingat password? <Link href="/login">Masuk</Link>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
