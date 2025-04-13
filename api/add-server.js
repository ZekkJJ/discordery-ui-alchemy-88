
// Vercel API route for adding a server
import { createClient } from '@supabase/supabase-js';

// Environment variables
const SUPABASE_URL = process.env.SUPABASE_URL || "https://eahmzxgmnyacbwahdanv.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only accept POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Parse the request body
    const { 
      discordServerId,
      description, 
      inviteLink,
      tags,
      category
    } = req.body;

    // Get Discord token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "Missing or invalid Discord authorization token" });
    }

    const token = authHeader.replace('Bearer ', '');
    console.log("Token received:", token ? "Present (length: " + token.length + ")" : "Missing");

    // Validate required fields
    if (!discordServerId || !description || !inviteLink || !tags || !category) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Create a Supabase client
    if (!SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(500).json({ error: "Server configuration error" });
    }
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Verify the user's session first
    const { data: { user: supabaseUser }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !supabaseUser) {
      console.error('Authentication error:', authError);
      return res.status(401).json({ 
        error: "Authentication failed",
        details: authError?.message || "Invalid token" 
      });
    }
    
    // Get Discord token from user record
    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('access_token, id, discord_id')
      .eq('id', supabaseUser.id)
      .single();
      
    if (userDataError) {
      console.error('Error fetching user data:', userDataError);
      return res.status(500).json({ 
        error: "Failed to retrieve user data",
        details: userDataError.message
      });
    }
    
    if (!userData || !userData.access_token) {
      return res.status(403).json({ error: "Discord token not found for this user" });
    }
    
    const discordToken = userData.access_token;

    // Get Discord server details
    const DISCORD_API_URL = `https://discord.com/api/guilds/${discordServerId}`;

    // Fetch server info from Discord using the Discord token
    const guildResponse = await fetch(`${DISCORD_API_URL}?with_counts=true`, {
      headers: {
        Authorization: `Bearer ${discordToken}`,
      },
    });

    if (!guildResponse.ok) {
      const errorText = await guildResponse.text();
      return res.status(guildResponse.status).json({ 
        error: "Failed to fetch server details from Discord",
        details: errorText 
      });
    }

    // Get Discord server data
    const serverData = await guildResponse.json();
    
    // Check if server already exists in database
    const { data: existingServer, error: checkError } = await supabase
      .from('servers')
      .select('id')
      .eq('discord_server_id', discordServerId)
      .single();
      
    if (existingServer) {
      return res.status(409).json({ error: "This server is already listed in the directory" });
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
      owner_id: userData.id,
      submitted_by_discord_id: userData.discord_id,
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
      return res.status(500).json({ 
        error: "Failed to add server to database",
        details: serverError.message
      });
    }

    return res.status(200).json({ 
      success: true,
      message: "Server submitted successfully and waiting for approval",
      server: server[0]
    });
  } catch (error) {
    console.error("Error in add-server function:", error);
    return res.status(500).json({ 
      error: "Failed to process server submission",
      details: error.message
    });
  }
}
