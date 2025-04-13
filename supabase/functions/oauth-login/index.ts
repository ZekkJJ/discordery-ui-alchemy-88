
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Discord OAuth URLs
const DISCORD_AUTH_URL = "https://discord.com/oauth2/authorize";
const DISCORD_CLIENT_ID = Deno.env.get("DISCORD_CLIENT_ID") || "1360393180482375691";
const REDIRECT_URI = Deno.env.get("DISCORD_REDIRECT_URI") || "https://sprightly-sawine-1d6202.netlify.app/discord-auth";

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Generate a random state parameter for CSRF protection
    const state = crypto.randomUUID();
    
    // Construct the authorization URL
    const authUrl = new URL(DISCORD_AUTH_URL);
    authUrl.searchParams.append("client_id", DISCORD_CLIENT_ID);
    authUrl.searchParams.append("response_type", "code");
    authUrl.searchParams.append("redirect_uri", REDIRECT_URI);
    authUrl.searchParams.append("scope", "identify guilds guilds.members.read guilds.join");
    authUrl.searchParams.append("state", state);

    // Store the state in a cookie that will be checked in the callback
    const headers = new Headers({ 
      "Location": authUrl.toString(),
      "Set-Cookie": `discord_oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
      ...corsHeaders
    });

    return new Response(null, {
      status: 302,
      headers,
    });
  } catch (error) {
    console.error("OAuth login error:", error);
    return new Response(JSON.stringify({ error: "Failed to initiate Discord login" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
});
