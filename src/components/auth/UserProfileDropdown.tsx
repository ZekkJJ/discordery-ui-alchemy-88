
import { useState } from "react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, Settings, PlusCircle, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface UserProfileDropdownProps {
  username: string;
  avatarUrl?: string;
  onLogout: () => void;
}

const UserProfileDropdown = ({ username, avatarUrl, onLogout }: UserProfileDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      onLogout();
      toast.success("Logged out successfully");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to log out. Please try again.");
    }
  };

  const goToDashboard = () => {
    navigate("/dashboard");
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2 px-2 py-1 hover:bg-gray-800 rounded-lg">
          <Avatar className="h-8 w-8">
            {avatarUrl ? (
              <AvatarImage src={avatarUrl} alt={username} />
            ) : (
              <AvatarFallback className="bg-indigo-600 text-white">
                {username.substring(0, 1).toUpperCase()}
              </AvatarFallback>
            )}
          </Avatar>
          <span className="hidden sm:inline text-white font-medium">{username}</span>
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        className="w-56 bg-gray-800 border border-gray-700 text-white p-1 z-50"
        sideOffset={5}
      >
        <div className="px-2 py-1.5 text-sm font-semibold">
          Signed in as <span className="text-indigo-400">{username}</span>
        </div>
        
        <DropdownMenuSeparator className="bg-gray-700" />
        
        <DropdownMenuItem 
          onClick={goToDashboard} 
          className="flex items-center gap-2 cursor-pointer hover:bg-gray-700 focus:bg-gray-700"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add My Server</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          className="flex items-center gap-2 text-gray-400 cursor-not-allowed"
        >
          <Settings className="w-4 h-4" />
          <span>Settings (Coming Soon)</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator className="bg-gray-700" />
        
        <DropdownMenuItem 
          onClick={handleLogout}
          className="flex items-center gap-2 text-red-400 cursor-pointer hover:bg-gray-700 hover:text-red-300 focus:bg-gray-700 focus:text-red-300"
        >
          <LogOut className="w-4 h-4" />
          <span>Log Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserProfileDropdown;
