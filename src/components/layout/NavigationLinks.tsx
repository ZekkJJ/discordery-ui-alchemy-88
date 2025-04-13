
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface NavigationLinksProps {
  isAuthenticated: boolean;
}

const NavigationLinks: React.FC<NavigationLinksProps> = ({ isAuthenticated }) => {
  const location = useLocation();
  
  return (
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
      {isAuthenticated && (
        <Link 
          to="/dashboard" 
          className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
        >
          Dashboard
        </Link>
      )}
    </nav>
  );
};

export default NavigationLinks;
