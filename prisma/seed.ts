import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";
import { hashPassword } from "../lib/password";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

type SeedActivity = {
  time: string;
  title: string;
  locationName: string;
  estimatedCost: number;
  category: string;
};

type SeedItinerary = {
  title: string;
  destination: string;
  description: string;
  durationDays: number;
  estimatedBudget: number;
  travelStyle: string;
  coverImageUrl: string;
  notes: string;
  days: Array<{
    title: string;
    activities: SeedActivity[];
  }>;
};

const itineraries: SeedItinerary[] = [
  {
    title: "7 Hari Kansai Budget",
    destination: "Osaka, Kyoto, Nara",
    description:
      "Rute Kansai yang nyaman untuk first-timer: transit mudah, makan enak, dan masih punya ruang buat jalan santai.",
    durationDays: 7,
    estimatedBudget: 8550000,
    travelStyle: "Budget trip",
    coverImageUrl: "https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=1400&q=80",
    notes:
      "Ambil ICOCA sejak tiba di KIX, simpan cash kecil, dan pilih penginapan dekat Namba atau Umeda.",
    days: [
      {
        title: "Hari 1 - Osaka",
        activities: [
          { time: "09.00", title: "Tiba di KIX, beli ICOCA & Haruka", locationName: "Kansai International Airport", estimatedCost: 350000, category: "Transport" },
          { time: "12.00", title: "Makan Ichiran Dotonbori", locationName: "Dotonbori", estimatedCost: 120000, category: "Kuliner" },
          { time: "14.00", title: "Sightseeing Dotonbori & Shinsaibashi", locationName: "Shinsaibashi", estimatedCost: 0, category: "City walk" },
          { time: "18.30", title: "Check-in hotel Shin-Osaka", locationName: "Shin-Osaka", estimatedCost: 640000, category: "Stay" },
        ],
      },
      {
        title: "Hari 2 - Kyoto",
        activities: [
          { time: "08.00", title: "Kereta ke Kyoto Station", locationName: "Kyoto Station", estimatedCost: 90000, category: "Transport" },
          { time: "10.00", title: "Fushimi Inari sampai viewpoint", locationName: "Fushimi Inari", estimatedCost: 0, category: "Culture" },
          { time: "13.00", title: "Lunch dekat Nishiki Market", locationName: "Nishiki Market", estimatedCost: 160000, category: "Kuliner" },
          { time: "16.30", title: "Kiyomizudera golden hour", locationName: "Kiyomizudera", estimatedCost: 65000, category: "Culture" },
        ],
      },
    ],
  },
  {
    title: "Bali 4D3N Sawah & Pantai",
    destination: "Ubud, Canggu, Uluwatu",
    description:
      "Paduan Ubud yang hijau, cafe hopping di Canggu, dan sunset Uluwatu dengan budget terkontrol.",
    durationDays: 4,
    estimatedBudget: 3200000,
    travelStyle: "Nature",
    coverImageUrl: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1400&q=80",
    notes:
      "Sewa motor hanya kalau nyaman berkendara. Untuk Uluwatu, berangkat lebih awal karena traffic sore padat.",
    days: [
      {
        title: "Hari 1 - Ubud",
        activities: [
          { time: "10.00", title: "Tiba di Bali dan drop barang", locationName: "Ngurah Rai", estimatedCost: 180000, category: "Transport" },
          { time: "13.00", title: "Lunch nasi campur Ubud", locationName: "Ubud", estimatedCost: 70000, category: "Kuliner" },
          { time: "15.00", title: "Tegallalang rice terrace", locationName: "Tegallalang", estimatedCost: 50000, category: "Nature" },
          { time: "19.00", title: "Dinner di pusat Ubud", locationName: "Ubud Center", estimatedCost: 120000, category: "Kuliner" },
        ],
      },
    ],
  },
  {
    title: "Jogja 3D2N Kuliner Klasik",
    destination: "Yogyakarta",
    description:
      "Weekend santai di Jogja dengan fokus makan, jalan kaki ringan, dan beberapa spot budaya yang tidak terlalu padat.",
    durationDays: 3,
    estimatedBudget: 1650000,
    travelStyle: "Kuliner",
    coverImageUrl: "https://images.unsplash.com/photo-1596402184320-417e7178b2cd?auto=format&fit=crop&w=1400&q=80",
    notes: "Gudeg populer cepat habis. Simpan beberapa alternatif warung agar jadwal tetap lentur.",
    days: [
      {
        title: "Hari 1 - Pusat Kota",
        activities: [
          { time: "09.00", title: "Tiba di Stasiun Tugu", locationName: "Stasiun Tugu", estimatedCost: 0, category: "Transport" },
          { time: "10.30", title: "Brunch gudeg legendaris", locationName: "Wijilan", estimatedCost: 55000, category: "Kuliner" },
          { time: "14.00", title: "Taman Sari dan Keraton", locationName: "Keraton Yogyakarta", estimatedCost: 45000, category: "Culture" },
          { time: "19.00", title: "Angkringan Kopi Joss", locationName: "Malioboro", estimatedCost: 45000, category: "Kuliner" },
        ],
      },
    ],
  },
];

async function ensureItinerary(authorId: string, data: SeedItinerary) {
  const existing = await prisma.itinerary.findFirst({
    where: {
      title: data.title,
      authorId,
    },
    include: {
      days: {
        include: {
          activities: true,
        },
      },
    },
  });

  const itinerary =
    existing ??
    (await prisma.itinerary.create({
      data: {
        title: data.title,
        destination: data.destination,
        authorId,
      },
      include: {
        days: {
          include: {
            activities: true,
          },
        },
      },
    }));

  await prisma.itinerary.update({
    where: {
      id: itinerary.id,
    },
    data: {
      destination: data.destination,
      description: data.description,
      durationDays: data.durationDays,
      estimatedBudget: data.estimatedBudget,
      travelStyle: data.travelStyle,
      coverImageUrl: data.coverImageUrl,
      notes: data.notes,
      isPublished: true,
    },
  });

  for (const [dayIndex, day] of data.days.entries()) {
    const dayRecord = await prisma.itineraryDay.upsert({
      where: {
        itineraryId_dayNumber: {
          itineraryId: itinerary.id,
          dayNumber: dayIndex + 1,
        },
      },
      update: {
        title: day.title,
      },
      create: {
        itineraryId: itinerary.id,
        dayNumber: dayIndex + 1,
        title: day.title,
      },
      include: {
        activities: true,
      },
    });

    if (dayRecord.activities.length === 0) {
      await prisma.activity.createMany({
        data: day.activities.map((activity, activityIndex) => ({
          itineraryDayId: dayRecord.id,
          time: activity.time,
          title: activity.title,
          locationName: activity.locationName,
          estimatedCost: activity.estimatedCost,
          category: activity.category,
          orderIndex: activityIndex,
        })),
      });
    }
  }
}

async function main() {
  const passwordHash = await hashPassword("jalanin123");

  const risa = await prisma.user.upsert({
    where: {
      email: "risa@jalanin.local",
    },
    update: {
      username: "risa.route",
      passwordHash,
      name: "Risa Tanaka",
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80",
      bio: "Slow traveler, pemburu ramen, dan spreadsheet budget.",
      city: "Jakarta",
      role: "ADMIN",
    },
    create: {
      email: "risa@jalanin.local",
      username: "risa.route",
      passwordHash,
      name: "Risa Tanaka",
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80",
      bio: "Slow traveler, pemburu ramen, dan spreadsheet budget.",
      city: "Jakarta",
      role: "ADMIN",
    },
  });

  const made = await prisma.user.upsert({
    where: {
      email: "made@jalanin.local",
    },
    update: {
      username: "madejalan",
      passwordHash,
      name: "Made Aruna",
      avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80",
      bio: "Local host yang suka rute sunrise dan warung rumahan.",
      city: "Denpasar",
    },
    create: {
      email: "made@jalanin.local",
      username: "madejalan",
      passwordHash,
      name: "Made Aruna",
      avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80",
      bio: "Local host yang suka rute sunrise dan warung rumahan.",
      city: "Denpasar",
    },
  });

  await ensureItinerary(risa.id, itineraries[0]);
  await ensureItinerary(made.id, itineraries[1]);
  await ensureItinerary(risa.id, itineraries[2]);

  // Seed Affiliate Whitelist Domains
  const whitelistDomains = [
    { domainPattern: "*.klook.com", description: "Klook Affiliate" },
    { domainPattern: "*.agoda.com", description: "Agoda Affiliate" },
    { domainPattern: "*.traveloka.com", description: "Traveloka Partner/Affiliate" },
    { domainPattern: "*.tiket.com", description: "Tiket.com Affiliate" },
    { domainPattern: "*.booking.com", description: "Booking.com Affiliate" },
    { domainPattern: "wa.me", description: "WhatsApp Short Link for local guides/rentals" },
    { domainPattern: "*.whatsapp.com", description: "WhatsApp Web links" },
  ];

  for (const domain of whitelistDomains) {
    await prisma.affiliateWhitelistDomain.upsert({
      where: { domainPattern: domain.domainPattern },
      update: { description: domain.description },
      create: {
        domainPattern: domain.domainPattern,
        description: domain.description,
        isActive: true,
      },
    });
  }
  console.log(`Seeded ${whitelistDomains.length} affiliate whitelist domains.`);

  // Seed App Settings
  const defaultSettings = [
    { key: "whatsapp_number", value: "088293681133" },
    { key: "price_1m", value: "Rp 29.900" },
    { key: "rate_1m", value: "/bulan" },
    { key: "promo_1m", value: "hemat" },
    { key: "price_3m", value: "Rp 79.900" },
    { key: "rate_3m", value: "Rp 26.633/bln" },
    { key: "promo_3m", value: "11% Hemat" },
    { key: "price_6m", value: "Rp 149.000" },
    { key: "rate_6m", value: "Rp 24.833/bln" },
    { key: "promo_6m", value: "17% Hemat" },
    { key: "price_1y", value: "Rp 249.000" },
    { key: "rate_1y", value: "Rp 20.750/bln" },
    { key: "promo_1y", value: "31% Hemat" }
  ];

  for (const setting of defaultSettings) {
    await prisma.appSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: {
        key: setting.key,
        value: setting.value,
      },
    });
  }
  console.log("Seeded app settings.");

  console.log(`Seeded ${itineraries.length} Jalanin itineraries.`);
  console.log("Demo login: risa@jalanin.local / jalanin123");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
