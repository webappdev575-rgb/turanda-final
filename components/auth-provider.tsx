'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import type { Session, User } from '@supabase/supabase-js';

export interface Profile {
  id: string;
  full_name: string | null;
  user_type: 'worker' | 'farmer' | 'business';
  city: string | null;
  region: string | null;
  latitude: number | null;
  longitude: number | null;
  is_admin?: boolean;
  is_moderator?: boolean;
  is_editor?: boolean;
  is_banned?: boolean;
  preferred_language?: 'tr' | 'en' | 'ar';
  notification_email?: string | null;
  onboarded?: boolean;
  farm_name?: string | null;
  preferred_regions?: string[] | null;
  preferred_jobs?: string[] | null;
  experience_level?: string | null;
  primary_crops?: string[] | null;
  created_at?: string;
  phone?: string | null;
  phone_verified?: boolean;
  is_verified?: boolean;
  weather_location?: string | null;
  email_message_notifications?: boolean;
  message_notification_email?: string | null;
  employer_message?: string | null;
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isGoogleUser: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    options?: {
      userType?: 'worker' | 'farmer' | 'business';
      farmName?: string;
      city?: string;
      region?: string;
      latitude?: number;
      longitude?: number;
      preferredRegions?: string[];
      preferredJobs?: string[];
      experienceLevel?: string;
      primaryCrops?: string[];
      skipOnboarding?: boolean;
    },
  ) => Promise<{ error: string | null; needsEmailVerification?: boolean }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: string | null }>;
  refreshProfile: () => Promise<void>;
  sendPhoneOtp: (phone: string) => Promise<{ error: string | null }>;
  verifyPhoneOtp: (phone: string, token: string) => Promise<{ error: string | null }>;
  resendEmailVerification: (email: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  isGoogleUser: false,
  signIn: async () => ({ error: 'not implemented' }),
  signInWithGoogle: async () => ({ error: 'not implemented' }),
  signUp: async () => ({ error: 'not implemented', needsEmailVerification: false }),
  signOut: async () => {},
  updateProfile: async () => ({ error: 'not implemented' }),
  refreshProfile: async () => {},
  sendPhoneOtp: async () => ({ error: 'not implemented' }),
  verifyPhoneOtp: async () => ({ error: 'not implemented' }),
  resendEmailVerification: async () => ({ error: 'not implemented' }),
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const activeUserId = useRef<string | null>(null);

  const isGoogleUser = !!(session?.user?.app_metadata?.provider === 'google');

  const fetchProfile = useCallback(async (userId: string) => {
    if (!isSupabaseConfigured) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Profile fetch error:', error.message);
      return;
    }

    if (activeUserId.current !== userId) return;
    if (data) {
      setProfile(data as Profile);
    } else {
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user?.id !== userId || activeUserId.current !== userId) return;
      const metadata = userData.user.user_metadata;
      const fullName = userData?.user?.user_metadata?.full_name
        || userData?.user?.user_metadata?.name
        || '';
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          full_name: fullName,
          user_type: metadata.user_type || 'worker',
          farm_name: metadata.farm_name || null,
          city: metadata.city || null,
          region: metadata.region || null,
          latitude: metadata.latitude ?? null,
          longitude: metadata.longitude ?? null,
          preferred_regions: metadata.preferred_regions || null,
          preferred_jobs: metadata.preferred_jobs || null,
          experience_level: metadata.experience_level || null,
          primary_crops: metadata.primary_crops || null,
          onboarded: metadata.onboarded === true,
        })
        .select('*')
        .maybeSingle();

      if (activeUserId.current !== userId) return;
      if (!insertError && newProfile) {
        setProfile(newProfile as Profile);
      } else if (insertError?.code === '23505') {
        // Another auth event may have created the same profile first.
        await fetchProfile(userId);
      }
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    let disposed = false;
    let authEventReceived = false;
    const timers = new Set<ReturnType<typeof setTimeout>>();

    const loadSession = async (nextSession: Session | null) => {
      if (disposed) return;
      const nextId = nextSession?.user.id ?? null;
      if (activeUserId.current !== nextId) setProfile(null);
      activeUserId.current = nextId;
      setSession(nextSession);
      try {
        if (nextId) {
          if (nextSession?.user.email_confirmed_at) {
            // The database derives the verified flag from Auth; clients cannot set it.
            await supabase.from('profiles').update({ updated_at: new Date().toISOString() }).eq('id', nextId);
          }
          if (!disposed && activeUserId.current === nextId) await fetchProfile(nextId);
        }
      } catch (error) {
        console.error('Profile load failed:', error instanceof Error ? error.message : 'Unknown error');
      } finally {
        if (!disposed && activeUserId.current === nextId) setLoading(false);
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!authEventReceived) void loadSession(session);
    }).catch(() => { if (!disposed) setLoading(false); });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      authEventReceived = true;
      // Supabase holds an auth lock during callbacks. Defer requests until it releases.
      const nextId = newSession?.user.id ?? null;
      if (activeUserId.current !== nextId) {
        setProfile(null);
        setLoading(Boolean(nextId));
      }
      activeUserId.current = nextId;
      setSession(newSession);
      const timer = setTimeout(() => {
        timers.delete(timer);
        if (activeUserId.current === nextId) void loadSession(newSession);
      }, 0);
      timers.add(timer);
    });

    return () => {
      disposed = true;
      activeUserId.current = null;
      timers.forEach(clearTimeout);
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!isSupabaseConfigured) return { error: 'Authentication is not configured yet.' };

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message || null };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (!isSupabaseConfigured) return { error: 'Authentication is not configured yet.' };

    const redirectTo = `${window.location.origin}/auth/callback`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
    return { error: error?.message || null };
  }, []);

  const signUp = useCallback(async (
    email: string,
    password: string,
    fullName: string,
    options?: {
      userType?: 'worker' | 'farmer' | 'business';
      farmName?: string;
      city?: string;
      region?: string;
      latitude?: number;
      longitude?: number;
      preferredRegions?: string[];
      preferredJobs?: string[];
      experienceLevel?: string;
      primaryCrops?: string[];
      skipOnboarding?: boolean;
    },
  ) => {
    if (!isSupabaseConfigured) return { error: 'Authentication is not configured yet.' };

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: {
        full_name: fullName,
        user_type: options?.userType || 'worker',
        farm_name: options?.farmName || null,
        city: options?.city || null,
        region: options?.region || null,
        latitude: options?.latitude ?? null,
        longitude: options?.longitude ?? null,
        preferred_regions: options?.preferredRegions || null,
        preferred_jobs: options?.preferredJobs || null,
        experience_level: options?.experienceLevel || null,
        primary_crops: options?.primaryCrops || null,
        onboarded: !options?.skipOnboarding,
      } },
    });
    if (error) return { error: error.message };
    const needsVerification = data.user && !data.session ? true : false;
    return { error: null, needsEmailVerification: needsVerification };
  }, []);

  const signOut = useCallback(async () => {
    if (isSupabaseConfigured) await supabase.auth.signOut();
    activeUserId.current = null;
    setProfile(null);
    setSession(null);
  }, []);

  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    if (!session?.user) return { error: 'Not authenticated' };
    const { is_admin, is_moderator, is_editor, is_banned, is_verified, phone_verified, id, created_at, ...safeUpdates } = updates;
    const { error } = await supabase
      .from('profiles')
      .update({ ...safeUpdates, updated_at: new Date().toISOString() })
      .eq('id', session.user.id);
    if (error) return { error: error.message };
    await fetchProfile(session.user.id);
    return { error: null };
  }, [session, fetchProfile]);

  const refreshProfile = useCallback(async () => {
    if (session?.user) await fetchProfile(session.user.id);
  }, [session, fetchProfile]);

  const sendPhoneOtp = useCallback(async (phone: string) => {
    if (!isSupabaseConfigured) return { error: 'Phone verification is not configured yet.' };

    const { data, error } = await supabase.functions.invoke('send-phone-otp', {
      body: { action: 'send', phone },
    });
    return { error: error?.message || data?.error || null };
  }, []);

  const verifyPhoneOtp = useCallback(async (phone: string, token: string) => {
    if (!session?.user) return { error: 'Not authenticated' };
    const { data, error } = await supabase.functions.invoke('send-phone-otp', {
      body: { action: 'verify', phone, code: token },
    });
    if (error || !data?.verified) return { error: error?.message || data?.error || 'Verification failed' };
    await fetchProfile(session.user.id);
    return { error: null };
  }, [session, fetchProfile]);

  const resendEmailVerification = useCallback(async (email: string) => {
    if (!isSupabaseConfigured) return { error: 'Email verification is not configured yet.' };

    const { error } = await supabase.auth.resend({ type: 'signup', email });
    return { error: error?.message || null };
  }, []);

  return (
    <AuthContext.Provider value={{
      session, user: session?.user || null, profile, loading, isGoogleUser,
      signIn, signInWithGoogle, signUp, signOut, updateProfile, refreshProfile,
      sendPhoneOtp, verifyPhoneOtp, resendEmailVerification,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
