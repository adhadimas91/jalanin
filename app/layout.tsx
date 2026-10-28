import type { Metadata } from "next";
import Script from "next/script";
import "maplibre-gl/dist/maplibre-gl.css";
import "../styles.css";
import "./next-overrides.css";

import { ImpersonationBanner } from "@/components/impersonation-banner";

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
    <html lang="id" suppressHydrationWarning>
      <head>
        <script
          {...({
            nowprocket: "",
            "seraph-accel-crit": "1",
          } as Record<string, string>)}
          data-noptimize="1"
          data-cfasync="false"
          data-wpfc-render="false"
          data-no-defer="1"
          data-cmp-ab="2"
          dangerouslySetInnerHTML={{
            __html: `
  (function () {
      var script = document.createElement("script");
      script.async = 1;
      script.setAttribute("data-cmp-ab","2");
      script.src = 'https://emrldtp.com/NTkyNDIy.js?t=592422';
      document.head.appendChild(script);
  })();
`,
          }}
        />
      </head>
      <body>
        <ImpersonationBanner />
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
