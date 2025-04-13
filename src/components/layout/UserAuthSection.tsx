
import React from 'react';
import DiscordLoginButton from '../auth/DiscordLoginButton';
import { User } from '@supabase/supabase-js';
import { LogOut, User as UserIcon, PlusCircle, Settings, ChevronDown } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface UserAuthSectionProps {
  isLoading: boolean;
  userData: any;
  user: User | null;
  username: string;
  avatarUrl?: string;
  onLogout: () => Promise<void>;
}

const UserAuthSection: React.FC<UserAuthSectionProps> = ({
  isLoading,
  userData,
  user,
  username,
  avatarUrl,
  onLogout
}) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await onLogout();
      toast.success("Logged out successfully");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to log out. Please try again.");
    }
  };

  const goToDashboard = () => {
    navigate("/dashboard");
  };

  if (isLoading) {
    return (
      <div className="h-8 w-8 rounded-full bg-gray-700 animate-pulse"></div>
    );
  }

  if (userData) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger className="focus:outline-none">
          <div className="flex items-center space-x-2 rounded-lg p-1 hover:bg-gray-800 transition-colors cursor-pointer">
            <Avatar className="h-8 w-8 border border-gray-700">
              {avatarUrl ? (
                <AvatarImage 
                  src={avatarUrl} 
                  alt={username} 
                  className="object-cover"
                />
              ) : (
                <AvatarFallback className="bg-indigo-600 text-white text-sm">
                  {username.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>
            <span className="hidden sm:inline text-sm font-medium text-gray-200">{username}</span>
            <ChevronDown className="hidden sm:block h-4 w-4 text-gray-400" />
          </div>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent 
          align="end" 
          className="w-56 bg-gray-900 border border-gray-800 text-gray-200 py-1 px-1"
        >
          <div className="px-3 py-2 text-sm font-medium border-b border-gray-800 mb-1">
            Signed in as <span className="text-indigo-400 font-semibold">{username}</span>
          </div>
          
          <DropdownMenuItem 
            onClick={goToDashboard} 
            className="flex items-center gap-2 cursor-pointer px-3 py-2 text-sm hover:bg-gray-800 rounded"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add My Server</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 cursor-not-allowed"
          >
            <Settings className="w-4 h-4" />
            <span>Settings (Coming Soon)</span>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator className="my-1 bg-gray-800" />
          
          <DropdownMenuItem 
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-gray-800 hover:text-red-300 rounded cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return <DiscordLoginButton user={user} onLogout={onLogout} />;
};

export default UserAuthSection;
