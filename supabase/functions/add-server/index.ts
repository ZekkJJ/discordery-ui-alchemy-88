
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

// Discord API endpoints
const DISCORD_GUILD_URL = "https://discord.com/api/users/@me/guilds";

// Environment variables
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://hyoaegvyvmzpbvhtzbpv.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
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

    // Parse the request body
    const requestData = await req.json();
    const { discordServerId, description, inviteLink, tags, category } = requestData;

    // Validate request data
    if (!discordServerId || !description || !inviteLink || !tags || !category) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // Validate tags array has at least 3 items
    if (!Array.isArray(tags) || tags.length < 3) {
      return new Response(JSON.stringify({ error: "At least 3 tags are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // Validate invite link format
    if (!inviteLink.startsWith('https://discord.gg/') && !inviteLink.startsWith('https://discord.com/invite/')) {
      return new Response(JSON.stringify({ error: "Invalid invite link format" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // Get the user's Discord details
    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (userDataError || !userData) {
      console.error('User data error:', userDataError);
      return new Response(JSON.stringify({ error: "User data not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // Fetch user's guilds from Discord API to verify ownership
    const guildsResponse = await fetch(DISCORD_GUILD_URL, {
      headers: {
        Authorization: `Bearer ${userData.access_token}`,
      },
    });

    if (!guildsResponse.ok) {
      console.error('Failed to fetch guilds:', await guildsResponse.text());
      return new Response(JSON.stringify({ error: "Failed to verify server ownership" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    const guildsData = await guildsResponse.json();
    
    // Verify user owns this server
    const ownedGuild = guildsData.find(guild => guild.id === discordServerId && guild.owner === true);
    
    if (!ownedGuild) {
      return new Response(JSON.stringify({ error: "You don't own this server" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // Check if server already exists in database
    const { data: existingServer, error: checkError } = await supabase
      .from('servers')
      .select('id')
      .eq('discord_server_id', discordServerId)
      .single();

    if (existingServer) {
      return new Response(JSON.stringify({ error: "This server is already listed in the directory" }), {
        status: 409,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // Insert server into database
    const { data: newServer, error: insertError } = await supabase
      .from('servers')
      .insert([{
        discord_server_id: discordServerId,
        name: ownedGuild.name,
        icon: ownedGuild.icon,
        short_description: description.substring(0, 100), // Short version for cards
        long_description: description,
        invite_link: inviteLink,
        tags: tags,
        category: category,
        owner_id: user.id,
        submitted_by_discord_id: userData.discord_id,
        is_approved: false // Require approval before listing
      }])
      .select();

    if (insertError) {
      console.error('Error adding server:', insertError);
      return new Response(JSON.stringify({ error: "Failed to add server to directory" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: "Server submitted successfully!",
      serverId: newServer[0].id
    }), {
      status: 201,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  } catch (error) {
    console.error("Error in add-server function:", error);
    return new Response(JSON.stringify({ error: "Failed to process request" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
});
