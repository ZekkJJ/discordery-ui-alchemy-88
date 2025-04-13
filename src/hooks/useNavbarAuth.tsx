
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
      console.log("Auth user:", authUser);
      
      const userEmail = authUser?.user?.email;
      const userMetadata = authUser?.user?.user_metadata;
      
      console.log("User email:", userEmail);
      console.log("User metadata:", userMetadata);
      
      if (userMetadata?.discord_id) {
        const discordId = userMetadata.discord_id;
        console.log("Trying to find user by Discord ID from metadata:", discordId);
        
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('discord_id', discordId)
          .maybeSingle();
          
        if (error) {
          console.error("Error fetching user data by Discord ID from metadata:", error);
        } else if (data) {
          console.log("User data found by Discord ID from metadata:", data);
          setUserData(data);
          return;
        }
      }
      
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
      
      console.log("Available users in database:", allUsers);
      
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

  // If userData exists but avatar doesn't, try to get it from user_metadata
  const fallbackAvatarUrl = () => {
    if (userData && !userData.avatar && user?.user_metadata?.avatar) {
      return `https://cdn.discordapp.com/avatars/${user.user_metadata.discord_id}/${user.user_metadata.avatar}.png`;
    }
    return undefined;
  };

  const username = userData?.discord_username || user?.user_metadata?.discord_username || "User";
  const avatarUrl = getAvatarUrl() || fallbackAvatarUrl();

  return {
    user,
    session,
    userData,
    isLoading,
    username,
    avatarUrl,
    handleLogout,
    isAuthenticated: !!user || !!userData
  };
};
