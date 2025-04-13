
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader } from "lucide-react";

const DiscordAuth = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      try {
        setLoading(true);
        console.log("Checking auth session...");
        
        // Check if we're already logged in with Supabase
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Session error:", sessionError);
          throw new Error(`Session error: ${sessionError.message}`);
        }
        
        // If we have a session, we can navigate to the home page
        if (session) {
          console.log("Session found:", session.user.id);
          toast.success("Successfully authenticated with Discord!");
          setTimeout(() => {
            window.location.href = "/"; // Use window.location for a full page reload
          }, 1000);
          return;
        }
        
        // Try to refresh session from cookies/local storage
        console.log("No session found, trying to refresh...");
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshData?.session) {
          console.log("Session refreshed successfully");
          toast.success("Successfully authenticated with Discord!");
          setTimeout(() => {
            window.location.href = "/"; // Use window.location for a full page reload
          }, 1000);
          return;
        }
        
        if (refreshError) {
          console.error("Auth refresh error:", refreshError);
        }
        
        throw new Error("No session found. Authentication failed. Please try logging in again.");
        
      } catch (err) {
        console.error("Auth session check error:", err);
        setError(err instanceof Error ? err.message : "Authentication failed");
        toast.error("Authentication failed. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 px-4">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg text-center max-w-md w-full border border-gray-700">
        <h1 className="text-2xl font-bold mb-4 text-white">
          Discord Authentication
        </h1>
        
        {loading ? (
          <div className="flex flex-col items-center space-y-4">
            <Loader className="w-10 h-10 text-indigo-500 animate-spin" />
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
            <p className="mb-4">Authentication successful! Redirecting to home page...</p>
            <Loader className="w-6 h-6 text-green-400 animate-spin mx-auto" />
          </div>
        )}
      </div>
    </div>
  );
};

export default DiscordAuth;
