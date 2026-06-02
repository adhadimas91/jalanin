import type { Metadata } from "next";
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
      <body>{children}</body>
    </html>
  );
}
