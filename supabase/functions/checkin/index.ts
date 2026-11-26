// =====================================================================
// FitTap check-in Edge Function (schema 2026-11)
// Called by the scanner box. It never decides anything itself: it hashes the
// scanner token and asks the database, which does each request in one
// transaction (public.scanner_tap / public.scanner_heartbeat).
//
// Requests (POST, header x-scanner-token: <plain token>):
//   card tap:   {"uid": "04A1B2C3D4E5F6"}            ("type": "tap" is optional,
//                                                     so the current firmware works)
//   heartbeat:  {"type": "heartbeat", "firmware": "1.4.0"}   every 2 minutes
//
// Replies:
//   tap, link mode: {"mode":"link","linked":true|false,
//                    "reason":"ok|already_linked|other_gym|blocked","name":"Juan"}
//   tap, check-in:  {"mode":"checkin","allowed":true|false,
//                    "reason":"ok|expired|frozen|unknown|disabled","name":"Juan","days_left":23}
//   heartbeat:      {"ok":true,"pending_link":true|false,"name":"Juan"}
//   errors:         401 unauthorized (wrong or revoked token), 400 bad request,
//                   405 not POST, 500 server problem
//
// Deploy: supabase functions deploy checkin --no-verify-jwt
// (no Supabase login check: the scanner token is the check.)
// =====================================================================

import { createClient } from "npm:@supabase/supabase-js@2.49.4";
import { sha256Hex } from "./hash.ts";

// The service role key is provided to the function by Supabase. It never
// leaves the server and is never sent to the scanner.
const db = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

function reply(body: unknown, status = 200): Response {
  return Response.json(body, { status });
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return reply({ error: "method_not_allowed" }, 405);

  const token = req.headers.get("x-scanner-token")?.trim() ?? "";
  if (!token) return reply({ error: "unauthorized" }, 401);

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return reply({ error: "bad_request" }, 400);

  const tokenHash = await sha256Hex(token);
  const type = body.type ?? (body.uid !== undefined ? "tap" : "");

  let result;
  if (type === "heartbeat") {
    result = await db.rpc("scanner_heartbeat", {
      p_token_hash: tokenHash,
      p_firmware: String(body.firmware ?? req.headers.get("x-firmware-version") ?? ""),
    });
  } else if (type === "tap" && typeof body.uid === "string" && body.uid !== "") {
    result = await db.rpc("scanner_tap", { p_token_hash: tokenHash, p_uid: body.uid });
  } else {
    return reply({ error: "bad_request" }, 400);
  }

  if (result.error) {
    // Details go to the function log, never to the scanner.
    console.error("checkin rpc failed:", result.error.message);
    return reply({ error: "server_error" }, 500);
  }

  const data = result.data as Record<string, unknown>;
  if (data.error === "unauthorized") return reply(data, 401);
  if (data.error) return reply(data, 400);
  return reply(data);
});
