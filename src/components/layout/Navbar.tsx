import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import DiscordLoginButton from '../auth/DiscordLoginButton';
import UserProfileDropdown from '../auth/UserProfileDropdown';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { toast } from 'sonner';

const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log("Auth state changed:", event);
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        // If user just signed in, fetch their profile data
        if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && newSession?.user) {
          // Use setTimeout to avoid potential deadlocks with Supabase auth
          setTimeout(() => {
            fetchUserData(newSession.user.id);
          }, 0);
        }
        
        // Clear user data on sign out
        if (event === 'SIGNED_OUT') {
          setUserData(null);
        }
      }
    );

    // THEN check for existing session
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        
        // First try to get existing session
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error getting session:", error);
          setIsLoading(false);
          return;
        }
        
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (currentSession?.user) {
          await fetchUserData(currentSession.user.id);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeAuth();

    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  const fetchUserData = async (userId: string) => {
    try {
      console.log("Fetching user data for ID:", userId);
      
      // Get email from the user object for matching
      const { data: authUser } = await supabase.auth.getUser();
      const userEmail = authUser?.user?.email;
      
      if (!userEmail) {
        console.log("No user email found, trying fallback approach");
        // Try a fallback approach with the user ID
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
        
        if (error) {
          console.error("Error fetching user data by ID:", error);
          return;
        }
        
        if (data) {
          console.log("User data found by ID");
          setUserData(data);
          return;
        }
      }
      
      // If we have an email from auth, try to find the user by email
      if (userEmail) {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', userEmail)
          .maybeSingle();
          
        if (error) {
          console.error("Error fetching user data by email:", error);
          return;
        }
        
        if (data) {
          console.log("User data found by email");
          setUserData(data);
          return;
        }
      }
      
      // If we still don't have data, try to find by discord_id derived from auth metadata
      if (authUser?.user?.user_metadata?.discord_id) {
        const discordId = authUser.user.user_metadata.discord_id;
        console.log("Trying to find user by Discord ID:", discordId);
        
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('discord_id', discordId)
          .maybeSingle();
          
        if (error) {
          console.error("Error fetching user data by Discord ID:", error);
          return;
        }
        
        if (data) {
          console.log("User data found by Discord ID");
          setUserData(data);
          return;
        }
      }
      
      // Last resort, try to query all users and find a match
      console.log("No user data found, fetching all users for debug");
      const { data: allUsers, error: allUsersError } = await supabase
        .from('users')
        .select('*')
        .limit(10);
        
      if (allUsersError) {
        console.error("Error fetching all users:", allUsersError);
        return;
      }
      
      console.log("Available users in database:", allUsers?.length || 0);
      
    } catch (error) {
      console.error("Failed to fetch user data:", error);
    }
  };
  
  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      setSession(null);
      setUserData(null);
      toast.success("Logged out successfully");
      navigate('/');
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to log out. Please try again.");
    }
  };
  
  const getAvatarUrl = () => {
    if (!userData?.avatar) return undefined;
    return `https://cdn.discordapp.com/avatars/${userData.discord_id}/${userData.avatar}.png`;
  };

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
              {(user || userData) && (
                <Link 
                  to="/dashboard" 
                  className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
                >
                  Dashboard
                </Link>
              )}
            </nav>
          </div>
          
          {/* Right side: Quick search, login, and user */}
          <div className="flex items-center space-x-4">
            <div className="relative hidden md:block">
              <input
                type="text"
                placeholder="Quick search..."
                className="bg-discordery-card-bg text-sm rounded-full py-1.5 pl-9 pr-4 w-48 focus:w-64 transition-all duration-200 border border-discordery-gray/30 focus:border-discordery-indigo focus:outline-none"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-discordery-gray w-4 h-4" />
            </div>
            
            {/* Login/User section */}
            <div className="flex items-center space-x-2">
              {isLoading ? (
                <div className="w-8 h-8 rounded-full bg-gray-800 animate-pulse"></div>
              ) : userData ? (
                <UserProfileDropdown 
                  username={userData.discord_username} 
                  avatarUrl={getAvatarUrl()}
                  onLogout={handleLogout}
                />
              ) : (
                <DiscordLoginButton user={user} onLogout={handleLogout} />
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
