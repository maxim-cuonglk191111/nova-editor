import { describe, it, expect } from "vitest";
import bcrypt from "bcryptjs";
import { hashPassword, verifyPassword } from "../password";

describe("password hashing", () => {
  it("round-trips a PBKDF2 hash and rejects a wrong password", async () => {
    const stored = await hashPassword("Correct horse 1");
    expect(stored).toMatch(/^pbkdf2_sha256\$100000\$/);
    expect(await verifyPassword("Correct horse 1", stored)).toEqual({ valid: true, needsRehash: false });
    expect((await verifyPassword("wrong", stored)).valid).toBe(false);
  });

  it("salts each hash", async () => {
    expect(await hashPassword("same")).not.toBe(await hashPassword("same"));
  });

  it("still verifies legacy bcrypt hashes and flags them for rehash", async () => {
    const legacy = await bcrypt.hash("old-password", 4);
    expect(await verifyPassword("old-password", legacy)).toEqual({ valid: true, needsRehash: true });
    expect((await verifyPassword("nope", legacy)).valid).toBe(false);
  });

  it("rejects unknown formats", async () => {
    expect(await verifyPassword("x", "plaintext")).toEqual({ valid: false, needsRehash: false });
  });
});
