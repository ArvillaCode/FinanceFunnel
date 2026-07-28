import { supabase } from './supabase';
import { Transaction, Category, Budget, License, Profile, LicenseDuration, LicenseStatus, AuditLog } from '../types';
import { generateLicenseKey, calculateLicenseExpiration } from './licenseUtils';

export function ensureValidUuid(id: string): string {
  if (!id) return '00000000-0000-4000-a000-000000000000';
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(id)) return id;

  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(12, '0');
  return `00000000-0000-4000-a000-${hex.slice(-12)}`;
}

export const supabaseService = {
  // --- TRANSACTIONS ---
  async getTransactions(userId: string): Promise<Transaction[]> {
    if (!supabase) return [];
    const validUserId = ensureValidUuid(userId);
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', validUserId)
      .order('transaction_date', { ascending: false });

    if (error) {
      console.error('Error al obtener transacciones de Supabase:', error.message);
      return [];
    }
    return (data as Transaction[]) || [];
  },

  async createTransaction(userId: string, tx: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>): Promise<Transaction | null> {
    if (!supabase) return null;
    const validUserId = ensureValidUuid(userId);
    const { data, error } = await supabase
      .from('transactions')
      .insert([
        {
          user_id: validUserId,
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

  async createBulkTransactions(
    userId: string,
    txs: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>[]
  ): Promise<Transaction[]> {
    if (!supabase) return [];
    const validUserId = ensureValidUuid(userId);
    const payload = txs.map((tx) => ({
      user_id: validUserId,
      type: tx.type,
      amount: tx.amount,
      description: tx.description,
      category_id: tx.category_id,
      transaction_date: tx.transaction_date,
      notes: tx.notes || null,
    }));

    const { data, error } = await supabase
      .from('transactions')
      .insert(payload)
      .select();

    if (error) {
      console.error('Error al crear transacciones masivas en Supabase:', error.message);
      throw error;
    }
    return (data as Transaction[]) || [];
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
    const validUserId = ensureValidUuid(userId);
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .or(`is_default.eq.true,user_id.eq.${validUserId}`);

    if (error) {
      console.error('Error al obtener categorías de Supabase:', error.message);
      return [];
    }
    return (data as Category[]) || [];
  },

  async createCategory(userId: string, cat: Omit<Category, 'id'>): Promise<Category | null> {
    if (!supabase) return null;
    const validUserId = ensureValidUuid(userId);
    const { data, error } = await supabase
      .from('categories')
      .insert([
        {
          user_id: validUserId,
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
    const validUserId = ensureValidUuid(userId);
    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', validUserId);

    if (error) {
      console.error('Error al obtener presupuestos de Supabase:', error.message);
      return [];
    }
    return (data as Budget[]) || [];
  },

  async upsertBudget(userId: string, categoryId: string | null, amount: number, month: number, year: number): Promise<Budget | null> {
    if (!supabase) return null;
    const validUserId = ensureValidUuid(userId);
    const { data, error } = await supabase
      .from('budgets')
      .upsert(
        [
          {
            user_id: validUserId,
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
    let remoteLicenses: License[] = [];
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('licenses')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          remoteLicenses = data as License[];
        }
      } catch (err) {
        console.warn('Error fetching remote licenses:', err);
      }
    }

    const saved = localStorage.getItem('local_licenses');
    const localLicenses: License[] = saved ? JSON.parse(saved) : [];

    const combinedMap = new Map<string, License>();
    localLicenses.forEach((l) => combinedMap.set(l.key_code, l));
    remoteLicenses.forEach((l) => combinedMap.set(l.key_code, l));

    return Array.from(combinedMap.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  },

  async createLicense(duration: LicenseDuration, adminUserId: string): Promise<License | null> {
    const keyCode = generateLicenseKey();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(adminUserId);

    const fallbackLic: License = {
      id: `lic-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      key_code: keyCode,
      duration: duration,
      status: 'unused',
      created_by: isUuid ? adminUserId : undefined,
      created_at: new Date().toISOString(),
    };

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('licenses')
          .insert([
            {
              key_code: keyCode,
              duration: duration,
              status: 'unused',
              created_by: isUuid ? adminUserId : null,
            },
          ])
          .select()
          .single();

        if (!error && data) {
          // Also mirror in local for fallback
          const saved = localStorage.getItem('local_licenses');
          const localList: License[] = saved ? JSON.parse(saved) : [];
          localStorage.setItem('local_licenses', JSON.stringify([data as License, ...localList]));
          return data as License;
        }
      } catch (err) {
        console.warn('Error al insertar en Supabase, usando respaldo local:', err);
      }
    }

    // Save to local storage for local demo/admin fallback
    const saved = localStorage.getItem('local_licenses');
    const localList: License[] = saved ? JSON.parse(saved) : [];
    const updated = [fallbackLic, ...localList];
    localStorage.setItem('local_licenses', JSON.stringify(updated));

    return fallbackLic;
  },

  async updateLicenseStatus(id: string, status: LicenseStatus): Promise<boolean> {
    // Local storage update
    const saved = localStorage.getItem('local_licenses');
    if (saved) {
      try {
        const localList: License[] = JSON.parse(saved);
        const updated = localList.map((l) => (l.id === id ? { ...l, status } : l));
        localStorage.setItem('local_licenses', JSON.stringify(updated));
      } catch {}
    }

    if (supabase) {
      try {
        await supabase.from('licenses').update({ status }).eq('id', id);
      } catch (err) {
        console.warn('Error al actualizar estado en Supabase:', err);
      }
    }

    return true;
  },

  async deleteLicense(id: string): Promise<boolean> {
    const saved = localStorage.getItem('local_licenses');
    if (saved) {
      try {
        const localList: License[] = JSON.parse(saved);
        const updated = localList.filter((l) => l.id !== id);
        localStorage.setItem('local_licenses', JSON.stringify(updated));
      } catch {}
    }

    if (supabase) {
      try {
        await supabase.from('licenses').delete().eq('id', id);
      } catch (err) {
        console.warn('Error al eliminar en Supabase:', err);
      }
    }

    return true;
  },

  async getUserActiveLicense(userId: string): Promise<License | null> {
    if (supabase) {
      try {
        const { data: userLicense } = await supabase
          .from('user_licenses')
          .select('license_id, licenses(*)')
          .eq('user_id', userId)
          .limit(1)
          .maybeSingle();

        if (userLicense) {
          const rawLic = (userLicense as any).licenses;
          if (rawLic) {
            if (rawLic.expires_at && new Date(rawLic.expires_at) < new Date() && rawLic.status === 'active') {
              await supabase.from('licenses').update({ status: 'expired' }).eq('id', rawLic.id);
              return { ...rawLic, status: 'expired' };
            }
            return rawLic as License;
          }
        }
      } catch (err) {
        console.warn('Error consultando licencia en Supabase:', err);
      }
    }

    // Check local fallback active license
    const savedActive = localStorage.getItem(`user_active_license_${userId}`);
    if (savedActive) {
      try {
        return JSON.parse(savedActive);
      } catch {}
    }

    return null;
  },

  async activateLicenseForKey(userId: string, keyCode: string): Promise<{ success: boolean; message: string; license?: License }> {
    const cleanKey = keyCode.trim().toUpperCase();

    // 1. Search in local licenses first
    const saved = localStorage.getItem('local_licenses');
    let localLic: License | null = null;
    let localList: License[] = [];

    if (saved) {
      try {
        localList = JSON.parse(saved);
        localLic = localList.find((l) => l.key_code === cleanKey) || null;
      } catch {}
    }

    // 2. Search in Supabase if not found locally
    let remoteLic: License | null = null;
    if (supabase && !localLic) {
      try {
        const { data } = await supabase
          .from('licenses')
          .select('*')
          .eq('key_code', cleanKey)
          .maybeSingle();
        if (data) remoteLic = data as License;
      } catch {}
    }

    const targetLicense = localLic || remoteLic;

    if (!targetLicense) {
      return { success: false, message: 'La clave de licencia ingresada no existe.' };
    }

    if (targetLicense.status === 'revoked') {
      return { success: false, message: 'Esta licencia ha sido revocada permanentemente por el administrador.' };
    }

    if (targetLicense.status === 'paused') {
      return { success: false, message: 'Esta licencia se encuentra pausada temporalmente por el administrador.' };
    }

    if (targetLicense.status === 'expired') {
      return { success: false, message: 'Esta licencia ha expirado. Por favor solicita una nueva.' };
    }

    const activatedAt = new Date().toISOString();
    const expiresAt = calculateLicenseExpiration(targetLicense.duration as LicenseDuration, new Date());

    const activatedLicense: License = {
      ...targetLicense,
      status: 'active',
      user_email: 'usuario@upfunnel.com',
      activated_at: activatedAt,
      expires_at: expiresAt,
    };

    // Update in local storage
    const updatedLocal = localList.map((l) => (l.key_code === cleanKey ? activatedLicense : l));
    if (!localLic) updatedLocal.unshift(activatedLicense);
    localStorage.setItem('local_licenses', JSON.stringify(updatedLocal));
    localStorage.setItem(`user_active_license_${userId}`, JSON.stringify(activatedLicense));

    // Update in Supabase
    if (supabase) {
      try {
        await supabase
          .from('licenses')
          .update({ status: 'active', activated_at: activatedAt, expires_at: expiresAt })
          .eq('id', targetLicense.id);

        if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
          await supabase
            .from('user_licenses')
            .upsert([{ user_id: userId, license_id: targetLicense.id }], { onConflict: 'user_id,license_id' });
        }
      } catch (err) {
        console.warn('Error actualizando activación en Supabase:', err);
      }
    }

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
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
      await supabase.from('audit_logs').insert([
        {
          user_id: isUuid ? userId : null,
          user_email: userEmail,
          action,
          details,
        },
      ]);
    } catch {}
  },
};
