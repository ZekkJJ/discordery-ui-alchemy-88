
// Function to get Discord access token
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
    const { userId, discordId } = body;

    if (!userId && !discordId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing userId or discordId parameter" }),
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      };
    }

    // Supabase configuration
    const SUPABASE_URL = process.env.SUPABASE_URL || "https://hyoaegvyvmzpbvhtzbpv.supabase.co";
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!SUPABASE_SERVICE_ROLE_KEY) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Server configuration error (missing Supabase key)" }),
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      };
    }
    
    // Create Supabase client with service role key to bypass RLS
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    let userData = null;
    
    // Try to find user by ID first if provided
    if (userId) {
      const { data, error } = await supabase
        .from('users')
        .select('access_token')
        .eq('id', userId)
        .maybeSingle();
        
      if (error) {
        console.error("Error fetching by userId:", error);
      } else if (data) {
        userData = data;
      }
    }
    
    // If no data yet and discordId is provided, try finding by Discord ID
    if (!userData && discordId) {
      const { data, error } = await supabase
        .from('users')
        .select('access_token')
        .eq('discord_id', discordId)
        .maybeSingle();
        
      if (error) {
        console.error("Error fetching by discordId:", error);
      } else if (data) {
        userData = data;
      }
    }
    
    if (!userData || !userData.access_token) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Discord token not found for this user" }),
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      };
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({ access_token: userData.access_token }),
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    };
  } catch (error) {
    console.error("Error in discord-token function:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: "Failed to get Discord token",
        details: error.message
      }),
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    };
  }
};
