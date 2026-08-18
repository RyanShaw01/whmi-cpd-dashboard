// Public (no auth, deliberately no signed-in check): looks up exactly one event by id, for
// anonymous visitors following a registration/reflection link whose event the anon-read RLS
// policy on public.events doesn't (or doesn't yet) cover - most commonly because the event has
// since completed. Uses the service role to bypass RLS entirely, on purpose: holding a specific
// event's id (from a link someone was actually sent) is already effectively how these flows
// share access, the same way a registration or reflection link itself isn't secret-but-guessable.
// Deliberately id-only, not listable - this can never be used to browse all events, only to
// resolve one already-known id, which is the only thing ReflectionPage/PublicEventPage need it
// for when the event isn't already in whatever was fetched at app load.
import { createClient } from "npm:@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS_HEADERS });

  try {
    const { eventId } = await req.json();
    if (!eventId) return new Response(JSON.stringify({ ok: false, error: "eventId is required" }), { status: 400, headers: CORS_HEADERS });

    const { data, error } = await supabase.from("events").select("*").eq("id", eventId).maybeSingle();
    if (error) throw error;

    return new Response(JSON.stringify({ ok: true, event: data || null }), { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("get-public-event error", err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 500, headers: CORS_HEADERS });
  }
});
