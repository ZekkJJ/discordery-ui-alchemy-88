
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

// Discord API endpoints
const DISCORD_TOKEN_URL = "https://discord.com/api/oauth2/token";
const DISCORD_USER_URL = "https://discord.com/api/users/@me";

// Environment variables
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://hyoaegvyvmzpbvhtzbpv.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const DISCORD_CLIENT_ID = Deno.env.get("DISCORD_CLIENT_ID") || "1360393180482375691";
const DISCORD_CLIENT_SECRET = Deno.env.get("DISCORD_CLIENT_SECRET");
// This must match exactly what is registered in Discord Developer Portal
const REDIRECT_URI = Deno.env.get("DISCORD_REDIRECT_URI") || "https://hyoaegvyvmzpbvhtzbpv.supabase.co/functions/v1/oauth-callback";
const FRONTEND_URL = Deno.env.get("FRONTEND_URL") || "https://sprightly-sawine-1d6202.netlify.app";

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
    // Create a Supabase client with admin privileges
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    
    // Validate required parameters
    if (!code) {
      return new Response(JSON.stringify({ error: "Authorization code missing" }), { 
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // Validate state parameter with the one sent in cookie (CSRF protection)
    const cookieHeader = req.headers.get('cookie') || '';
    const cookies = Object.fromEntries(
      cookieHeader.split('; ').map(cookie => {
        const [name, value] = cookie.split('=');
        return [name, value];
      })
    );
    
    if (state !== cookies.discord_oauth_state) {
      return new Response(JSON.stringify({ error: "Invalid state parameter" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // Exchange the code for access token
    const tokenResponse = await fetch(DISCORD_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
      }),
    });

    if (!tokenResponse.ok) {
      const tokenError = await tokenResponse.text();
      console.error('Token exchange failed:', tokenError);
      return new Response(JSON.stringify({ error: 'Failed to exchange code for token' }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    const tokenData = await tokenResponse.json();
    const { access_token, refresh_token, expires_in } = tokenData;

    // Fetch user details from Discord
    const userResponse = await fetch(DISCORD_USER_URL, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    if (!userResponse.ok) {
      console.error('Failed to fetch user info:', await userResponse.text());
      return new Response(JSON.stringify({ error: 'Failed to fetch user info from Discord' }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    const userData = await userResponse.json();
    const tokenExpiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

    // Check if user exists in our database
    const { data: existingUser, error: userQueryError } = await supabase
      .from('users')
      .select('*')
      .eq('discord_id', userData.id)
      .single();

    if (userQueryError && userQueryError.code !== 'PGRST116') {
      console.error('Error checking for existing user:', userQueryError);
      return new Response(JSON.stringify({ error: 'Database error when checking user' }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // Prepare user data object
    const userDataToSave = {
      discord_id: userData.id,
      discord_username: userData.username,
      discriminator: userData.discriminator || null,
      avatar: userData.avatar,
      email: userData.email,
      access_token: access_token,
      refresh_token: refresh_token,
      token_expires_at: tokenExpiresAt,
      updated_at: new Date().toISOString()
    };

    let userId;

    // Insert or update user in database
    if (!existingUser) {
      // Create new user
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert([userDataToSave])
        .select();

      if (insertError) {
        console.error('Error creating user:', insertError);
        return new Response(JSON.stringify({ error: 'Failed to create user record' }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
      
      userId = newUser[0].id;
    } else {
      // Update existing user
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update(userDataToSave)
        .eq('discord_id', userData.id)
        .select();

      if (updateError) {
        console.error('Error updating user:', updateError);
        return new Response(JSON.stringify({ error: 'Failed to update user record' }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }

      userId = existingUser.id;
    }

    // Create a session using Supabase Auth
    const { data: sessionData, error: signInError } = await supabase.auth.signUp({
      email: `${userData.id}@discord.user`,
      password: crypto.randomUUID(), // Generate a secure random password
      options: {
        data: {
          discord_id: userData.id,
          provider: 'discord',
        }
      }
    });

    if (signInError && signInError.message !== "User already registered") {
      console.error('Error creating session:', signInError);
      return new Response(JSON.stringify({ error: 'Failed to create session' }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // Get session info to set cookie
    const { data: session } = await supabase.auth.getSession();
    
    // Set up the session cookie
    const redirectUrl = new URL(`${FRONTEND_URL}/dashboard`);
    
    // Prepare headers with session cookie
    const headers = new Headers({
      "Location": redirectUrl.toString(),
      "Set-Cookie": `supabase-auth-token=${session.session?.access_token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=28800`,
      ...corsHeaders
    });

    // Clear the state cookie
    headers.append("Set-Cookie", "discord_oauth_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0");

    // Final step: HTTP 302 Redirect to the frontend
    return new Response(null, {
      status: 302,
      headers,
    });
  } catch (error) {
    console.error("OAuth callback error:", error);
    return new Response(JSON.stringify({ error: "Authentication process failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
});
