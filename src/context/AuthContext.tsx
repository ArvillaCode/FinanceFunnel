import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Profile, UserRole, License } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { supabaseService } from '../lib/supabaseService';
import { tenantService } from '../lib/tenantService';
import { persistenceService } from '../lib/persistenceService';

const DEMO_EMAIL = 'invitado@upfunnel.com';

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

const buildProfileFromSession = (
  userId: string,
  userEmail: string,
  profile: any,
  fullNameFallback?: string
): Profile => ({
  id: userId,
  full_name: profile?.full_name || fullNameFallback || userEmail.split('@')[0] || 'Usuario',
  email: userEmail,
  role: (profile?.role as UserRole) || 'user',
  is_banned: profile?.is_banned || false,
  currency: profile?.currency || 'USD',
});

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
  const [isDemoUser, setIsDemoUser] = useState<boolean>(() => {
    return user ? user.email === DEMO_EMAIL : false;
  });
  const [activeLicense, setActiveLicense] = useState<License | null>(null);

  useEffect(() => {
    if (user && !isDemoUser) {
      localStorage.setItem('finance_user_profile', JSON.stringify(user));
      tenantService.initializeUserTenant(user, false);
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

  useEffect(() => {
    async function initAuth() {
      if (isSupabaseConfigured && supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            setIsDemoUser(false);
            const userEmail = session.user.email || '';

            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle();

            const profileObj = buildProfileFromSession(
              session.user.id,
              userEmail,
              profile,
              session.user.user_metadata?.full_name
            );

            setUser(profileObj);
            tenantService.initializeUserTenant(profileObj, false);

            const lic = await supabaseService.getUserActiveLicense(session.user.id);
            setActiveLicense(lic);
          } else {
            setUser(null);
            localStorage.removeItem('finance_user_profile');
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
          const userEmail = session.user.email || '';

          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

          const profileObj = buildProfileFromSession(
            session.user.id,
            userEmail,
            profile,
            session.user.user_metadata?.full_name
          );

          setUser(profileObj);
          tenantService.initializeUserTenant(profileObj, false);

          const lic = await supabaseService.getUserActiveLicense(session.user.id);
          setActiveLicense(lic);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setActiveLicense(null);
          localStorage.removeItem('finance_user_profile');
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

      if (data?.user) {
        setIsDemoUser(false);
        const userEmail = data.user.email || email;

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .maybeSingle();

        const profileObj = buildProfileFromSession(data.user.id, userEmail, profile);

        setUser(profileObj);
        localStorage.setItem('finance_user_profile', JSON.stringify(profileObj));
        tenantService.initializeUserTenant(profileObj, false);

        const lic = await supabaseService.getUserActiveLicense(data.user.id);
        setActiveLicense(lic);
        return {};
      }
    }

    if (!isSupabaseConfigured) {
      setIsDemoUser(true);
      const demoObj: Profile = {
        id: `demo-${Date.now()}`,
        full_name: 'Usuario Demo',
        email: DEMO_EMAIL,
        role: 'user',
        currency: 'USD',
      };
      setUser(demoObj);
      tenantService.initializeUserTenant(demoObj, true);
      return {};
    }

    return { error: 'Se requiere contraseña para iniciar sesión.' };
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
      if (data?.user) {
        setIsDemoUser(false);

        const profileObj: Profile = {
          id: data.user.id,
          full_name: fullName,
          email: email,
          role: 'user',
          currency: 'USD',
        };

        setUser(profileObj);
        localStorage.setItem('finance_user_profile', JSON.stringify(profileObj));
        tenantService.initializeUserTenant(profileObj, false);
        return {};
      }
    }

    if (!isSupabaseConfigured) {
      const profileObj: Profile = {
        id: `user-${Date.now()}`,
        full_name: fullName,
        email: email,
        role: 'user',
        currency: 'USD',
      };
      setUser(profileObj);
      localStorage.setItem('finance_user_profile', JSON.stringify(profileObj));
      tenantService.initializeUserTenant(profileObj, false);
      return {};
    }

    return { error: 'Se requiere contraseña para registrarse.' };
  };

  const signOut = async () => {
    const userId = user?.id;
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch {}
    }
    if (userId) {
      persistenceService.clearUserData(userId);
    }
    setUser(null);
    setIsDemoUser(false);
    setActiveLicense(null);
    localStorage.removeItem('finance_user_profile');
    localStorage.removeItem('finance_transactions');
    localStorage.removeItem('finance_budgets');
    localStorage.removeItem('finance_organizations');
    localStorage.removeItem('finance_org_members');
    localStorage.removeItem('finance_org_invitations');
    localStorage.removeItem('finance_current_org_id');
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; message: string }> => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) return { success: false, message: error.message };
      return { success: true, message: 'Se ha enviado un enlace de recuperación a tu correo electrónico.' };
    }
    return {
      success: true,
      message: 'Correo de recuperación enviado a ' + email,
    };
  };

  const updateProfile = (data: Partial<Profile>) => {
    if (!user) return;
    const updated = {
      ...user,
      ...data,
      updated_at: new Date().toISOString(),
    };
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
    const demoObj: Profile = {
      id: 'demo-user-guest',
      full_name: 'Usuario Demo',
      email: DEMO_EMAIL,
      role: 'user',
      currency: 'USD',
    };
    setUser(demoObj);
    tenantService.initializeUserTenant(demoObj, true);
  };

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
