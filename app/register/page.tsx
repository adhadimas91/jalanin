import Link from "next/link";
import { prisma } from "@/lib/prisma";
import RegisterFormClient from "./RegisterFormClient";

export default async function RegisterPage() {
  const setting = await prisma.appSetting.findUnique({
    where: { key: "email_whitelist" },
  });
  const whitelist = setting?.value || "gmail.com,outlook.com,yahoo.com,icloud.com";

  return (
    <main className="page-center">
      <section className="auth-card">
        <h1>Buat Akun</h1>
        <p>Daftar untuk mulai menyimpan dan membagikan itinerary.</p>
        <RegisterFormClient whitelist={whitelist} />
        <div className="auth-links">
          Sudah punya akun? <Link href="/login">Login</Link>
        </div>
      </section>
    </main>
  );
}
