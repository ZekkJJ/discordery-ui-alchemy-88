
// Discord add server function
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
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      };
    }

    // Parse the request body
    const body = JSON.parse(event.body);
    const { 
      discordServerId,
      description, 
      inviteLink,
      tags,
      category
    } = body;

    // Get Discord token from Authorization header
    const authHeader = event.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: "Missing or invalid Discord authorization token" }),
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      };
    }

    const token = authHeader.replace('Bearer ', '');

    // Validate required fields
    if (!discordServerId || !description || !inviteLink || !tags || !category) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing required fields" }),
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      };
    }

    // Get Discord server details
    const DISCORD_API_URL = `https://discord.com/api/guilds/${discordServerId}`;

    // Fetch server info from Discord using the Discord token
    const guildResponse = await fetch(`${DISCORD_API_URL}?with_counts=true`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!guildResponse.ok) {
      const errorText = await guildResponse.text();
      return {
        statusCode: guildResponse.status,
        body: JSON.stringify({ 
          error: "Failed to fetch server details from Discord",
          details: errorText 
        }),
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      };
    }

    // Get Discord server data
    const serverData = await guildResponse.json();
    
    // Get user info from Discord
    const userResponse = await fetch("https://discord.com/api/users/@me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      return {
        statusCode: userResponse.status,
        body: JSON.stringify({ 
          error: "Failed to fetch user info from Discord",
          details: errorText
        }),
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      };
    }

    const userData = await userResponse.json();
    
    // Connect to Supabase
    const SUPABASE_URL = process.env.SUPABASE_URL || "https://hyoaegvyvmzpbvhtzbpv.supabase.co";
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!SUPABASE_SERVICE_ROLE_KEY) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Server configuration error" }),
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      };
    }
    
    // Create a Supabase client
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Get user info from Supabase
    const { data: userInfo, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('discord_id', userData.id)
      .single();
    
    if (userError) {
      console.error('Error fetching user info:', userError);
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: "Failed to find user in database",
          details: userError.message
        }),
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      };
    }

    // Prepare server data
    const newServer = {
      discord_server_id: serverData.id,
      name: serverData.name,
      icon: serverData.icon || null,
      banner: serverData.banner || null,
      short_description: description,
      invite_link: inviteLink,
      tags: tags,
      category: category,
      owner_id: userInfo.id,
      submitted_by_discord_id: userData.id,
      member_count: serverData.approximate_member_count || 0,
      online_count: serverData.approximate_presence_count || 0,
      is_approved: false // Default to false, admin needs to approve
    };

    // Add server to database
    const { data: server, error: serverError } = await supabase
      .from('servers')
      .insert([newServer])
      .select();

    if (serverError) {
      console.error('Error adding server:', serverError);
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: "Failed to add server to database",
          details: serverError.message
        }),
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true,
        message: "Server submitted successfully and waiting for approval",
        server: server[0]
      }),
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    };
  } catch (error) {
    console.error("Error in add-server function:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: "Failed to process server submission",
        details: error.message
      }),
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    };
  }
};
