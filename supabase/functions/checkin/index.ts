// =====================================================================
// Gym NFC Membership System: check-in Edge Function (v1.3)
// Called by the scanner box for every card tap.
//  - checks the scanner's token
//  - if a link request is waiting for this scanner: links the card
//  - otherwise: checks the membership and logs a check-in
// Deploy: supabase functions deploy checkin --no-verify-jwt
// =====================================================================

import { createClient } from "npm:@supabase/supabase-js@2";

const db = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

async function sha256(text: string): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function manilaToday(): string {
  // Dates are compared in Philippine time, not UTC.
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const token = req.headers.get("x-scanner-token") ?? "";
  const body = await req.json().catch(() => ({}));
  const uid = String(body.uid ?? "").toUpperCase();
  if (!token || !uid) return Response.json({ error: "bad request" }, { status: 400 });

  const { data: scanner } = await db.from("scanner")
    .select("scanner_id, gym_id, status")
    .eq("token_hash", await sha256(token)).maybeSingle();
  if (!scanner || scanner.status !== "active") {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  await db.from("scanner").update({ last_seen_at: new Date().toISOString() })
    .eq("scanner_id", scanner.scanner_id);

  // Link mode: if the website asked to link a card on this scanner, link it.
  const { data: link } = await db.from("link_request")
    .select("request_id, member_id, member(full_name)")
    .eq("scanner_id", scanner.scanner_id).eq("status", "pending")
    .gt("expires_at", new Date().toISOString())
    .order("expires_at", { ascending: false }).limit(1).maybeSingle();
  if (link) {
    // @ts-ignore: joined row
    const who = String(link.member?.full_name ?? "");
    const { data: existing } = await db.from("nfc_card")
      .select("card_id, gym_id, member_id").eq("card_uid", uid).maybeSingle();
    if (existing && existing.gym_id !== scanner.gym_id) {
      return Response.json({ mode: "link", linked: false, reason: "other_gym", name: who });
    }
    // A member's card tapped by accident must not be moved to someone else.
    if (existing?.member_id && existing.member_id !== link.member_id) {
      return Response.json({ mode: "link", linked: false, reason: "already_linked", name: who });
    }
    if (existing) {
      await db.from("nfc_card").update({ member_id: link.member_id, status: "active" })
        .eq("card_id", existing.card_id);
    } else {
      await db.from("nfc_card").insert({ gym_id: scanner.gym_id,
        member_id: link.member_id, card_uid: uid, status: "active" });
    }
    await db.from("link_request").update({ status: "done", card_uid: uid })
      .eq("request_id", link.request_id);
    return Response.json({ mode: "link", linked: true, name: who.split(" ")[0] });
  }

  const { data: card } = await db.from("nfc_card")
    .select("status, member_id, member(full_name)")
    .eq("gym_id", scanner.gym_id).eq("card_uid", uid).maybeSingle();

  let allowed = false, reason = "unknown", name = "", daysLeft = 0;
  let memberId: string | null = null;

  if (card && card.status !== "active") {
    reason = "disabled";
  } else if (card && card.member_id) {
    memberId = card.member_id;
    // @ts-ignore: joined row
    name = String(card.member?.full_name ?? "").split(" ")[0];
    const today = manilaToday();
    const { data: ms } = await db.from("membership").select("end_date")
      .eq("member_id", memberId).eq("status", "active").gte("end_date", today)
      .order("end_date", { ascending: false }).limit(1).maybeSingle();
    if (ms) {
      allowed = true;
      reason = "ok";
      daysLeft = Math.round((Date.parse(ms.end_date) - Date.parse(today)) / 86400000);
    } else {
      reason = "expired";
    }
  }

  await db.from("checkin").insert({
    gym_id: scanner.gym_id, member_id: memberId, scanner_id: scanner.scanner_id,
    card_uid: uid, result: allowed ? "allowed" : reason, source: "online",
  });
  return Response.json({ mode: "checkin", allowed, reason, name, days_left: daysLeft });
});
