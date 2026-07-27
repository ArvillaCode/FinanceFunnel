import { supabase } from './supabase';
import { Transaction, Category, Budget, License, Profile, LicenseDuration, LicenseStatus, AuditLog } from '../types';
import { generateLicenseKey, calculateLicenseExpiration } from './licenseUtils';

export const supabaseService = {
  // --- TRANSACTIONS ---
  async getTransactions(userId: string): Promise<Transaction[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('transaction_date', { ascending: false });

    if (error) {
      console.error('Error al obtener transacciones de Supabase:', error.message);
      throw error;
    }
    return (data as Transaction[]) || [];
  },

  async createTransaction(userId: string, tx: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>): Promise<Transaction | null> {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('transactions')
      .insert([
        {
          user_id: userId,
          type: tx.type,
          amount: tx.amount,
          description: tx.description,
          category_id: tx.category_id,
          transaction_date: tx.transaction_date,
          notes: tx.notes || null,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error al crear transacción en Supabase:', error.message);
      throw error;
    }
    return data as Transaction;
  },

  async updateTransaction(id: string, tx: Partial<Transaction>): Promise<Transaction | null> {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('transactions')
      .update({
        ...tx,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error al actualizar transacción en Supabase:', error.message);
      throw error;
    }
    return data as Transaction;
  },

  async deleteTransaction(id: string): Promise<boolean> {
    if (!supabase) return false;
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error al eliminar transacción en Supabase:', error.message);
      throw error;
    }
    return true;
  },

  // --- CATEGORIES ---
  async getCategories(userId: string): Promise<Category[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .or(`is_default.eq.true,user_id.eq.${userId}`);

    if (error) {
      console.error('Error al obtener categorías de Supabase:', error.message);
      throw error;
    }
    return (data as Category[]) || [];
  },

  async createCategory(userId: string, cat: Omit<Category, 'id'>): Promise<Category | null> {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('categories')
      .insert([
        {
          user_id: userId,
          name: cat.name,
          icon: cat.icon,
          color: cat.color,
          type: cat.type,
          is_default: false,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error al crear categoría en Supabase:', error.message);
      throw error;
    }
    return data as Category;
  },

  // --- BUDGETS ---
  async getBudgets(userId: string): Promise<Budget[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Error al obtener presupuestos de Supabase:', error.message);
      throw error;
    }
    return (data as Budget[]) || [];
  },

  async upsertBudget(userId: string, categoryId: string | null, amount: number, month: number, year: number): Promise<Budget | null> {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('budgets')
      .upsert(
        [
          {
            user_id: userId,
            category_id: categoryId,
            amount,
            month,
            year,
            updated_at: new Date().toISOString(),
          },
        ],
        { onConflict: 'user_id,category_id,month,year' }
      )
      .select()
      .single();

    if (error) {
      console.error('Error al guardar presupuesto en Supabase:', error.message);
      throw error;
    }
    return data as Budget;
  },

  // --- SAAS LICENSES (SUPERADMIN & USER) ---
  async getLicenses(): Promise<License[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('licenses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al obtener licencias:', error.message);
      return [];
    }
    return (data as License[]) || [];
  },

  async createLicense(duration: LicenseDuration, adminUserId: string): Promise<License | null> {
    if (!supabase) return null;
    const keyCode = generateLicenseKey();
    const { data, error } = await supabase
      .from('licenses')
      .insert([
        {
          key_code: keyCode,
          duration: duration,
          status: 'unused',
          created_by: adminUserId,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error al crear licencia en Supabase:', error.message);
      throw error;
    }
    return data as License;
  },

  async updateLicenseStatus(id: string, status: LicenseStatus): Promise<boolean> {
    if (!supabase) return false;
    const { error } = await supabase
      .from('licenses')
      .update({ status })
      .eq('id', id);

    if (error) {
      console.error('Error al actualizar estado de licencia:', error.message);
      throw error;
    }
    return true;
  },

  async deleteLicense(id: string): Promise<boolean> {
    if (!supabase) return false;
    const { error } = await supabase
      .from('licenses')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error al eliminar licencia:', error.message);
      throw error;
    }
    return true;
  },

  async getUserActiveLicense(userId: string): Promise<License | null> {
    if (!supabase) return null;
    const { data: userLicense, error: ulError } = await supabase
      .from('user_licenses')
      .select('license_id, licenses(*)')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle();

    if (ulError || !userLicense) return null;
    const rawLic = (userLicense as any).licenses;
    if (!rawLic) return null;

    // Auto check expiration
    if (rawLic.expires_at && new Date(rawLic.expires_at) < new Date() && rawLic.status === 'active') {
      await supabase.from('licenses').update({ status: 'expired' }).eq('id', rawLic.id);
      return { ...rawLic, status: 'expired' };
    }

    return rawLic as License;
  },

  async activateLicenseForKey(userId: string, keyCode: string): Promise<{ success: boolean; message: string; license?: License }> {
    if (!supabase) return { success: false, message: 'Supabase no está configurado.' };

    const cleanKey = keyCode.trim().toUpperCase();

    // 1. Find license by key_code
    const { data: license, error: lError } = await supabase
      .from('licenses')
      .select('*')
      .eq('key_code', cleanKey)
      .maybeSingle();

    if (lError || !license) {
      return { success: false, message: 'La clave de licencia ingresada no existe.' };
    }

    if (license.status === 'revoked') {
      return { success: false, message: 'Esta licencia ha sido revocada permanentemente por el administrador.' };
    }

    if (license.status === 'paused') {
      return { success: false, message: 'Esta licencia se encuentra pausada temporalmente por el administrador.' };
    }

    if (license.status === 'expired') {
      return { success: false, message: 'Esta licencia ha expirado. Por favor solicita una nueva.' };
    }

    const activatedAt = new Date().toISOString();
    const expiresAt = calculateLicenseExpiration(license.duration as LicenseDuration, new Date());

    // 2. Update license status to active
    const { error: updateError } = await supabase
      .from('licenses')
      .update({
        status: 'active',
        activated_at: activatedAt,
        expires_at: expiresAt,
      })
      .eq('id', license.id);

    if (updateError) {
      return { success: false, message: 'Error al activar la licencia: ' + updateError.message };
    }

    // 3. Link user to license
    const { error: linkError } = await supabase
      .from('user_licenses')
      .upsert([{ user_id: userId, license_id: license.id }], { onConflict: 'user_id,license_id' });

    if (linkError) {
      return { success: false, message: 'Error al vincular la licencia con tu cuenta: ' + linkError.message };
    }

    const activatedLicense: License = {
      ...license,
      status: 'active',
      activated_at: activatedAt,
      expires_at: expiresAt,
    };

    return {
      success: true,
      message: '¡Licencia activada con éxito!',
      license: activatedLicense,
    };
  },

  // --- PROFILES / PROMOTION (SUPERADMIN) ---
  async getProfiles(): Promise<Profile[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al obtener perfiles:', error.message);
      return [];
    }
    return (data as Profile[]) || [];
  },

  async updateUserRole(userId: string, role: 'user' | 'superadmin'): Promise<boolean> {
    if (!supabase) return false;
    const { error } = await supabase
      .from('profiles')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) {
      console.error('Error al actualizar rol de usuario:', error.message);
      throw error;
    }
    return true;
  },

  async toggleUserBan(userId: string, isBanned: boolean): Promise<boolean> {
    if (!supabase) return false;
    const { error } = await supabase
      .from('profiles')
      .update({ is_banned: isBanned, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) {
      console.error('Error al cambiar estado de baneo:', error.message);
      throw error;
    }
    return true;
  },

  // --- AUDIT LOGS ---
  async getAuditLogs(): Promise<AuditLog[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error al obtener registros de auditoría:', error.message);
      return [];
    }
    return (data as AuditLog[]) || [];
  },

  async addAuditLog(userId: string, userEmail: string, action: string, details?: string): Promise<void> {
    if (!supabase) return;
    await supabase.from('audit_logs').insert([
      {
        user_id: userId,
        user_email: userEmail,
        action,
        details,
      },
    ]);
  },
};
