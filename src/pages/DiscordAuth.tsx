import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader } from "lucide-react";

// Discord API constants
const DISCORD_CLIENT_ID = "1360393180482375691";
const REDIRECT_URI = "https://your-vercel-app.vercel.app/discord-auth";  // Update this with your Vercel app URL

const DiscordAuth = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  
  useEffect(() => {
    const exchangeCodeForToken = async (code: string) => {
      try {
        console.log("Exchanging code for token...");
        
        // Exchange code for token using Vercel API route
        const tokenResponse = await fetch("/api/discord-token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code,
            redirect_uri: REDIRECT_URI,
          }),
        });
        
        if (!tokenResponse.ok) {
          throw new Error(`Token exchange failed: ${await tokenResponse.text()}`);
        }
        
        const tokenResult = await tokenResponse.json();
        console.log("Token exchange successful");
        
        // Get user information from Discord API
        const userResponse = await fetch("/api/discord-user", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            access_token: tokenResult.access_token,
          }),
        });
        
        if (!userResponse.ok) {
          throw new Error(`User data fetch failed: ${await userResponse.text()}`);
        }
        
        const userData = await userResponse.json();
        console.log("User data fetch successful:", userData);
        
        // Create email format for Supabase (using Discord ID)
        const email = `${userData.id}@discord.user`;
        const password = "discord-oauth-user"; // Common password for Discord OAuth users
        
        // Try to sign in first (most users will already have an account)
        console.log("Attempting to sign in with existing account");
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        let authData;
        
        if (signInError) {
          console.log("Sign in failed, attempting signup instead:", signInError.message);
          // If user doesn't exist, sign up instead
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                discord_id: userData.id,
                discord_username: userData.username,
                provider: "discord",
                avatar: userData.avatar
              }
            }
          });
          
          if (signUpError) {
            throw new Error(`Authentication failed: ${signUpError.message}`);
          }
          
          console.log("Signup successful:", signUpData);
          authData = signUpData;
        } else {
          console.log("Sign in successful:", signInData);
          authData = signInData;
        }
        
        // First get the current user's ID from the auth session
        const userId = authData.user?.id;
        if (!userId) {
          throw new Error("Failed to get user ID from auth session");
        }

        // Convert token expires time to proper timestamp
        const tokenExpiresAt = new Date(Date.now() + (tokenResult.expires_in * 1000));
        
        // Store user data in Supabase database using RPC function to bypass RLS
        const { error: upsertError } = await supabase.rpc('upsert_user_data', {
          p_id: userId,
          p_discord_id: userData.id,
          p_discord_username: userData.username,
          p_email: userData.email || null,
          p_discriminator: userData.discriminator || null,
          p_avatar: userData.avatar || null,
          p_access_token: tokenResult.access_token,
          p_refresh_token: tokenResult.refresh_token,
          p_token_expires_at: tokenExpiresAt.toISOString()
        });
        
        if (upsertError) {
          console.error("Error storing user data:", upsertError);
          throw new Error(`Failed to store user data: ${upsertError.message}`);
        }
        
        console.log("User data stored successfully");
        
        // Re-fetch the current session to ensure it's up to date
        const { data: sessionData } = await supabase.auth.getSession();
        console.log("Current session after auth:", sessionData);
        
        // Success - redirect to home
        toast.success("Successfully authenticated with Discord!");
        navigate("/");
      } catch (err) {
        console.error("Auth error:", err);
        setError(err instanceof Error ? err.message : "Authentication failed");
        toast.error("Authentication failed. Please try again.");
        setLoading(false);
      }
    };
    
    const handleAuth = async () => {
      try {
        setLoading(true);
        const queryParams = new URLSearchParams(location.search);
        const code = queryParams.get("code");
        
        if (!code) {
          throw new Error("No authorization code found in URL");
        }
        
        await exchangeCodeForToken(code);
      } catch (err) {
        console.error("Auth processing error:", err);
        setError(err instanceof Error ? err.message : "Authentication failed");
        toast.error("Authentication failed. Please try again.");
        setLoading(false);
      }
    };
    
    handleAuth();
  }, [location, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 px-4">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg text-center max-w-md w-full border border-gray-700">
        <h1 className="text-2xl font-bold mb-4 text-white">
          Discord Authentication
        </h1>
        
        {loading ? (
          <div className="flex flex-col items-center space-y-4">
            <Loader className="w-10 h-10 text-indigo-500 animate-spin" />
            <p className="text-gray-300">Processing authentication...</p>
          </div>
        ) : error ? (
          <div className="text-red-400">
            <p className="mb-4">{error}</p>
            <button
              onClick={() => navigate("/")}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded transition-colors"
            >
              Return Home
            </button>
          </div>
        ) : (
          <div className="text-green-400">
            <p className="mb-4">Authentication successful! Redirecting to home page...</p>
            <Loader className="w-6 h-6 text-green-400 animate-spin mx-auto" />
          </div>
        )}
      </div>
    </div>
  );
};

export default DiscordAuth;
