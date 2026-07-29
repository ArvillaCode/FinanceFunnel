import { supabase } from './supabase';
import { Transaction, Category, Budget, License, Profile, LicenseDuration, LicenseStatus, AuditLog } from '../types';
import { generateLicenseKey } from './licenseUtils';

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
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('licenses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(`No se pudieron cargar las licencias: ${error.message}`);
    return (data as License[]) || [];
  },

  async createLicense(duration: LicenseDuration, adminUserId: string): Promise<License> {
    if (!supabase) {
      throw new Error('Supabase no está configurado. La licencia no fue creada.');
    }

    const keyCode = generateLicenseKey();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(adminUserId);
    if (!isUuid) throw new Error('Se requiere una sesión real de SuperAdmin para crear licencias.');

    const { data, error } = await supabase
      .from('licenses')
      .insert([{ key_code: keyCode, duration, status: 'unused', created_by: adminUserId }])
      .select()
      .single();

    if (error || !data) {
      throw new Error(`La licencia no se guardó en Supabase: ${error?.message || 'respuesta vacía'}`);
    }
    return data as License;
  },

  async updateLicenseStatus(id: string, status: LicenseStatus): Promise<boolean> {
    if (!supabase) throw new Error('Supabase no está configurado.');
    const { error } = await supabase.from('licenses').update({ status }).eq('id', id);
    if (error) throw new Error(`No se pudo actualizar la licencia: ${error.message}`);
    return true;
  },

  async deleteLicense(id: string): Promise<boolean> {
    if (!supabase) throw new Error('Supabase no está configurado.');
    const { error } = await supabase.from('licenses').delete().eq('id', id);
    if (error) throw new Error(`No se pudo eliminar la licencia: ${error.message}`);
    return true;
  },

  async getUserActiveLicense(userId: string): Promise<License | null> {
    if (supabase) {
      try {
        const { data, error } = await supabase.rpc('get_user_active_license', {
          p_user_id: userId,
        });

        if (error) {
          console.warn('Error consultando licencia vía RPC:', error.message);
        }

        if (data && Array.isArray(data) && data.length > 0) {
          const lic = data[0] as License;
          if (lic.expires_at && new Date(lic.expires_at) < new Date() && lic.status === 'active') {
            await supabase.from('licenses').update({ status: 'expired' }).eq('id', lic.id);
            return { ...lic, status: 'expired' };
          }
          localStorage.setItem(`user_active_license_${userId}`, JSON.stringify(lic));
          return lic;
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

  async activateLicenseForKey(userId: string, keyCode: string, userEmail?: string): Promise<{ success: boolean; message: string; license?: License }> {
    const cleanKey = keyCode.trim().toUpperCase();
    if (!supabase) {
      return { success: false, message: 'No hay conexión con el servidor de licencias.' };
    }
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
      return { success: false, message: 'Debes iniciar una sesión válida antes de activar la licencia.' };
    }

    const { data, error } = await supabase.rpc('activate_license', {
      license_key: cleanKey,
      activating_email: userEmail || null,
    });

    if (error) {
      const knownMessage = error.message.replace(/^.*ACTIVATION_ERROR:\s*/, '');
      return { success: false, message: knownMessage || 'No fue posible validar la licencia.' };
    }

    const activatedLicense = (Array.isArray(data) ? data[0] : data) as License | undefined;
    if (!activatedLicense) {
      return { success: false, message: 'El servidor no devolvió la licencia activada.' };
    }

    localStorage.setItem(`user_active_license_${userId}`, JSON.stringify(activatedLicense));
    return { success: true, message: '¡Licencia activada con éxito!', license: activatedLicense };
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
