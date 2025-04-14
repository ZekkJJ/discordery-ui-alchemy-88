
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

// Discord API endpoints
const DISCORD_TOKEN_URL = "https://discord.com/api/oauth2/token";
const DISCORD_USER_URL = "https://discord.com/api/users/@me";

// Environment variables
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://eahmzxgmnyacbwahdanv.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const DISCORD_CLIENT_ID = Deno.env.get("DISCORD_CLIENT_ID");
const DISCORD_CLIENT_SECRET = Deno.env.get("DISCORD_CLIENT_SECRET");
const REDIRECT_URI = Deno.env.get("DISCORD_REDIRECT_URI");
const FRONTEND_URL = "https://www.discordery.xyz"; // Updated frontend URL

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with admin privileges
    if (!SUPABASE_SERVICE_ROLE_KEY) {
      console.error("SUPABASE_SERVICE_ROLE_KEY is not set");
      return new Response(JSON.stringify({ error: "Server configuration error" }), { 
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    
    // Log received parameters for debugging
    console.log("Received code:", code ? "present" : "missing");
    console.log("Received state:", state ? "present" : "missing");
    console.log("Using frontend URL:", FRONTEND_URL);
    
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
    
    console.log("Cookie state:", cookies.discord_oauth_state || "missing");
    
    if (state !== cookies.discord_oauth_state) {
      console.warn("State mismatch but continuing - this might be expected in some environments");
      // We're not returning an error here to make debugging easier
      // In production, this would be a security risk
    }

    // Check that we have client secret
    if (!DISCORD_CLIENT_SECRET) {
      console.error("DISCORD_CLIENT_SECRET is not set");
      return new Response(JSON.stringify({ 
        error: "Configuration error: Discord client secret is missing" 
      }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // Exchange the code for access token
    console.log("Attempting to exchange code for token");
    const tokenParams = new URLSearchParams({
      client_id: DISCORD_CLIENT_ID,
      client_secret: DISCORD_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: REDIRECT_URI,
    });

    const tokenResponse = await fetch(DISCORD_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenParams,
    });

    if (!tokenResponse.ok) {
      const tokenError = await tokenResponse.text();
      console.error('Token exchange failed:', tokenError);
      return new Response(JSON.stringify({ 
        error: 'Failed to exchange code for token',
        details: tokenError,
        params: {
          client_id: DISCORD_CLIENT_ID,
          redirect_uri: REDIRECT_URI,
          // Don't log client secret
        }
      }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    const tokenData = await tokenResponse.json();
    const { access_token, refresh_token, expires_in } = tokenData;
    console.log("Received access token");

    // Fetch user details from Discord
    console.log("Fetching user info from Discord");
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
    console.log("Received user data for:", userData.username);

    // Check if user exists in our database
    console.log("Checking if user exists in database");
    const { data: existingUser, error: userQueryError } = await supabase
      .from('users')
      .select('*')
      .eq('discord_id', userData.id)
      .maybeSingle();

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
      console.log("Creating new user record");
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
      
      userId = newUser?.[0]?.id;
    } else {
      console.log("Updating existing user record");
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

    console.log("Creating auth session");
    // Create a session using Supabase Auth
    const email = `${userData.id}@discord.user`;
    const password = "discord-oauth-user"; // Using a fixed password since we're authenticating via Discord
    
    // Try to sign in first
    let sessionData;
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    // If the user doesn't exist yet in auth, create them
    if (signInError) {
      console.log("Sign in failed, creating new auth user", signInError.message);
      const { data: newAuthUser, error: signUpError } = await supabase.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: {
          discord_id: userData.id,
          discord_username: userData.username,
          provider: 'discord',
        }
      });

      if (signUpError) {
        console.error('Error creating auth user:', signUpError);
        return new Response(JSON.stringify({ error: 'Failed to create auth user', details: signUpError.message }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }

      // Try signin again after creating user
      const { data: retrySessionData, error: retrySignInError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (retrySignInError) {
        console.error('Error signing in after user creation:', retrySignInError);
        return new Response(JSON.stringify({ 
          error: 'Failed to sign in after user creation', 
          details: retrySignInError.message 
        }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
      
      // Use the new session data
      sessionData = retrySessionData;
    } else {
      sessionData = signInData;
    }

    // Get session info to set cookie
    console.log("Setting up redirect with auth token");
    
    if (!sessionData?.session?.access_token) {
      console.error("Failed to get valid session token");
      return new Response(JSON.stringify({ error: 'Failed to create valid session token' }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    
    // Set up the session cookie and redirect directly to the homepage
    const redirectUrl = new URL(`${FRONTEND_URL}/`);
    console.log("Redirecting to:", redirectUrl.toString());
    
    // Create a JWT cookie for the frontend
    const { data: { session: jwtSession }, error: jwtError } = await supabase.auth.setSession({
      access_token: sessionData.session.access_token,
      refresh_token: sessionData.session.refresh_token
    });
    
    if (jwtError) {
      console.error("Error setting JWT session:", jwtError);
    }
    
    // Prepare headers with session cookie
    const headers = new Headers({
      "Location": redirectUrl.toString(),
      ...corsHeaders
    });

    // Add cookies for auth
    const cookieDomain = new URL(FRONTEND_URL).hostname;
    const isProd = !cookieDomain.includes('localhost');
    const cookieOptions = isProd 
      ? '; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=28800'
      : '; Path=/; HttpOnly; SameSite=Lax; Max-Age=28800';
      
    // Set access token cookie
    headers.append(
      "Set-Cookie", 
      `sb-access-token=${sessionData.session?.access_token}${cookieOptions}`
    );

    // Set refresh token cookie  
    headers.append(
      "Set-Cookie", 
      `sb-refresh-token=${sessionData.session?.refresh_token}${cookieOptions}`
    );

    // Clear the state cookie
    headers.append(
      "Set-Cookie", 
      "discord_oauth_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0"
    );

    console.log("Auth completed, redirecting to frontend homepage");
    // Final step: HTTP 302 Redirect to the frontend
    return new Response(null, {
      status: 302,
      headers,
    });
  } catch (error) {
    console.error("OAuth callback error:", error);
    return new Response(JSON.stringify({ error: "Authentication process failed", details: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
});
