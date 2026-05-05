import { pbkdf2, randomBytes, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const pbkdf2Async = promisify(pbkdf2);
const passwordHashVersion = "pbkdf2-sha256";
const passwordIterations = 210_000;
const passwordKeyLength = 32;
const passwordDigest = "sha256";

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("base64url");
  const hash = await pbkdf2Async(password, salt, passwordIterations, passwordKeyLength, passwordDigest);

  return [
    passwordHashVersion,
    String(passwordIterations),
    salt,
    hash.toString("base64url"),
  ].join("$");
}

export async function verifyPassword(password: string, storedHash: string) {
  const [version, iterationsText, salt, hashText] = storedHash.split("$");
  if (version !== passwordHashVersion || !iterationsText || !salt || !hashText) return false;

  const iterations = Number(iterationsText);
  if (!Number.isInteger(iterations) || iterations < 100_000) return false;

  const expected = Buffer.from(hashText, "base64url");
  const actual = await pbkdf2Async(password, salt, iterations, expected.length, passwordDigest);
  if (actual.length !== expected.length) return false;

  return timingSafeEqual(actual, expected);
}

export function verifyPlainPassword(password: string, expectedPassword: string) {
  const actual = Buffer.from(password);
  const expected = Buffer.from(expectedPassword);
  if (actual.length !== expected.length) return false;

  return timingSafeEqual(actual, expected);
}
