
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import PageLayout from "@/components/layout/PageLayout";

interface Guild {
  id: string;
  name: string;
  icon: string;
  owner: boolean;
  isAlreadyListed: boolean;
}

interface ServerFormData {
  description: string;
  inviteLink: string;
  tags: string[];
  category: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userGuilds, setUserGuilds] = useState<Guild[]>([]);
  const [selectedGuild, setSelectedGuild] = useState<Guild | null>(null);
  const [formData, setFormData] = useState<ServerFormData>({
    description: "",
    inviteLink: "https://discord.gg/",
    tags: [],
    category: "gaming",
  });
  const [tagInput, setTagInput] = useState("");
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  // Categories for the dropdown
  const categories = [
    "gaming", "technology", "art", "music", 
    "education", "social", "science", "sports", 
    "entertainment", "anime", "programming", "other"
  ];

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
      
      const response = await fetch(`https://hyoaegvyvmzpbvhtzbpv.supabase.co/functions/v1/user-guilds`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch servers");
      }

      const guilds = await response.json();
      setUserGuilds(guilds);
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const addTag = () => {
    if (tagInput && !formData.tags.includes(tagInput) && formData.tags.length < 5) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput],
      });
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((tag) => tag !== tagToRemove),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedGuild) {
      toast.error("Please select a server");
      return;
    }
    
    if (formData.tags.length < 3) {
      toast.error("Please add at least 3 tags");
      return;
    }

    try {
      setLoadingSubmit(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Your session has expired. Please login again");
        navigate("/");
        return;
      }
      
      const response = await fetch(`https://hyoaegvyvmzpbvhtzbpv.supabase.co/functions/v1/add-server`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          discordServerId: selectedGuild.id,
          description: formData.description,
          inviteLink: formData.inviteLink,
          tags: formData.tags,
          category: formData.category,
        }),
      });

      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.error || "Failed to submit server");
      }

      toast.success("Server submitted successfully! It will be reviewed before appearing in the directory.");
      
      // Reset form
      setSelectedGuild(null);
      setFormData({
        description: "",
        inviteLink: "https://discord.gg/",
        tags: [],
        category: "gaming",
      });
      
      // Refresh guild list to update isAlreadyListed status
      fetchUserGuilds(session.access_token);
      
    } catch (error) {
      console.error("Submit error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to submit server");
    } finally {
      setLoadingSubmit(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/");
  };

  return (
    <PageLayout>
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Server Dashboard</h1>
          <Button variant="destructive" onClick={handleLogout}>Logout</Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-lg p-6 h-full">
              <h2 className="text-xl font-semibold text-white mb-4">Your Discord Servers</h2>
              
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : userGuilds.length === 0 ? (
                <p className="text-gray-400 text-center py-4">No servers found where you are the owner.</p>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                  {userGuilds.map((guild) => (
                    <div 
                      key={guild.id}
                      onClick={() => !guild.isAlreadyListed && handleGuildSelect(guild)}
                      className={`p-3 rounded-lg border flex items-center gap-3 cursor-pointer transition-all ${
                        selectedGuild?.id === guild.id 
                          ? 'bg-indigo-900 border-indigo-500' 
                          : guild.isAlreadyListed 
                            ? 'bg-gray-700 border-gray-600 opacity-60' 
                            : 'bg-gray-700 border-gray-600 hover:border-gray-500'
                      }`}
                    >
                      <div className="flex-shrink-0 w-10 h-10 bg-gray-600 rounded-full overflow-hidden">
                        {guild.icon ? (
                          <img 
                            src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`} 
                            alt={guild.name} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-lg font-medium text-white">
                            {guild.name.substring(0, 1)}
                          </div>
                        )}
                      </div>
                      <div className="flex-grow">
                        <p className="font-medium text-white">{guild.name}</p>
                        {guild.isAlreadyListed && (
                          <span className="text-xs text-green-400">Already in directory</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="description" className="text-white">Server Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Describe your server (features, community, purpose, etc.)"
                      required
                      className="min-h-[120px]"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="inviteLink" className="text-white">Invite Link</Label>
                    <Input
                      id="inviteLink"
                      name="inviteLink"
                      value={formData.inviteLink}
                      onChange={handleInputChange}
                      placeholder="https://discord.gg/..."
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="category" className="text-white">Category</Label>
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                      className="w-full p-2 rounded-md border bg-gray-700 border-gray-600 text-white"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor="tags" className="text-white">Tags (minimum 3, maximum 5)</Label>
                    <div className="flex gap-2">
                      <Input
                        id="tagInput"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        placeholder="Add a tag..."
                        className="flex-grow"
                      />
                      <Button 
                        type="button"
                        onClick={addTag}
                        disabled={!tagInput || formData.tags.length >= 5}
                      >
                        Add
                      </Button>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.tags.map((tag) => (
                        <div key={tag} className="bg-indigo-900 text-white px-2 py-1 rounded-md flex items-center gap-1">
                          <span>{tag}</span>
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="text-xs text-white hover:text-red-300"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                    {formData.tags.length < 3 && (
                      <p className="text-yellow-500 text-sm mt-1">Please add at least 3 tags</p>
                    )}
                  </div>
                  
                  <div className="pt-4">
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={loadingSubmit || formData.tags.length < 3}
                    >
                      {loadingSubmit ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                          Submitting...
                        </>
                      ) : "Submit Server"}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default Dashboard;
