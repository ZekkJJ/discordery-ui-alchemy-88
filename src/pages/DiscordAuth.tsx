
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader } from "lucide-react";

// Discord API constants
const DISCORD_CLIENT_ID = "1360393180482375691";
const REDIRECT_URI = "https://sprightly-sawine-1d6202.netlify.app/discord-auth";

const DiscordAuth = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  
  useEffect(() => {
    const exchangeCodeForToken = async (code: string) => {
      try {
        console.log("Exchanging code for token...");
        
        // Exchange code for token using Netlify function
        const tokenResponse = await fetch("/.netlify/functions/discord-token", {
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
        const userResponse = await fetch("/.netlify/functions/discord-user", {
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
        
        // Sign up user first
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
        
        let authData;
        
        // If user already exists, sign in instead
        if (signUpError && signUpError.message.includes("already")) {
          console.log("User exists, signing in instead");
          const { data, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          
          if (signInError) throw new Error(`Authentication failed: ${signInError.message}`);
          authData = data;
        } else {
          authData = signUpData;
        }
        
        console.log("Authentication successful:", authData);
        
        // First get the current user's ID from the auth session
        const userId = authData.user?.id;
        if (!userId) {
          throw new Error("Failed to get user ID from auth session");
        }

        // Store user data in Supabase database using RPC function to bypass RLS
        const { error: upsertError } = await supabase.rpc('upsert_user_data', {
          p_id: userId,
          p_discord_id: userData.id,
          p_discord_username: userData.username,
          p_email: userData.email,
          p_discriminator: userData.discriminator || null,
          p_avatar: userData.avatar,
          p_access_token: tokenResult.access_token,
          p_refresh_token: tokenResult.refresh_token,
          p_token_expires_at: new Date(Date.now() + (tokenResult.expires_in * 1000)).toISOString()
        });
        
        if (upsertError) {
          console.error("Error storing user data:", upsertError);
          throw new Error(`Failed to store user data: ${upsertError.message}`);
        }
        
        console.log("User data stored successfully");
        
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
