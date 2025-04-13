
import { useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export const useNavbarAuth = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log("Setting up auth state listener...");
    
    // Set up auth state listener FIRST to prevent deadlocks
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        console.log("Auth state changed:", event, newSession?.user?.id);
        
        // Update session and user state immediately
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        // If user signed in or token refreshed, fetch profile data
        // Use setTimeout to defer the Supabase call and prevent deadlocks
        if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && newSession?.user) {
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
        
        // Get existing session
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error getting session:", error);
          setIsLoading(false);
          return;
        }
        
        console.log("Initial session check:", currentSession?.user?.id);
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        // If user is logged in, fetch their data
        if (currentSession?.user) {
          await fetchUserData(currentSession.user.id);
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
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
      setIsLoading(true);
      console.log("Fetching user data for ID:", userId);
      
      // First try to get the user from the users table using the user's ID
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) {
        console.error("Error fetching user data by ID:", error);
      } else if (data) {
        console.log("User data found by ID:", data);
        setUserData(data);
        setIsLoading(false);
        return;
      }
      
      // If no direct match by ID, try to match by Discord ID from metadata
      const { data: authUser } = await supabase.auth.getUser();
      if (authUser?.user?.user_metadata?.discord_id) {
        const discordId = authUser.user.user_metadata.discord_id;
        console.log("Trying to find user by Discord ID from metadata:", discordId);
        
        const { data: discordData, error: discordError } = await supabase
          .from('users')
          .select('*')
          .eq('discord_id', discordId)
          .maybeSingle();
          
        if (discordError) {
          console.error("Error fetching user data by Discord ID:", discordError);
        } else if (discordData) {
          console.log("User data found by Discord ID:", discordData);
          setUserData(discordData);
          setIsLoading(false);
          return;
        }
      }
      
      // If still no data found, log some debug info
      console.log("User data not found. User metadata:", user?.user_metadata);
      
      const { data: allUsers, error: allUsersError } = await supabase
        .from('users')
        .select('*')
        .limit(10);
        
      if (allUsersError) {
        console.error("Error fetching all users:", allUsersError);
      } else {
        console.log("Available users in database:", allUsers);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error("Failed to fetch user data:", error);
      setIsLoading(false);
    }
  };
  
  const handleLogout = async () => {
    try {
      setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };
  
  // Get avatar URL from userData if available
  const getAvatarUrl = () => {
    if (userData?.avatar && userData?.discord_id) {
      return `https://cdn.discordapp.com/avatars/${userData.discord_id}/${userData.avatar}.png`;
    }
    return undefined;
  };

  // Fall back to user_metadata for avatar if userData doesn't have it
  const fallbackAvatarUrl = () => {
    const metadata = user?.user_metadata;
    if (metadata?.avatar && metadata?.discord_id) {
      return `https://cdn.discordapp.com/avatars/${metadata.discord_id}/${metadata.avatar}.png`;
    }
    return undefined;
  };

  const username = userData?.discord_username || user?.user_metadata?.discord_username || "User";
  const avatarUrl = getAvatarUrl() || fallbackAvatarUrl();
  const isAuthenticated = !!user;

  return {
    user,
    session,
    userData,
    isLoading,
    username,
    avatarUrl,
    handleLogout,
    isAuthenticated
  };
};
