import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import supabase from '@/lib/supabaseClient.js';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null);
      return;
    }
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (!error && data) {
      setProfile(data);
    }
  }, []);

  const updateProfile = async (updates) => {
    if (!currentUser) return { success: false, error: 'Not authenticated' };
    const allowedFields = ['name', 'phone', 'country', 'city', 'age', 'gender', 'bio', 'avatar_url'];
    const safeUpdates = Object.fromEntries(
      allowedFields.filter(k => k in updates).map(k => [k, updates[k]])
    );
    safeUpdates.updated_at = new Date().toISOString();
    const { data, error } = await supabase
      .from('profiles')
      .update(safeUpdates)
      .eq('id', currentUser.id)
      .select()
      .single();
    if (error) return { success: false, error: error.message };
    setProfile(data);
    return { success: true };
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user ?? null;
      setCurrentUser(user);
      if (user) fetchProfile(user.id);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      setCurrentUser(user);
      if (user) {
        fetchProfile(user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const login = async (email, password) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const loginWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const signup = async (email, password) => {
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setProfile(null);
  };

  const value = {
    currentUser,
    profile,
    isAuthenticated: !!currentUser,
    isLoading,
    login,
    loginWithGoogle,
    signup,
    logout,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
