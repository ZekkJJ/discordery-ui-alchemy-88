
// Vercel API route for exchanging Discord code for token
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code, redirect_uri } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'Missing authorization code' });
    }

    // Discord OAuth constants
    const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || "1360393180482375691";
    const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
    
    if (!DISCORD_CLIENT_SECRET) {
      return res.status(500).json({ error: 'Discord client secret is not configured' });
    }

    const params = new URLSearchParams({
      client_id: DISCORD_CLIENT_ID,
      client_secret: DISCORD_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirect_uri,
    });

    // Exchange code for token with Discord API
    const response = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Discord token exchange failed:', error);
      return res.status(response.status).json({ 
        error: 'Failed to exchange code for token',
        details: error
      });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Token exchange error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message
    });
  }
}
