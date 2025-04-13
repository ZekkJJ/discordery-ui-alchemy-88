
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import PageLayout from "@/components/layout/PageLayout";
import ServerList from "@/components/dashboard/ServerList";
import ServerSubmissionForm from "@/components/dashboard/ServerSubmissionForm";

interface Guild {
  id: string;
  name: string;
  icon: string;
  owner: boolean;
  isAlreadyListed: boolean;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userGuilds, setUserGuilds] = useState<Guild[]>([]);
  const [selectedGuild, setSelectedGuild] = useState<Guild | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Please login to access the dashboard");
        navigate("/");
        return;
      }
      
      fetchUserGuilds(session.access_token);
    };
    
    checkAuth();
  }, [navigate]);

  const fetchUserGuilds = async (accessToken: string) => {
    try {
      setLoading(true);
      
      // Use the Supabase function instead of Netlify function
      const { data, error } = await supabase.functions.invoke('user-guilds', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      
      if (error) {
        throw new Error(error.message || "Failed to fetch servers");
      }

      console.log("Fetched guilds:", data);
      setUserGuilds(data || []);
    } catch (error) {
      console.error("Error fetching guilds:", error);
      toast.error("Failed to load your Discord servers");
    } finally {
      setLoading(false);
    }
  };

  const handleGuildSelect = (guild: Guild) => {
    setSelectedGuild(guild);
  };

  const handleSubmitSuccess = async () => {
    // Reset selected guild
    setSelectedGuild(null);
    
    // Refresh guild list to update isAlreadyListed status
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      fetchUserGuilds(session.access_token);
    }
  };

  return (
    <PageLayout>
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Server Dashboard</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <ServerList 
              userGuilds={userGuilds}
              selectedGuild={selectedGuild}
              onSelectGuild={handleGuildSelect}
              loading={loading}
            />
          </div>
          
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                {selectedGuild ? `Add ${selectedGuild.name} to Directory` : 'Select a server to add'}
              </h2>
              
              {!selectedGuild ? (
                <div className="text-center py-8 text-gray-400">
                  <p>Please select a server from the list to add it to the directory.</p>
                </div>
              ) : (
                <ServerSubmissionForm 
                  selectedGuild={selectedGuild}
                  onSubmitSuccess={handleSubmitSuccess}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default Dashboard;
