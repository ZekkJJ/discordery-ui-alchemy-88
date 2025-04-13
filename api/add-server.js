
// Vercel API route for adding a server to the directory
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get auth token from request headers
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization' });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Import Supabase client
    const { createClient } = require('@supabase/supabase-js');
    const supabaseUrl = process.env.SUPABASE_URL || "https://eahmzxgmnyacbwahdanv.supabase.co";
    const supabaseKey = req.headers.apikey || process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseKey) {
      return res.status(500).json({ error: 'Missing Supabase API key' });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Verify the user's session
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ 
        error: 'Authentication failed',
        details: authError?.message
      });
    }

    // Parse request body
    const { discordServerId, description, inviteLink, tags, category } = req.body;

    // Validate required fields
    if (!discordServerId || !description || !inviteLink || !tags || !category) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate tags array
    if (!Array.isArray(tags) || tags.length < 3) {
      return res.status(400).json({ error: 'At least 3 tags are required' });
    }

    // Validate invite link format
    if (!inviteLink.startsWith('https://discord.gg/') && !inviteLink.startsWith('https://discord.com/invite/')) {
      return res.status(400).json({ error: 'Invalid invite link format' });
    }

    // Get the user's Discord details from Supabase
    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (userDataError || !userData) {
      return res.status(404).json({ 
        error: 'User data not found in database',
        details: userDataError?.message
      });
    }

    // Fetch user's guilds from Discord API
    const guildsResponse = await fetch('https://discord.com/api/users/@me/guilds', {
      headers: {
        Authorization: `Bearer ${userData.access_token}`,
      },
    });

    if (!guildsResponse.ok) {
      const errorText = await guildsResponse.text();
      return res.status(500).json({ 
        error: 'Failed to verify server ownership',
        details: errorText
      });
    }

    const guildsData = await guildsResponse.json();
    
    // Verify user owns this server
    const ownedGuild = guildsData.find(guild => guild.id === discordServerId && guild.owner === true);
    
    if (!ownedGuild) {
      return res.status(403).json({ error: "You don't own this server" });
    }

    // Check if server already exists
    const { data: existingServer, error: checkError } = await supabase
      .from('servers')
      .select('id')
      .eq('discord_server_id', discordServerId)
      .single();

    if (existingServer) {
      return res.status(409).json({ error: 'This server is already listed in the directory' });
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
      return res.status(500).json({ 
        error: 'Failed to add server to directory',
        details: insertError.message
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Server submitted successfully!',
      serverId: newServer[0].id
    });
  } catch (error) {
    console.error('Server submission error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message
    });
  }
}
