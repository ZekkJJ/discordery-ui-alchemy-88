
// Discord user guilds function
exports.handler = async (event) => {
  try {
    // Only accept POST requests
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: "Method not allowed" }),
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      };
    }

    // Parse the request body
    const body = JSON.parse(event.body);
    const { access_token } = body;

    if (!access_token) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing access_token parameter" }),
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      };
    }

    // Discord API configuration
    const DISCORD_GUILDS_URL = "https://discord.com/api/users/@me/guilds";

    // Fetch guilds from Discord API
    const response = await fetch(DISCORD_GUILDS_URL, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Discord guilds fetch error:", errorText);
      return {
        statusCode: response.status,
        body: JSON.stringify({ 
          error: "Failed to fetch guilds",
          details: errorText
        }),
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      };
    }

    // Get guilds data from Discord
    const guildsData = await response.json();
    
    // Filter guilds where user is the owner
    const ownedGuilds = guildsData.filter(guild => guild.owner === true);
    
    // Connect to Supabase to check which guilds are already listed
    const SUPABASE_URL = process.env.SUPABASE_URL || "https://hyoaegvyvmzpbvhtzbpv.supabase.co";
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!SUPABASE_SERVICE_ROLE_KEY) {
      console.warn("SUPABASE_SERVICE_ROLE_KEY not found, skipping server status check");
      // Return the guilds without checking if they're already listed
      return {
        statusCode: 200,
        body: JSON.stringify(ownedGuilds.map(guild => ({
          ...guild,
          isAlreadyListed: false // Default to false if we can't check
        }))),
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      };
    }
    
    // Create a Supabase client using Node.js fetch
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
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

    return {
      statusCode: 200,
      body: JSON.stringify(enrichedGuilds),
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    };
  } catch (error) {
    console.error("Error in discord-guilds function:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: "Failed to process guilds request",
        details: error.message
      }),
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    };
  }
};
