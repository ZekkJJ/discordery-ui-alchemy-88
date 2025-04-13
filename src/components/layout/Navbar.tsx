
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import NavigationLinks from './NavigationLinks';
import SearchBar from './SearchBar';
import UserAuthSection from './UserAuthSection';
import { useNavbarAuth } from '@/hooks/useNavbarAuth';
import { Menu, X } from 'lucide-react';

const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const {
    user,
    userData,
    isLoading,
    username,
    avatarUrl,
    handleLogout,
    isAuthenticated
  } = useNavbarAuth();

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gray-900 border-b border-gray-800">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Logo and site name */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <div className="text-2xl font-bold bg-gradient-to-r from-indigo-500 to-purple-400 bg-clip-text text-transparent">
                Discordery
              </div>
            </Link>
            
            {/* Desktop navigation links */}
            <div className="ml-8 hidden md:block">
              <NavigationLinks isAuthenticated={isAuthenticated} />
            </div>
          </div>
          
          {/* Right side: Quick search, login, and user */}
          <div className="flex items-center space-x-4">
            <div className="hidden md:block">
              <SearchBar />
            </div>
            
            {/* User Section */}
            <UserAuthSection 
              isLoading={isLoading}
              userData={userData}
              user={user}
              username={username}
              avatarUrl={avatarUrl}
              onLogout={handleLogout}
            />
            
            {/* Mobile menu button */}
            <button 
              className="md:hidden text-gray-400 hover:text-white"
              onClick={toggleMobileMenu}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
        
        {/* Mobile menu, shown/hidden based on state */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-gray-800 py-2 px-4">
            <div className="py-2">
              <SearchBar />
            </div>
            <nav className="flex flex-col space-y-3 pb-3 pt-2">
              <Link 
                to="/" 
                className="text-gray-300 hover:text-white py-2 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link 
                to="/explore" 
                className="text-gray-300 hover:text-white py-2 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Explore
              </Link>
              {isAuthenticated && (
                <Link 
                  to="/dashboard" 
                  className="text-gray-300 hover:text-white py-2 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
