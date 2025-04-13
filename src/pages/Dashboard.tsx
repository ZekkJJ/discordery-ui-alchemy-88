
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
      
      // Fetch the current user data to get their Discord access token
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('access_token')
        .eq('id', session.user.id)
        .single();
      
      if (userError || !userData?.access_token) {
        console.error("Error fetching user data:", userError);
        
        // Try to get token from user metadata as fallback
        const discordId = session.user.user_metadata?.discord_id;
        if (discordId) {
          const { data: discordUser } = await supabase
            .from('users')
            .select('access_token')
            .eq('discord_id', discordId)
            .single();
            
          if (discordUser?.access_token) {
            fetchUserGuilds(discordUser.access_token);
          } else {
            toast.error("Could not retrieve your Discord token. Please try logging in again.");
          }
        } else {
          toast.error("Could not retrieve your Discord token. Please try logging in again.");
        }
        return;
      }
      
      fetchUserGuilds(userData.access_token);
    };
    
    checkAuth();
  }, [navigate]);

  const fetchUserGuilds = async (accessToken: string) => {
    try {
      setLoading(true);
      
      // Direct API call to Discord using the user's access token
      const response = await fetch("https://discord.com/api/users/@me/guilds", {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to fetch guilds:", response.status, errorText);
        throw new Error(errorText || "Failed to fetch servers");
      }

      const guildsData = await response.json();
      console.log("Fetched guilds from Discord API:", guildsData);
      
      // Filter to only show guilds where the user is the owner
      const ownedGuilds = guildsData.filter(guild => guild.owner === true);
      
      // Check which guilds are already listed in our database
      const { data: existingServers, error: serversError } = await supabase
        .from('servers')
        .select('discord_server_id');
        
      if (serversError) {
        console.error('Error fetching existing servers:', serversError);
      }
      
      // Create a set of already listed server IDs for quick lookup
      const listedServerIds = new Set(existingServers?.map(server => server.discord_server_id) || []);
      
      // Attach isAlreadyListed flag to each guild
      const enrichedGuilds = ownedGuilds.map(guild => ({
        ...guild,
        isAlreadyListed: listedServerIds.has(guild.id)
      }));
      
      setUserGuilds(enrichedGuilds || []);
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
      const { data: userData } = await supabase
        .from('users')
        .select('access_token')
        .eq('id', session.user.id)
        .single();
        
      if (userData?.access_token) {
        fetchUserGuilds(userData.access_token);
      }
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
