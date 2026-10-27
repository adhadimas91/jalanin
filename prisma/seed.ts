import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Seed MyLink Whitelist Domains
  const whitelistDomains = [
    { domainPattern: "*.klook.com", description: "Klook Partner Link" },
    { domainPattern: "*.agoda.com", description: "Agoda Partner Link" },
    { domainPattern: "*.traveloka.com", description: "Traveloka Partner Link" },
    { domainPattern: "*.tiket.com", description: "Tiket.com Partner Link" },
    { domainPattern: "*.booking.com", description: "Booking.com Partner Link" },
    { domainPattern: "wa.me", description: "WhatsApp Short Link for local guides/rentals" },
    { domainPattern: "*.whatsapp.com", description: "WhatsApp Web links" },
  ];

  for (const domain of whitelistDomains) {
    await prisma.myLinkWhitelistDomain.upsert({
      where: { domainPattern: domain.domainPattern },
      update: { description: domain.description },
      create: {
        domainPattern: domain.domainPattern,
        description: domain.description,
        isActive: true,
      },
    });
  }
  console.log(`Seeded ${whitelistDomains.length} MyLink whitelist domains.`);

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
    { key: "promo_1y", value: "31% Hemat" },
    { key: "email_whitelist", value: "gmail.com,outlook.com,yahoo.com,icloud.com" },
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
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
