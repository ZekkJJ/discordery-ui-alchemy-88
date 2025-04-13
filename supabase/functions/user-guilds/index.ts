
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

// Discord API endpoints
const DISCORD_GUILDS_URL = "https://discord.com/api/users/@me/guilds";
const DISCORD_TOKEN_URL = "https://discord.com/api/oauth2/token";

// Environment variables
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://eahmzxgmnyacbwahdanv.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const DISCORD_CLIENT_ID = Deno.env.get("DISCORD_CLIENT_ID") || "1360393180482375691";
const DISCORD_CLIENT_SECRET = Deno.env.get("DISCORD_CLIENT_SECRET");

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
    // Get auth token from request headers
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: "Missing or invalid authorization" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    if (!SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Missing SUPABASE_SERVICE_ROLE_KEY");
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Verify the user's session
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(JSON.stringify({ error: "Authentication failed" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // Get Discord user data from our database
    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (userDataError) {
      console.error('User data error:', userDataError);
      return new Response(JSON.stringify({ error: "Database error" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    if (!userData) {
      // Try to find the user by discord_id from user metadata
      if (user.user_metadata?.discord_id) {
        const { data: discordUser, error: discordUserError } = await supabase
          .from('users')
          .select('*')
          .eq('discord_id', user.user_metadata.discord_id)
          .maybeSingle();
        
        if (discordUserError) {
          console.error('Discord user lookup error:', discordUserError);
        } else if (discordUser) {
          userData = discordUser;
        }
      }
      
      if (!userData) {
        console.error('User not found in database');
        return new Response(JSON.stringify({ error: "User not found or database error" }), {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
    }

    // Check if token needs refreshing
    const now = new Date();
    const tokenExpiresAt = userData.token_expires_at ? new Date(userData.token_expires_at) : null;
    let accessToken = userData.access_token;

    if (!tokenExpiresAt || tokenExpiresAt <= new Date(now.getTime() + 5 * 60000)) {
      // Token is expired or expires in the next 5 minutes, refresh it
      if (!userData.refresh_token) {
        return new Response(JSON.stringify({ error: "Missing refresh token" }), {
          status: 403,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }

      try {
        if (!DISCORD_CLIENT_SECRET) {
          console.error("Missing DISCORD_CLIENT_SECRET");
          return new Response(JSON.stringify({ error: "Server configuration error (missing Discord secret)" }), {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        }

        const refreshResponse = await fetch(DISCORD_TOKEN_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            client_id: DISCORD_CLIENT_ID,
            client_secret: DISCORD_CLIENT_SECRET,
            grant_type: 'refresh_token',
            refresh_token: userData.refresh_token,
          }),
        });

        if (!refreshResponse.ok) {
          const refreshErrorText = await refreshResponse.text();
          console.error('Token refresh failed:', refreshErrorText);
          return new Response(JSON.stringify({ 
            error: "Failed to refresh Discord token",
            details: refreshErrorText
          }), {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        }

        const refreshData = await refreshResponse.json();
        accessToken = refreshData.access_token;
        
        // Update tokens in database
        const tokenExpiresAt = new Date(now.getTime() + refreshData.expires_in * 1000).toISOString();
        await supabase
          .from('users')
          .update({
            access_token: refreshData.access_token,
            refresh_token: refreshData.refresh_token,
            token_expires_at: tokenExpiresAt,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);
      } catch (refreshError) {
        console.error('Token refresh error:', refreshError);
        return new Response(JSON.stringify({ error: "Error refreshing Discord token" }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
    }

    // Fetch user's guilds from Discord API
    const guildsResponse = await fetch(DISCORD_GUILDS_URL, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!guildsResponse.ok) {
      const guildsErrorText = await guildsResponse.text();
      console.error('Failed to fetch guilds:', guildsErrorText);
      return new Response(JSON.stringify({ 
        error: "Failed to fetch guilds from Discord",
        details: guildsErrorText,
        status: guildsResponse.status
      }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    const guildsData = await guildsResponse.json();
    console.log(`Fetched ${guildsData.length} guilds from Discord`);
    
    // Filter guilds where user is the owner
    const ownedGuilds = guildsData.filter(guild => guild.owner === true);
    console.log(`User owns ${ownedGuilds.length} guilds`);

    // Check which guilds are already listed in our database
    const { data: existingServers, error: serversError } = await supabase
      .from('servers')
      .select('discord_server_id')
      .in('discord_server_id', ownedGuilds.map(guild => guild.id));

    if (serversError) {
      console.error('Error fetching existing servers:', serversError);
    }

    // Create a set of already listed server IDs for quick lookup
    const listedServerIds = new Set(existingServers?.map(server => server.discord_server_id) || []);

    // Attach isAlreadyListed flag to each guild
    const enrichedGuilds = ownedGuilds.map(guild => ({
      ...guild,
      isAlreadyListed: listedServerIds.has(guild.id)
    }));

    return new Response(JSON.stringify(enrichedGuilds), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  } catch (error) {
    console.error("Error in user-guilds function:", error);
    return new Response(JSON.stringify({ 
      error: "Failed to process request",
      details: error.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
});
