import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const keyLength = 64;

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scrypt(password, salt, keyLength)) as Buffer;

  return `${salt}:${derivedKey.toString("hex")}`;
}

export async function verifyPassword(password: string, passwordHash: string) {
  const [salt, key] = passwordHash.split(":");

  if (!salt || !key) {
    return false;
  }

  const expected = Buffer.from(key, "hex");
  const actual = (await scrypt(password, salt, keyLength)) as Buffer;

  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
