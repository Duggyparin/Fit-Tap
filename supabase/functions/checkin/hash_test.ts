// Run with: deno test supabase/functions/checkin/hash_test.ts
//
// The same two inputs are checked on the database side in
// docs/testing-schema.md, so both sides agree on the hash format.
import { assertEquals } from "jsr:@std/assert@1.0.13";
import { sha256Hex } from "./hash.ts";

Deno.test("SHA-256 test vector, lowercase hex", async () => {
  assertEquals(
    await sha256Hex("abc"),
    "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
  );
});

Deno.test("a 48-character token like admin_register_scanner makes", async () => {
  const token = "0123456789abcdef0123456789abcdef0123456789abcdef";
  const hash = await sha256Hex(token);
  assertEquals(hash.length, 64);
  assertEquals(hash, hash.toLowerCase());
  assertEquals(
    hash,
    "34c26e154bab5ff544f29f8747a691d0fedd3b8a51655f27d0f585b1b2753970",
  );
});
