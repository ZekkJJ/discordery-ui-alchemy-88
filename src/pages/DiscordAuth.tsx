
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
    const checkSession = async () => {
      try {
        setLoading(true);
        
        // Get hash params from URL if any (some auth providers use hash instead of query)
        const hashParams = new URLSearchParams(location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        
        // Check if we're already logged in with Supabase
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw new Error(`Session error: ${sessionError.message}`);
        }
        
        // If we have a session, we can navigate to the dashboard
        if (session) {
          console.log("Successfully authenticated with Discord!");
          toast.success("Successfully authenticated with Discord!");
          
          // Show success dialog
          setShowDialog(true);
          
          // Redirect to dashboard after a short delay
          setTimeout(() => {
            navigate("/dashboard");
          }, 1500);
          
          return;
        }
        
        // If we don't have a session yet, try to see if we can set it up from cookies
        // This helps with auth flows that rely on redirect
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshData?.session) {
          toast.success("Successfully authenticated with Discord!");
          
          // Show success dialog
          setShowDialog(true);
          
          // Redirect to dashboard after a short delay
          setTimeout(() => {
            navigate("/dashboard");
          }, 1500);
          
          return;
        }
        
        if (refreshError) {
          console.error("Auth refresh error:", refreshError);
        }
        
        // If we still don't have a session, show an error
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
  }, [navigate, location]);

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
            <p className="mb-4">Authentication successful! Redirecting to dashboard...</p>
          </div>
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md bg-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>Authentication Successful</DialogTitle>
            <DialogDescription className="text-gray-300">
              You have successfully connected your Discord account. Redirecting to dashboard...
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DiscordAuth;
