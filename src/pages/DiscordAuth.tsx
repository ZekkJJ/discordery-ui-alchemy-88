
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const DiscordAuth = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
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

        // Check if we're already logged in with Supabase
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          throw new Error("No session found. Authentication failed.");
        }
        
        // Show success dialog
        setShowDialog(true);
        toast.success("Successfully authenticated with Discord!");
        
        // Redirect after a short delay
        setTimeout(() => {
          navigate("/dashboard");
        }, 1500);
      } catch (err) {
        console.error("Auth error:", err);
        setError(err instanceof Error ? err.message : "Authentication failed");
        toast.error("Authentication failed. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    // Only run auth flow if we have query parameters
    if (location.search) {
      handleAuth();
    } else {
      setLoading(false);
      setError("Missing authentication parameters. Please try logging in again.");
    }
  }, [location, navigate]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg text-center max-w-md w-full border border-gray-700">
        <h1 className="text-2xl font-bold mb-4 text-white">
          Discord Authentication
        </h1>
        
        {loading ? (
          <div className="flex flex-col items-center space-y-4">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
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

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Authentication Successful</DialogTitle>
            <DialogDescription>
              You have successfully connected your Discord account. Redirecting to dashboard...
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DiscordAuth;
