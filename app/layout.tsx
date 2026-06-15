import type { Metadata } from "next";
import Script from "next/script";
import "maplibre-gl/dist/maplibre-gl.css";
import "../styles.css";
import "./next-overrides.css";

export const metadata: Metadata = {
  title: "Jalanin - Temukan trip. Simpan rute. Jalanin.",
  description: "Platform sosial travel untuk menemukan, menyimpan, dan menggunakan itinerary.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>
        {children}
        {/* Google tag (gtag.js) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-DVV6GX51JE"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-DVV6GX51JE');
          `}
        </Script>
      </body>
    </html>
  );
}
