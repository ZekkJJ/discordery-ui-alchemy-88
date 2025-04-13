
import React from 'react';
import DiscordLoginButton from '../auth/DiscordLoginButton';
import UserProfileDropdown from '../auth/UserProfileDropdown';
import { User } from '@supabase/supabase-js';

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
  // Consider a user authenticated if either userData or user is present
  const isAuthenticated = !!userData || !!user;

  return (
    <div className="flex items-center space-x-2">
      {isLoading ? (
        <div className="w-8 h-8 rounded-full bg-gray-800 animate-pulse"></div>
      ) : isAuthenticated ? (
        <UserProfileDropdown 
          username={username} 
          avatarUrl={avatarUrl}
          onLogout={onLogout}
        />
      ) : (
        <DiscordLoginButton user={user} onLogout={onLogout} />
      )}
    </div>
  );
};

export default UserAuthSection;
