import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState(false);
  const mountedRef = useRef(true);
  const profileFetchRef = useRef(false); // Prevent duplicate fetches

  // Fetch profile with retry logic
  const fetchProfile = async (userId, retries = 2) => {
    if (profileFetchRef.current) return null; // Already fetching
    profileFetchRef.current = true;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) throw error;

        if (mountedRef.current) {
          setProfile(data);
          setProfileError(false);
        }
        profileFetchRef.current = false;
        return data;
      } catch (err) {
        console.error(`Profile fetch attempt ${attempt + 1} failed:`, err);
        if (attempt < retries) {
          // Wait before retry (500ms, then 1000ms)
          await new Promise(r => setTimeout(r, (attempt + 1) * 500));
        }
      }
    }

    // All retries failed
    if (mountedRef.current) {
      setProfile(null);
      setProfileError(true);
    }
    profileFetchRef.current = false;
    return null;
  };

  useEffect(() => {
    mountedRef.current = true;

    // Single source of truth: onAuthStateChange handles everything
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mountedRef.current) return;

        if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          setProfileError(false);
          setLoading(false);
          return;
        }

        if (session?.user) {
          setUser(session.user);

          // Defer profile fetch to next tick to avoid Supabase RLS deadlock
          // (the auth token needs to be fully set before making authenticated requests)
          setTimeout(async () => {
            if (!mountedRef.current) return;
            await fetchProfile(session.user.id);
            if (mountedRef.current) {
              setLoading(false);
            }
          }, 0);
        } else {
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      }
    );

    // Safety timeout: never stay loading for more than 8 seconds
    const safetyTimer = setTimeout(() => {
      if (mountedRef.current && loading) {
        console.warn('Auth safety timeout reached - forcing loading=false');
        setLoading(false);
      }
    }, 8000);

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
      clearTimeout(safetyTimer);
    };
  }, []);

  // Sign up with email and password
  const signUp = async (email, password, fullName, role = 'student') => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role,
        },
      },
    });

    if (error) throw error;
    return data;
  };

  // Sign in
  const signIn = async (email, password) => {
    setProfileError(false);
    profileFetchRef.current = false; // Reset fetch lock
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  };

  // Sign out
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    setProfile(null);
    setProfileError(false);
  };

  // Retry profile fetch manually (for error recovery UI)
  const retryProfile = async () => {
    if (!user) return;
    setProfileError(false);
    profileFetchRef.current = false;
    await fetchProfile(user.id);
  };

  const value = {
    user,
    profile,
    loading,
    profileError,
    signUp,
    signIn,
    signOut,
    retryProfile,
    isAdmin: profile?.role === 'admin',
    isDoctor: profile?.role === 'doctor',
    isStudent: profile?.role === 'student',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
