
import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Guild {
  id: string;
  name: string;
  icon: string;
  owner: boolean;
  isAlreadyListed: boolean;
}

interface ServerSubmissionFormProps {
  selectedGuild: Guild | null;
  onSubmitSuccess: () => void;
}

interface ServerFormData {
  description: string;
  inviteLink: string;
  tags: string[];
  category: string;
}

const ServerSubmissionForm = ({ selectedGuild, onSubmitSuccess }: ServerSubmissionFormProps) => {
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
        return;
      }
      
      // Get user ID and Discord ID for token lookup
      const userId = session.user.id;
      const discordId = session.user.user_metadata?.discord_id;
      
      // Get Discord token via Netlify function
      const tokenResponse = await fetch("/.netlify/functions/discord-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          discordId
        }),
      });
      
      if (!tokenResponse.ok) {
        throw new Error("Failed to retrieve your Discord token. Please try logging in again.");
      }
      
      const tokenData = await tokenResponse.json();
      
      // Submit server using the Netlify function with Discord access token in the request
      const response = await fetch('/.netlify/functions/add-server', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokenData.access_token}` // Use Discord token, not session token
        },
        body: JSON.stringify({
          discordServerId: selectedGuild.id,
          description: formData.description,
          inviteLink: formData.inviteLink,
          tags: formData.tags,
          category: formData.category
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit server");
      }

      const responseData = await response.json();
      toast.success("Server submitted successfully! It will be reviewed before appearing in the directory.");
      
      // Reset form
      setFormData({
        description: "",
        inviteLink: "https://discord.gg/",
        tags: [],
        category: "gaming",
      });
      
      // Call the success callback to refresh the guild list
      onSubmitSuccess();
      
    } catch (error) {
      console.error("Submit error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to submit server");
    } finally {
      setLoadingSubmit(false);
    }
  };

  return (
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
  );
};

export default ServerSubmissionForm;
