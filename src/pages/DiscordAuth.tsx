
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const DiscordAuth = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleAuth = async () => {
      try {
        setLoading(true);
        
        // Get the Discord auth code from URL
        const urlParams = new URLSearchParams(location.search);
        const discordId = urlParams.get("discord_id");
        
        if (!discordId) {
          throw new Error("Authentication failed: Missing discord ID");
        }

        // Check if we're already logged in
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error("No session found. Please try logging in again.");
        }
        
        toast.success("Successfully authenticated!");
        navigate("/dashboard");
      } catch (err) {
        console.error("Auth error:", err);
        setError(err instanceof Error ? err.message : "Authentication failed");
        toast.error("Authentication failed!");
      } finally {
        setLoading(false);
      }
    };

    handleAuth();
  }, [location, navigate]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg text-center max-w-md w-full">
        <h1 className="text-2xl font-bold text-white mb-4">
          Discord Authentication
        </h1>
        
        {loading ? (
          <div className="flex flex-col items-center space-y-4">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-300">Completing authentication...</p>
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
            <p className="mb-4">Authentication successful! Redirecting...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiscordAuth;
