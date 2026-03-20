import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import supabase from '@/lib/supabaseClient.js';
import { trackEvent, setUserProperties, setUserId } from '@/lib/analytics.js';

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
    const { error } = await supabase
      .from('profiles')
      .update(safeUpdates)
      .eq('id', currentUser.id);
    if (error) return { success: false, error: error.message };
    setProfile(prev => ({ ...prev, ...safeUpdates }));
    return { success: true };
  };

  const prevUserRef = useRef(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user ?? null;
      setCurrentUser(user);
      prevUserRef.current = user;
      if (user) {
        fetchProfile(user.id);
        setUserId(user.id);
        setUserProperties({
          auth_provider: user.app_metadata?.provider || 'email',
          is_member: true,
        });
      }
      setIsLoading(false);
    }).catch((err) => {
      console.error('Session fetch failed:', err);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const user = session?.user ?? null;
      const wasLoggedIn = !!prevUserRef.current;
      setCurrentUser(user);
      prevUserRef.current = user;

      if (user) {
        fetchProfile(user.id);
        const provider = user.app_metadata?.provider || 'email';
        setUserId(user.id);
        setUserProperties({ auth_provider: provider, is_member: true });

        if (event === 'SIGNED_IN' && !wasLoggedIn) {
          const isNewUser = user.created_at &&
            (Date.now() - new Date(user.created_at).getTime()) < 60000;
          trackEvent(isNewUser ? 'sign_up' : 'login', { method: provider });
        }
      } else {
        setProfile(null);
        setUserId(null);
        setUserProperties({ is_member: false });
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

  const loginWithGoogle = async (intendedRedirect) => {
    try {
      const callbackUrl = intendedRedirect
        ? window.location.origin + '/login?redirect=' + encodeURIComponent(intendedRedirect)
        : window.location.origin;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: callbackUrl },
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

  const value = useMemo(() => ({
    currentUser,
    profile,
    isAuthenticated: !!currentUser,
    isLoading,
    login,
    loginWithGoogle,
    signup,
    logout,
    updateProfile,
  }), [currentUser, profile, isLoading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
