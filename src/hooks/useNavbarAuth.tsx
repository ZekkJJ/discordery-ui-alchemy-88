
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
      (event, newSession) => {
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
        console.error("Error fetching user data:", error);
        // Continue to try other methods
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
      
      // Finally, try to find by email as a last resort
      if (authUser?.user?.email) {
        console.log("Trying to find user by email:", authUser.user.email);
        
        const { data: emailData, error: emailError } = await supabase
          .from('users')
          .select('*')
          .eq('email', authUser.user.email)
          .maybeSingle();
          
        if (emailError) {
          console.error("Error fetching user data by email:", emailError);
        } else if (emailData) {
          console.log("User data found by email:", emailData);
          setUserData(emailData);
          setIsLoading(false);
          return;
        }
      }
      
      // Debug: Log user metadata and available users
      console.log("User metadata:", user?.user_metadata);
      
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
