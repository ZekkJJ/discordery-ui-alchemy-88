
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface NavigationLinksProps {
  isAuthenticated: boolean;
}

const NavigationLinks: React.FC<NavigationLinksProps> = ({ isAuthenticated }) => {
  const location = useLocation();
  
  return (
    <nav className="hidden md:flex items-center space-x-6">
      <Link 
        to="/" 
        className={`text-gray-300 hover:text-white transition-colors ${location.pathname === '/' ? 'font-medium text-white' : ''}`}
      >
        Home
      </Link>
      <Link 
        to="/explore" 
        className={`text-gray-300 hover:text-white transition-colors ${location.pathname === '/explore' ? 'font-medium text-white' : ''}`}
      >
        Explore
      </Link>
      {isAuthenticated && (
        <Link 
          to="/dashboard" 
          className={`text-gray-300 hover:text-white transition-colors ${location.pathname === '/dashboard' ? 'font-medium text-white' : ''}`}
        >
          Dashboard
        </Link>
      )}
    </nav>
  );
};

export default NavigationLinks;
