// SHA-256 of a text, as lowercase hex. The database stores scanner tokens the
// same way (public.new_scanner_token: encode(digest(token, 'sha256'), 'hex')),
// so a token created by admin_register_scanner is accepted here.
export async function sha256Hex(text: string): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
