
import React from 'react';
import { Link } from 'react-router-dom';
import NavigationLinks from './NavigationLinks';
import SearchBar from './SearchBar';
import UserAuthSection from './UserAuthSection';
import { useNavbarAuth } from '@/hooks/useNavbarAuth';

const Navbar: React.FC = () => {
  const {
    user,
    userData,
    isLoading,
    username,
    avatarUrl,
    handleLogout,
    isAuthenticated
  } = useNavbarAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-discordery-background/95 backdrop-blur-sm border-b border-discordery-gray/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and site name */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <div className="text-2xl font-bold bg-gradient-to-r from-discordery-indigo to-discordery-teal bg-clip-text text-transparent">
                Discordery
              </div>
            </Link>
            
            {/* Navigation links */}
            <NavigationLinks isAuthenticated={isAuthenticated} />
          </div>
          
          {/* Right side: Quick search, login, and user */}
          <div className="flex items-center space-x-4">
            <SearchBar />
            
            {/* Login/User section */}
            <UserAuthSection 
              isLoading={isLoading}
              userData={userData}
              user={user}
              username={username}
              avatarUrl={avatarUrl}
              onLogout={handleLogout}
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
