
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
        const code = urlParams.get("code");
        
        if (!code) {
          throw new Error("Authentication failed: Missing authorization code from Discord");
        }

        console.log("Received Discord authorization code:", code);

        // Exchange the code for access token
        // This should be done on the backend to keep the client_secret secure
        // For now, we'll simulate the process by checking if we have a session
        
        // Check if we're already logged in
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          // In a real implementation, you would send the code to your backend
          // const response = await fetch('/api/oauth/callback', {
          //   method: 'POST',
          //   headers: { 'Content-Type': 'application/json' },
          //   body: JSON.stringify({ code })
          // });
          // const data = await response.json();
          // if (!data.success) throw new Error(data.message);
          
          throw new Error("No session found. Please try logging in again.");
        }
        
        // Here you would typically store the Discord tokens and user info
        // For now, we'll just redirect to dashboard
        toast.success("Successfully authenticated with Discord!");
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
