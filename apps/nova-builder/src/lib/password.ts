// Password hashing on WebCrypto PBKDF2-SHA256 (native) instead of bcryptjs.
// bcryptjs at cost 12 runs in JS and burned ~440 ms CPU per signup/login — far
// beyond the 10 ms/request Workers Free budget (Error 1102). PBKDF2 runs in the
// runtime's native crypto.
//
// Stored format: "pbkdf2_sha256$<iterations>$<saltB64>$<hashB64>".
// Legacy bcrypt hashes ("$2a$/$2b$...") still verify and are flagged for rehash.

const PREFIX = "pbkdf2_sha256";
const ITERATIONS = 100_000;
const KEY_BITS = 256;

const toB64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const fromB64 = (b64: string) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

async function derive(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations }, key, KEY_BITS);
  return new Uint8Array(bits);
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i]! ^ b[i]!;
  return diff === 0;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derive(password, salt, ITERATIONS);
  return `${PREFIX}$${ITERATIONS}$${toB64(salt)}$${toB64(hash)}`;
}

/** `needsRehash` is true for legacy bcrypt hashes so callers can upgrade them on login. */
export async function verifyPassword(password: string, stored: string): Promise<{ valid: boolean; needsRehash: boolean }> {
  if (stored.startsWith(`${PREFIX}$`)) {
    const [, iter, saltB64, hashB64] = stored.split("$");
    const expected = fromB64(hashB64 ?? "");
    const actual = await derive(password, fromB64(saltB64 ?? ""), Number(iter));
    return { valid: constantTimeEqual(actual, expected), needsRehash: false };
  }
  if (/^\$2[aby]\$/.test(stored)) {
    const { default: bcrypt } = await import("bcryptjs");
    return { valid: await bcrypt.compare(password, stored), needsRehash: true };
  }
  return { valid: false, needsRehash: false };
}
