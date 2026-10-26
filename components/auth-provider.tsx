'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
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
  signUp: async () => ({ error: 'not implemented', needsEmailVerification: false }) as any,
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

    if (data) {
      setProfile(data as Profile);
    } else {
      const { data: userData } = await supabase.auth.getUser();
      const fullName = userData?.user?.user_metadata?.full_name
        || userData?.user?.user_metadata?.name
        || '';
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert({ id: userId, full_name: fullName, user_type: 'worker' })
        .select('*')
        .maybeSingle();

      if (!insertError && newProfile) {
        setProfile(newProfile as Profile);
      }
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        (async () => {
          await fetchProfile(session.user.id);
          setLoading(false);
        })();
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        (async () => {
          await fetchProfile(newSession.user.id);

          if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
            const isEmailConfirmed = !!newSession.user.email_confirmed_at;
            if (isEmailConfirmed) {
              const { data: prof } = await supabase
                .from('profiles')
                .select('is_verified')
                .eq('id', newSession.user.id)
                .maybeSingle();
              if (prof && !prof.is_verified) {
                await supabase
                  .from('profiles')
                  .update({ is_verified: true, updated_at: new Date().toISOString() })
                  .eq('id', newSession.user.id);
                await fetchProfile(newSession.user.id);
              }
            }
          }
        })();
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
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
      options: { data: { full_name: fullName } },
    });
    if (error) return { error: error.message };
    if (data.user) {
      const onboarded = options?.skipOnboarding ? false : true;
      await supabase.from('profiles').insert({
        id: data.user.id,
        full_name: fullName,
        user_type: options?.userType || 'worker',
        farm_name: options?.farmName || null,
        city: options?.city || null,
        region: options?.region || null,
        latitude: options?.latitude ?? null,
        longitude: options?.longitude ?? null,
        preferred_regions: options?.preferredRegions?.length ? options.preferredRegions : null,
        preferred_jobs: options?.preferredJobs?.length ? options.preferredJobs : null,
        experience_level: options?.experienceLevel || null,
        primary_crops: options?.primaryCrops?.length ? options.primaryCrops : null,
        onboarded,
        is_verified: false,
        phone_verified: false,
      });
    }
    const needsVerification = data.user && !data.session ? true : false;
    return { error: null, needsEmailVerification: needsVerification };
  }, []);

  const signOut = useCallback(async () => {
    if (isSupabaseConfigured) await supabase.auth.signOut();
    setProfile(null);
    setSession(null);
  }, []);

  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    if (!session?.user) return { error: 'Not authenticated' };
    const { is_admin, is_moderator, is_banned, id, created_at, ...safeUpdates } = updates;
    const { error } = await supabase
      .from('profiles')
      .update({ ...safeUpdates, updated_at: new Date().toISOString() })
      .eq('id', session.user.id);
    if (error) return { error: error.message };
    setProfile((prev) => prev ? { ...prev, ...safeUpdates } : prev);
    return { error: null };
  }, [session]);

  const refreshProfile = useCallback(async () => {
    if (session?.user) await fetchProfile(session.user.id);
  }, [session, fetchProfile]);

  const sendPhoneOtp = useCallback(async (phone: string) => {
    if (!isSupabaseConfigured) return { error: 'Phone verification is not configured yet.' };

    // Accepts any phone number in international format (e.g., +90 5xx xxx xx xx).
    // To restrict to specific area codes only, validate the prefix here before sending:
    //   const allowed = ['+90', '+1', '+44'];
    //   if (!allowed.some(p => phone.startsWith(p))) return { error: 'Unsupported area code' };
    const { error } = await supabase.auth.signInWithOtp({ phone });
    return { error: error?.message || null };
  }, []);

  const verifyPhoneOtp = useCallback(async (phone: string, token: string) => {
    if (!isSupabaseConfigured) return { error: 'Phone verification is not configured yet.' };

    const { error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' });
    if (error) return { error: error.message };
    const userId = session?.user?.id;
    if (userId) {
      await supabase
        .from('profiles')
        .update({
          phone,
          phone_verified: true,
          is_verified: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);
      await fetchProfile(userId);
    }
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
