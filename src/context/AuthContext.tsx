import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthContextType {
  user: Profile | null;
  isLoading: boolean;
  isDemoUser: boolean;
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

  useEffect(() => {
    if (user) {
      localStorage.setItem('finance_user_profile', JSON.stringify(user));
    } else {
      localStorage.removeItem('finance_user_profile');
    }
  }, [user]);

  // Listener para sincronización en tiempo real de la sesión de Supabase
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

            setUser({
              id: session.user.id,
              full_name: profile?.full_name || session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Usuario',
              email: session.user.email || '',
              currency: profile?.currency || 'USD',
            });
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
          setUser({
            id: session.user.id,
            full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Usuario',
            email: session.user.email || '',
            currency: 'USD',
          });
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setIsDemoUser(false);
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
        setUser({
          id: data.user.id,
          full_name: data.user.user_metadata?.full_name || email.split('@')[0],
          email: data.user.email || email,
          currency: 'USD',
        });
      }
      return {};
    }

    // Login en modo demo si no hay Supabase configurado
    setIsDemoUser(true);
    setUser({
      id: `demo-${Date.now()}`,
      full_name: email.split('@')[0] ? email.split('@')[0].toUpperCase() : 'Usuario Demo',
      email: email,
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
          currency: 'USD',
        });
      }
      return {};
    }

    // Registro en modo local
    setIsDemoUser(true);
    setUser({
      id: `user-${Date.now()}`,
      full_name: fullName,
      email: email,
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
      currency: 'USD',
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isDemoUser,
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
