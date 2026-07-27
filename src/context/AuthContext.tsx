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

const SUPERADMIN_EMAILS = ['gabriel.au2023@gmail.com'];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Profile | null>(() => {
    const saved = localStorage.getItem('finance_user_profile');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed;
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
    if (user && !isDemoUser) {
      localStorage.setItem('finance_user_profile', JSON.stringify(user));
    } else if (!user) {
      localStorage.removeItem('finance_user_profile');
    }
  }, [user, isDemoUser]);

  const refreshUserLicense = useCallback(async () => {
    if (user && !isDemoUser && isSupabaseConfigured) {
      const lic = await supabaseService.getUserActiveLicense(user.id);
      setActiveLicense(lic);
    }
  }, [user?.id, isDemoUser]);

  const resolveRole = (email?: string, dbRole?: UserRole): UserRole => {
    if (email && SUPERADMIN_EMAILS.includes(email.toLowerCase())) {
      return 'superadmin';
    }
    return dbRole || 'user';
  };

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

            const userEmail = session.user.email || '';
            const userRole = resolveRole(userEmail, profile?.role);

            if (userRole === 'superadmin' && profile?.role !== 'superadmin') {
              supabase.from('profiles').update({ role: 'superadmin' }).eq('id', session.user.id);
            }

            const profileObj: Profile = {
              id: session.user.id,
              full_name: profile?.full_name || session.user.user_metadata?.full_name || userEmail.split('@')[0] || 'Usuario',
              email: userEmail,
              role: userRole,
              is_banned: profile?.is_banned || false,
              currency: profile?.currency || 'USD',
            };

            setUser(profileObj);

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

          const userEmail = session.user.email || '';
          const userRole = resolveRole(userEmail, profile?.role);

          const profileObj: Profile = {
            id: session.user.id,
            full_name: profile?.full_name || session.user.user_metadata?.full_name || userEmail.split('@')[0] || 'Usuario',
            email: userEmail,
            role: userRole,
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

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

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

        const userEmail = data.user.email || email;
        const userRole = resolveRole(userEmail, profile?.role);

        setUser({
          id: data.user.id,
          full_name: profile?.full_name || data.user.user_metadata?.full_name || email.split('@')[0],
          email: userEmail,
          role: userRole,
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
      full_name: 'Usuario Demo',
      email: 'invitado@upfunnel.com',
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
        const userRole = resolveRole(email, 'user');

        setUser({
          id: data.user.id,
          full_name: fullName,
          email: email,
          role: userRole,
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

    if (!isDemoUser && isSupabaseConfigured && supabase) {
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

  // License Validity Check (Demo mode and SuperAdmin bypass)
  const isLicenseValid = Boolean(
    isDemoUser ||
      (user?.role === 'superadmin' && !isDemoUser) ||
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
