"use client";

import Link from "next/link";
import type { JalaninItinerary } from "./jalanin-app";
import { Icon, IconSprite } from "./icon-sprite";
import { formatRupiah } from "@/lib/format";

type Props = {
  itineraries: JalaninItinerary[];
};

export function JalaninLanding({ itineraries }: Props) {
  const featured = itineraries.slice(0, 3);
  const gallery = itineraries.slice(0, 5);
  const destinationCards = itineraries.slice(0, 4);

  return (
    <>
      <IconSprite />
      <main className="landing-shell">
        <header className="landing-topbar">
          <Link className="brand" href="/" aria-label="Jalanin home">
            <span className="brand-mark" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
            <span>Jalanin</span>
          </Link>

          <nav className="landing-nav" aria-label="Landing navigation">
            <a href="#destinations">Destinasi</a>
            <a href="#features">Fitur</a>
            <a href="#about">Tentang</a>
          </nav>

          <div className="landing-actions">
            <Link className="ghost-chip" href="/login">
              Login
            </Link>
            <Link className="primary-button" href="/register">
              Mulai Jalanin
            </Link>
          </div>
        </header>

        <section className="landing-hero">
          <div className="landing-copy">
            <span className="landing-eyebrow">Rute Liburan Lebih Mudah</span>
            <h1>Temukan itinerary cantik, simpan idenya, lalu jalanin versi kamu sendiri.</h1>
            <p>
              Jalanin membantu traveler menemukan rute asli dari creator lain, melihat budget real,
              dan mengubahnya jadi trip pribadi tanpa mulai dari nol.
            </p>

            <div className="landing-searchbar">
              <div className="landing-searchitem">
                <Icon name="map-pin" />
                <div>
                  <strong>Lokasi</strong>
                  <span>Mau ke mana minggu ini?</span>
                </div>
              </div>
              <div className="landing-searchitem">
                <Icon name="user" />
                <div>
                  <strong>Style</strong>
                  <span>Budget, kuliner, family</span>
                </div>
              </div>
              <div className="landing-searchitem">
                <Icon name="calendar" />
                <div>
                  <strong>Durasi</strong>
                  <span>Weekend atau long trip</span>
                </div>
              </div>
              <Link className="primary-button" href="/register">
                Get Started
              </Link>
            </div>

            <div className="landing-metrics">
              <article>
                <strong>2.000+</strong>
                <span>trip ideas</span>
              </article>
              <article>
                <strong>100+</strong>
                <span>destinasi</span>
              </article>
              <article>
                <strong>24/7</strong>
                <span>akses itinerary</span>
              </article>
            </div>
          </div>

          <div className="landing-mosaic">
            {gallery.map((item, index) => (
              <article
                key={item.id}
                className={`landing-mosaic-card card-${index + 1}`}
              >
                <img src={item.coverImageUrl} alt={item.destination} />
                <div className="landing-mosaic-meta">
                  <strong>{item.title}</strong>
                  <span>{item.destination}</span>
                </div>
              </article>
            ))}
            <div className="landing-floating-badge badge-top">100% verified routes</div>
            <div className="landing-floating-badge badge-bottom">Remix itinerary in one tap</div>
          </div>
        </section>

        <section className="landing-showcase" id="about">
          <div className="landing-showcase-stack">
            {featured.slice(0, 2).map((item) => (
              <article key={item.id} className="landing-photo-card">
                <img src={item.coverImageUrl} alt={item.destination} />
              </article>
            ))}
          </div>

          <div className="landing-showcase-copy">
            <span className="landing-eyebrow">Tentang Jalanin</span>
            <h2>Planner sosial untuk traveler yang ingin cepat berangkat, bukan lama mikir.</h2>
            <p>
              Simpan itinerary dari creator lain, bandingkan budget, lalu clone rutenya jadi
              starting point perjalananmu. Cocok untuk short escape, honeymoon, sampai city break.
            </p>
            <div className="landing-stat-grid">
              <article>
                <strong>2000+</strong>
                <span>explorer memakai template trip</span>
              </article>
              <article>
                <strong>100+</strong>
                <span>destination boards</span>
              </article>
              <article>
                <strong>20+</strong>
                <span>kategori trip populer</span>
              </article>
            </div>
          </div>
        </section>

        <section className="landing-features" id="features">
          <div className="section-heading">
            <div>
              <p>What We Give</p>
              <h2>Fitur yang bikin rencana jalan jadi ringan</h2>
            </div>
          </div>
          <div className="landing-feature-grid">
            <article className="landing-feature-card">
              <span className="summary-icon">
                <Icon name="compass" />
              </span>
              <h3>Feed inspirasi</h3>
              <p>Lihat destinasi dan rute dari traveler lain dengan format yang gampang dipindai.</p>
            </article>
            <article className="landing-feature-card">
              <span className="summary-icon">
                <Icon name="bookmark" />
              </span>
              <h3>Simpan cepat</h3>
              <p>Kumpulkan rute menarik ke koleksi pribadi untuk dibuka lagi saat siap booking.</p>
            </article>
            <article className="landing-feature-card">
              <span className="summary-icon">
                <Icon name="copy" />
              </span>
              <h3>Clone itinerary</h3>
              <p>Ambil itinerary yang sudah jadi, lalu remix menjadi versi perjalananmu sendiri.</p>
            </article>
            <article className="landing-feature-card">
              <span className="summary-icon">
                <Icon name="wallet" />
              </span>
              <h3>Budget kebaca</h3>
              <p>Lihat estimasi biaya total dan biaya per hari sebelum memutuskan trip mana yang cocok.</p>
            </article>
          </div>
        </section>

        <section className="landing-destinations" id="destinations">
          <div className="section-heading">
            <div>
              <p>Top Destination</p>
              <h2>Destinasi populer untuk mulai menjelajah</h2>
            </div>
            <Link className="ghost-chip" href="/register">
              Buka semua setelah login
            </Link>
          </div>

          <div className="landing-destination-grid">
            {destinationCards.map((item) => (
              <article className="landing-destination-card" key={item.id}>
                <img src={item.coverImageUrl} alt={item.destination} />
                <div className="landing-destination-body">
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.destination}</p>
                  </div>
                  <span>{formatRupiah(item.estimatedBudget)}</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
