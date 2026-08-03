// Admin/owner-only: cuts off a user's account by banning it in Supabase Auth. There's no
// direct "sign out this user id" admin API (auth.admin.signOut only accepts the session's
// own access token, which we never hold server-side) — the supported mechanism for forcibly
// ending someone's access is a ban, which blocks sign-in and token refresh. Since the
// project's JWT expiry is 1 hour, this cuts off an already-active session within that window.
import { createClient } from "npm:@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS_HEADERS });

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const jwt = authHeader.replace(/^Bearer /i, "");
    if (!jwt) return new Response(JSON.stringify({ ok: false, error: "unauthorized" }), { status: 401, headers: CORS_HEADERS });

    const { data: callerData, error: callerError } = await supabaseAdmin.auth.getUser(jwt);
    if (callerError || !callerData?.user) {
      return new Response(JSON.stringify({ ok: false, error: "unauthorized" }), { status: 401, headers: CORS_HEADERS });
    }

    const { data: callerRow } = await supabaseAdmin.from("users").select("role").eq("auth_id", callerData.user.id).maybeSingle();
    if (!callerRow || !["admin", "owner"].includes(callerRow.role)) {
      return new Response(JSON.stringify({ ok: false, error: "forbidden" }), { status: 403, headers: CORS_HEADERS });
    }

    const { authId, action } = await req.json();
    if (!authId) return new Response(JSON.stringify({ ok: false, error: "authId required" }), { status: 400, headers: CORS_HEADERS });

    const banDuration = action === "restore" ? "none" : "876000h"; // ~100 years, effectively indefinite
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(authId, { ban_duration: banDuration });
    if (updateError) return new Response(JSON.stringify({ ok: false, error: updateError.message }), { status: 500, headers: CORS_HEADERS });

    return new Response(JSON.stringify({ ok: true, banned: action !== "restore" }), { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("admin-revoke-session error", err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 500, headers: CORS_HEADERS });
  }
});
