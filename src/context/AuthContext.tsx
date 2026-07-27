import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Profile, UserRole, License } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { supabaseService } from '../lib/supabaseService';

interface AuthContextType {
  user: Profile | null;
  isLoading: boolean;
  isDemoUser: boolean;
  activeLicense: License | null;
  isLicenseValid: boolean;
  refreshUserLicense: () => Promise<void>;
  signIn: (email: string, password?: string) => Promise<{ error?: string }>;
  signUp: (fullName: string, email: string, password?: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  updateProfile: (data: Partial<Profile>) => void;
  enableDemoMode: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Profile | null>(() => {
    const saved = localStorage.getItem('finance_user_profile');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDemoUser, setIsDemoUser] = useState<boolean>(false);
  const [activeLicense, setActiveLicense] = useState<License | null>(null);

  useEffect(() => {
    if (user) {
      localStorage.setItem('finance_user_profile', JSON.stringify(user));
    } else {
      localStorage.removeItem('finance_user_profile');
    }
  }, [user]);

  const refreshUserLicense = useCallback(async () => {
    if (user && isSupabaseConfigured) {
      const lic = await supabaseService.getUserActiveLicense(user.id);
      setActiveLicense(lic);
    }
  }, [user?.id]);

  useEffect(() => {
    async function initAuth() {
      if (isSupabaseConfigured && supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            setIsDemoUser(false);
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle();

            const profileObj: Profile = {
              id: session.user.id,
              full_name: profile?.full_name || session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Usuario',
              email: session.user.email || '',
              role: profile?.role || 'user',
              is_banned: profile?.is_banned || false,
              currency: profile?.currency || 'USD',
            };

            setUser(profileObj);

            // Fetch license
            const lic = await supabaseService.getUserActiveLicense(session.user.id);
            setActiveLicense(lic);
          }
        } catch (err) {
          console.error('Error al inicializar sesión de Supabase:', err);
        }
      }
      setIsLoading(false);
    }

    initAuth();

    if (isSupabaseConfigured && supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          setIsDemoUser(false);
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

          const profileObj: Profile = {
            id: session.user.id,
            full_name: profile?.full_name || session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Usuario',
            email: session.user.email || '',
            role: profile?.role || 'user',
            is_banned: profile?.is_banned || false,
            currency: 'USD',
          };

          setUser(profileObj);

          const lic = await supabaseService.getUserActiveLicense(session.user.id);
          setActiveLicense(lic);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setIsDemoUser(false);
          setActiveLicense(null);
        }
      });

      // Realtime License & Profile Status Channel for Immediate Revocation!
      const channel = supabase
        .channel('realtime_security_guard')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'licenses' },
          async () => {
            if (user) {
              const lic = await supabaseService.getUserActiveLicense(user.id);
              setActiveLicense(lic);
            }
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'profiles' },
          async (payload) => {
            if (user && payload.new.id === user.id) {
              setUser((prev) => (prev ? { ...prev, role: payload.new.role, is_banned: payload.new.is_banned } : null));
            }
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
        supabase.removeChannel(channel);
      };
    }
  }, [user?.id]);

  const signIn = async (email: string, password?: string): Promise<{ error?: string }> => {
    if (isSupabaseConfigured && supabase && password) {
      const { error, data } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: error.message };
      if (data.user) {
        setIsDemoUser(false);
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .maybeSingle();

        setUser({
          id: data.user.id,
          full_name: profile?.full_name || data.user.user_metadata?.full_name || email.split('@')[0],
          email: data.user.email || email,
          role: profile?.role || 'user',
          is_banned: profile?.is_banned || false,
          currency: 'USD',
        });

        const lic = await supabaseService.getUserActiveLicense(data.user.id);
        setActiveLicense(lic);
      }
      return {};
    }

    // Demo sign in
    setIsDemoUser(true);
    setUser({
      id: `demo-${Date.now()}`,
      full_name: email.split('@')[0] ? email.split('@')[0].toUpperCase() : 'Usuario Demo',
      email: email,
      role: 'user',
      currency: 'USD',
    });
    return {};
  };

  const signUp = async (fullName: string, email: string, password?: string): Promise<{ error?: string }> => {
    if (isSupabaseConfigured && supabase && password) {
      const { error, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      });
      if (error) return { error: error.message };
      if (data.user) {
        setIsDemoUser(false);
        setUser({
          id: data.user.id,
          full_name: fullName,
          email: email,
          role: 'user',
          currency: 'USD',
        });
      }
      return {};
    }

    // Demo sign up
    setIsDemoUser(true);
    setUser({
      id: `user-${Date.now()}`,
      full_name: fullName,
      email: email,
      role: 'user',
      currency: 'USD',
    });
    return {};
  };

  const signOut = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setIsDemoUser(false);
    setActiveLicense(null);
    localStorage.removeItem('finance_user_profile');
    localStorage.removeItem('finance_transactions');
    localStorage.removeItem('finance_budgets');
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; message: string }> => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) return { success: false, message: error.message };
      return { success: true, message: 'Se ha enviado un enlace de recuperación a tu correo electrónico.' };
    }
    return {
      success: true,
      message: 'Modo Demo: Correo de recuperación simulado a ' + email,
    };
  };

  const updateProfile = (data: Partial<Profile>) => {
    if (!user) return;
    const updated = { ...user, ...data, updated_at: new Date().toISOString() };
    setUser(updated);

    if (isSupabaseConfigured && supabase) {
      supabase.from('profiles').upsert({
        id: user.id,
        full_name: updated.full_name,
        currency: updated.currency,
        updated_at: new Date().toISOString(),
      });
    }
  };

  const enableDemoMode = () => {
    setIsDemoUser(true);
    setUser({
      id: 'demo-user-guest',
      full_name: 'Usuario Demo',
      email: 'invitado@upfunnel.com',
      role: 'user',
      currency: 'USD',
    });
  };

  // License Validity Check
  const isLicenseValid = Boolean(
    isDemoUser ||
      user?.role === 'superadmin' ||
      (activeLicense && activeLicense.status === 'active')
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isDemoUser,
        activeLicense,
        isLicenseValid,
        refreshUserLicense,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updateProfile,
        enableDemoMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
