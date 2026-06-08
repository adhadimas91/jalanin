import { prisma } from "./prisma";

/**
 * Parses a URL and extracts its hostname.
 */
export function getHostname(urlStr: string): string | null {
  try {
    // Normalisasi URL jika tidak memiliki protokol agar URL class bisa memprosesnya
    let urlToParse = urlStr.trim();
    if (!/^https?:\/\//i.test(urlToParse)) {
      urlToParse = "https://" + urlToParse;
    }
    const url = new URL(urlToParse);
    return url.hostname.toLowerCase();
  } catch (e) {
    return null;
  }
}

/**
 * Matches a domain name against a pattern (e.g. *.agoda.com, wa.me).
 */
export function matchDomain(hostname: string, pattern: string): boolean {
  const host = hostname.toLowerCase();
  const pat = pattern.trim().toLowerCase();

  if (pat.startsWith("*.")) {
    const baseDomain = pat.substring(2);
    // Cocok jika hostname adalah baseDomain itu sendiri (e.g., klook.com)
    if (host === baseDomain) {
      return true;
    }
    // Atau cocok jika hostname berakhiran dengan .baseDomain (e.g., www.klook.com)
    return host.endsWith("." + baseDomain);
  }

  return host === pat;
}

/**
 * Validates whether a URL's domain is in the whitelist of active affiliate domains in the database.
 */
export async function validateAffiliateUrl(urlStr: string): Promise<{
  isValid: boolean;
  matchedPattern?: string;
  error?: string;
}> {
  if (!urlStr || urlStr.trim() === "") {
    return { isValid: false, error: "Tautan tidak boleh kosong." };
  }

  // Sanitasi dari bahaya Javascript XSS
  if (/^javascript:/i.test(urlStr.trim())) {
    return { isValid: false, error: "Protokol keamanan tidak valid." };
  }

  const hostname = getHostname(urlStr);
  if (!hostname) {
    return { isValid: false, error: "Format tautan tidak valid." };
  }

  try {
    // Ambil semua domain whitelist yang aktif dari database
    const activeWhitelist = await prisma.affiliateWhitelistDomain.findMany({
      where: {
        isActive: true,
      },
      select: {
        domainPattern: true,
      },
    });

    // Cari kecocokan domain
    const matched = activeWhitelist.find((item) =>
      matchDomain(hostname, item.domainPattern)
    );

    if (matched) {
      return { isValid: true, matchedPattern: matched.domainPattern };
    }

    return {
      isValid: false,
      error: `Domain "${hostname}" tidak diizinkan. Hubungi admin untuk mendaftarkan domain baru.`,
    };
  } catch (error) {
    console.error("Gagal melakukan validasi domain affiliate:", error);
    // Fallback: Jika DB error, batasi demi keamanan
    return { isValid: false, error: "Gagal memproses validasi tautan." };
  }
}

/**
 * Helper to identify the affiliate provider name based on URL hostname.
 */
export function detectProvider(urlStr: string): string {
  const hostname = getHostname(urlStr);
  if (!hostname) return "Custom";

  if (hostname.includes("klook.com")) return "Klook";
  if (hostname.includes("agoda.com")) return "Agoda";
  if (hostname.includes("traveloka.com")) return "Traveloka";
  if (hostname.includes("tiket.com")) return "Tiket.com";
  if (hostname.includes("booking.com")) return "Booking.com";
  if (hostname === "wa.me" || hostname.includes("whatsapp.com")) return "WhatsApp";

  return "Custom";
}
