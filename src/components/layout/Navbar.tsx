
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search } from 'lucide-react';

const Navbar: React.FC = () => {
  const location = useLocation();
  
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
            <nav className="ml-8 space-x-4 hidden md:flex">
              <Link 
                to="/" 
                className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
              >
                Home
              </Link>
              <Link 
                to="/explore" 
                className={`nav-link ${location.pathname === '/explore' ? 'active' : ''}`}
              >
                Explore
              </Link>
            </nav>
          </div>
          
          {/* Right side: Quick search and user */}
          <div className="flex items-center space-x-4">
            <div className="relative hidden md:block">
              <input
                type="text"
                placeholder="Quick search..."
                className="bg-discordery-card-bg text-sm rounded-full py-1.5 pl-9 pr-4 w-48 focus:w-64 transition-all duration-200 border border-discordery-gray/30 focus:border-discordery-indigo focus:outline-none"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-discordery-gray w-4 h-4" />
            </div>
            
            {/* User profile placeholder */}
            <div className="w-8 h-8 rounded-full bg-discordery-gray/20 border-2 border-transparent hover:border-discordery-indigo transition-all duration-200 flex items-center justify-center cursor-pointer">
              <span className="text-discordery-text text-xs">U</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
