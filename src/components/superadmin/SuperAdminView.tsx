import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabaseService } from '../../lib/supabaseService';
import { License, Profile, LicenseDuration, LicenseStatus, AuditLog } from '../../types';
import { getDurationLabel, getStatusBadgeLabel } from '../../lib/licenseUtils';
import { formatDate } from '../../lib/utils';
import { Modal } from '../ui/Modal';
import {
  ShieldCheck,
  KeyRound,
  Users,
  Plus,
  Copy,
  Check,
  Pause,
  Play,
  Slash,
  Trash2,
  Sparkles,
  Search,
  Activity,
  UserCheck,
  UserX,
  ShieldAlert,
} from 'lucide-react';

export const SuperAdminView: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'licenses' | 'users' | 'audit'>('licenses');

  // Data states
  const [licenses, setLicenses] = useState<License[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [selectedDuration, setSelectedDuration] = useState<LicenseDuration>('1_month');
  const [createdLicense, setCreatedLicense] = useState<License | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Filter & Search states
  const [licenseSearch, setLicenseSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [userSearch, setUserSearch] = useState<string>('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [lData, pData, aData] = await Promise.all([
        supabaseService.getLicenses(),
        supabaseService.getProfiles(),
        supabaseService.getAuditLogs(),
      ]);
      setLicenses(lData);
      setProfiles(pData);
      setAuditLogs(aData);
    } catch (err) {
      console.error('Error al cargar datos del SuperAdmin:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const newLicense = await supabaseService.createLicense(selectedDuration, user.id);
      if (newLicense) {
        setCreatedLicense(newLicense);
        await supabaseService.addAuditLog(
          user.id,
          user.email,
          'GENERAR_LICENCIA',
          `Generada licencia de ${getDurationLabel(selectedDuration)} (Clave: ${newLicense.key_code})`
        );
        await loadData();
      }
    } catch (err: any) {
      alert('Error al generar licencia: ' + err.message);
    }
  };

  const handleStatusChange = async (licenseId: string, newStatus: LicenseStatus, keyCode: string) => {
    if (!user) return;
    try {
      await supabaseService.updateLicenseStatus(licenseId, newStatus);
      await supabaseService.addAuditLog(
        user.id,
        user.email,
        'CAMBIO_ESTADO_LICENCIA',
        `Licencia ${keyCode} cambiada a estado: ${newStatus}`
      );
      await loadData();
    } catch (err: any) {
      alert('Error al actualizar licencia: ' + err.message);
    }
  };

  const handleDeleteLicense = async (licenseId: string, keyCode: string) => {
    if (!user) return;
    if (!confirm(`¿Eliminar permanentemente la licencia ${keyCode}?`)) return;

    try {
      await supabaseService.deleteLicense(licenseId);
      await supabaseService.addAuditLog(
        user.id,
        user.email,
        'ELIMINAR_LICENCIA',
        `Eliminada licencia ${keyCode}`
      );
      await loadData();
    } catch (err: any) {
      alert('Error al eliminar licencia: ' + err.message);
    }
  };

  const handleToggleRole = async (targetUser: Profile) => {
    if (!user) return;
    const newRole = targetUser.role === 'superadmin' ? 'user' : 'superadmin';
    if (!confirm(`¿Cambiar el rol de ${targetUser.email} a "${newRole}"?`)) return;

    try {
      await supabaseService.updateUserRole(targetUser.id, newRole);
      await supabaseService.addAuditLog(
        user.id,
        user.email,
        'CAMBIO_ROL_USUARIO',
        `Cambiado rol de ${targetUser.email} a ${newRole}`
      );
      await loadData();
    } catch (err: any) {
      alert('Error al actualizar rol: ' + err.message);
    }
  };

  const handleToggleBan = async (targetUser: Profile) => {
    if (!user) return;
    const newBanState = !targetUser.is_banned;
    if (!confirm(`¿${newBanState ? 'Banear' : 'Desbanear'} a ${targetUser.email}?`)) return;

    try {
      await supabaseService.toggleUserBan(targetUser.id, newBanState);
      await supabaseService.addAuditLog(
        user.id,
        user.email,
        'BANEO_USUARIO',
        `${newBanState ? 'Baneado' : 'Desbaneado'} usuario ${targetUser.email}`
      );
      await loadData();
    } catch (err: any) {
      alert('Error al cambiar baneo de usuario: ' + err.message);
    }
  };

  const copyToClipboard = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // KPIs
  const activeCount = licenses.filter((l) => l.status === 'active').length;
  const unusedCount = licenses.filter((l) => l.status === 'unused').length;
  const pausedCount = licenses.filter((l) => l.status === 'paused' || l.status === 'revoked').length;

  // Filtered Licenses
  const filteredLicenses = licenses.filter((l) => {
    if (statusFilter !== 'all' && l.status !== statusFilter) return false;
    if (licenseSearch) {
      const q = licenseSearch.toLowerCase();
      return l.key_code.toLowerCase().includes(q) || (l.user_email && l.user_email.toLowerCase().includes(q));
    }
    return true;
  });

  // Filtered Users
  const filteredUsers = profiles.filter((p) => {
    if (userSearch) {
      const q = userSearch.toLowerCase();
      return p.email.toLowerCase().includes(q) || p.full_name.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/40 text-xs font-extrabold uppercase tracking-wider uf-glow-sm">
              SUPERADMIN COMMAND CENTER
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-[#FFFFFF] mt-1">
            Gestión Global de Licencias y Usuarios
          </h2>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Genera, pausa, revoca o elimina licencias de 1, 3, 6 meses y 1 año con efecto inmediato en vivo
          </p>
        </div>

        <button
          onClick={() => {
            setCreatedLicense(null);
            setIsCreateModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#00E5FF] hover:bg-[#00E5FF]/90 text-[#080C14] text-xs font-black tracking-wide uppercase transition-all shadow-md uf-glow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Generar Nueva Licencia</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#080C14] border border-[#94A3B8]/20 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-[#94A3B8] uppercase">Total Licencias</span>
            <h3 className="text-2xl font-black text-[#FFFFFF] mt-0.5">{licenses.length}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#00E5FF]/10 border border-[#00E5FF]/40 text-[#00E5FF] flex items-center justify-center uf-glow-sm">
            <KeyRound className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#080C14] border border-[#94A3B8]/20 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-[#94A3B8] uppercase">Licencias Activas</span>
            <h3 className="text-2xl font-black text-[#00E5FF] mt-0.5">{activeCount}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#00E5FF]/10 border border-[#00E5FF]/40 text-[#00E5FF] flex items-center justify-center uf-glow-sm">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#080C14] border border-[#94A3B8]/20 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-[#94A3B8] uppercase">Disponibles</span>
            <h3 className="text-2xl font-black text-[#FFFFFF] mt-0.5">{unusedCount}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#94A3B8]/10 border border-[#94A3B8]/30 text-[#94A3B8] flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#080C14] border border-[#94A3B8]/20 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-[#94A3B8] uppercase">Usuarios Totales</span>
            <h3 className="text-2xl font-black text-[#FFFFFF] mt-0.5">{profiles.length}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#080C14] border border-[#00E5FF]/30 text-[#00E5FF] flex items-center justify-center uf-glow-sm">
            <Users className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-[#94A3B8]/20 pb-2">
        <button
          onClick={() => setActiveTab('licenses')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'licenses'
              ? 'bg-[#00E5FF] text-[#080C14] uf-glow-sm'
              : 'text-[#94A3B8] hover:text-[#FFFFFF] hover:bg-[#94A3B8]/10'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>Licencias SaaS ({licenses.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'users'
              ? 'bg-[#00E5FF] text-[#080C14] uf-glow-sm'
              : 'text-[#94A3B8] hover:text-[#FFFFFF] hover:bg-[#94A3B8]/10'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Usuarios Registrados ({profiles.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'audit'
              ? 'bg-[#00E5FF] text-[#080C14] uf-glow-sm'
              : 'text-[#94A3B8] hover:text-[#FFFFFF] hover:bg-[#94A3B8]/10'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Registro de Auditoría</span>
        </button>
      </div>

      {/* TAB 1: LICENSES CRUD */}
      {activeTab === 'licenses' && (
        <div className="space-y-4">
          {/* Search and Filters */}
          <div className="p-4 rounded-2xl bg-[#080C14] border border-[#94A3B8]/20 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
              <input
                type="text"
                placeholder="Buscar clave de licencia o correo..."
                value={licenseSearch}
                onChange={(e) => setLicenseSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#080C14] border border-[#94A3B8]/30 rounded-xl text-xs text-[#FFFFFF] focus:outline-none focus:border-[#00E5FF]"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto px-3.5 py-2 bg-[#080C14] border border-[#94A3B8]/30 rounded-xl text-xs font-medium text-[#FFFFFF] focus:border-[#00E5FF]"
            >
              <option value="all" className="bg-[#080C14]">Todos los Estados</option>
              <option value="unused" className="bg-[#080C14]">Disponibles</option>
              <option value="active" className="bg-[#080C14]">Activas</option>
              <option value="paused" className="bg-[#080C14]">Pausadas</option>
              <option value="revoked" className="bg-[#080C14]">Revocadas</option>
              <option value="expired" className="bg-[#080C14]">Expiradas</option>
            </select>
          </div>

          {/* Licenses Table */}
          <div className="rounded-2xl bg-[#080C14] border border-[#94A3B8]/20 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#FFFFFF]">
                <thead className="bg-[#080C14] border-b border-[#94A3B8]/20 text-[#94A3B8] uppercase font-bold text-[11px] tracking-wider">
                  <tr>
                    <th className="p-4">Clave de Licencia</th>
                    <th className="p-4">Duración</th>
                    <th className="p-4">Estado</th>
                    <th className="p-4">Creación / Expiración</th>
                    <th className="p-4 text-right">Acciones de Control</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#94A3B8]/15">
                  {filteredLicenses.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-[#94A3B8] italic">
                        No hay licencias que coincidan con la búsqueda.
                      </td>
                    </tr>
                  ) : (
                    filteredLicenses.map((lic) => {
                      const badge = getStatusBadgeLabel(lic.status);
                      return (
                        <tr key={lic.id} className="hover:bg-[#94A3B8]/5 transition-colors">
                          <td className="p-4 font-mono font-bold text-[#00E5FF] flex items-center gap-2">
                            <span>{lic.key_code}</span>
                            <button
                              onClick={() => copyToClipboard(lic.key_code)}
                              className="p-1 rounded text-[#94A3B8] hover:text-[#FFFFFF]"
                              title="Copiar Clave"
                            >
                              {copiedKey === lic.key_code ? (
                                <Check className="w-3.5 h-3.5 text-[#00E5FF]" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </td>
                          <td className="p-4 font-semibold text-[#FFFFFF]">
                            {getDurationLabel(lic.duration)}
                          </td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${badge.bgClass} ${badge.textClass}`}>
                              {badge.label}
                            </span>
                          </td>
                          <td className="p-4 text-[#94A3B8] font-mono text-[11px]">
                            <div>Creada: {formatDate(lic.created_at, 'd MMM, yyyy')}</div>
                            {lic.expires_at && (
                              <div className="text-[#00E5FF]">Expira: {formatDate(lic.expires_at, 'd MMM, yyyy')}</div>
                            )}
                          </td>
                          <td className="p-4 text-right space-x-1">
                            {lic.status === 'active' && (
                              <button
                                onClick={() => handleStatusChange(lic.id, 'paused', lic.key_code)}
                                className="px-2.5 py-1 rounded-lg border border-[#FFFFFF]/30 text-[#FFFFFF] hover:bg-[#FFFFFF]/10 text-[11px] font-bold transition-all"
                                title="Pausar acceso al instante"
                              >
                                <Pause className="w-3.5 h-3.5 inline mr-1" /> Pausar
                              </button>
                            )}

                            {lic.status === 'paused' && (
                              <button
                                onClick={() => handleStatusChange(lic.id, 'active', lic.key_code)}
                                className="px-2.5 py-1 rounded-lg border border-[#00E5FF]/40 text-[#00E5FF] hover:bg-[#00E5FF]/10 text-[11px] font-bold transition-all"
                                title="Reanudar acceso"
                              >
                                <Play className="w-3.5 h-3.5 inline mr-1" /> Reanudar
                              </button>
                            )}

                            {lic.status !== 'revoked' && (
                              <button
                                onClick={() => handleStatusChange(lic.id, 'revoked', lic.key_code)}
                                className="px-2.5 py-1 rounded-lg border border-rose-600/40 text-rose-400 hover:bg-rose-950/40 text-[11px] font-bold transition-all"
                                title="Revocar clave permanentemente"
                              >
                                <Slash className="w-3.5 h-3.5 inline mr-1" /> Revocar
                              </button>
                            )}

                            <button
                              onClick={() => handleDeleteLicense(lic.id, lic.key_code)}
                              className="p-1.5 rounded-lg text-[#94A3B8] hover:text-rose-400 transition-colors"
                              title="Eliminar registro"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USERS CRUD */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#080C14] border border-[#94A3B8]/20 flex items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
              <input
                type="text"
                placeholder="Buscar usuario por nombre o correo..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#080C14] border border-[#94A3B8]/30 rounded-xl text-xs text-[#FFFFFF] focus:outline-none focus:border-[#00E5FF]"
              />
            </div>
          </div>

          <div className="rounded-2xl bg-[#080C14] border border-[#94A3B8]/20 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#FFFFFF]">
                <thead className="bg-[#080C14] border-b border-[#94A3B8]/20 text-[#94A3B8] uppercase font-bold text-[11px]">
                  <tr>
                    <th className="p-4">Usuario</th>
                    <th className="p-4">Correo</th>
                    <th className="p-4">Rol de Sistema</th>
                    <th className="p-4">Estado</th>
                    <th className="p-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#94A3B8]/15">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-[#94A3B8]/5 transition-colors">
                      <td className="p-4 font-bold text-[#FFFFFF]">
                        {u.full_name || 'Sin nombre'}
                      </td>
                      <td className="p-4 text-[#94A3B8] font-mono">{u.email}</td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase ${
                            u.role === 'superadmin'
                              ? 'bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/40 uf-glow-sm'
                              : 'bg-[#94A3B8]/10 text-[#94A3B8] border border-[#94A3B8]/30'
                          }`}
                        >
                          {u.role === 'superadmin' ? 'SUPERADMIN' : 'USUARIO'}
                        </span>
                      </td>
                      <td className="p-4">
                        {u.is_banned ? (
                          <span className="text-rose-400 font-bold flex items-center gap-1">
                            <ShieldAlert className="w-3.5 h-3.5" /> Baneado
                          </span>
                        ) : (
                          <span className="text-[#00E5FF] font-bold flex items-center gap-1">
                            <UserCheck className="w-3.5 h-3.5" /> Activo
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => handleToggleRole(u)}
                          className="px-3 py-1.5 rounded-xl border border-[#00E5FF]/30 text-[#00E5FF] text-[11px] font-bold hover:bg-[#00E5FF]/10 transition-colors"
                        >
                          {u.role === 'superadmin' ? 'Cambiar a User' : 'Ascender a SuperAdmin'}
                        </button>
                        <button
                          onClick={() => handleToggleBan(u)}
                          className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-colors ${
                            u.is_banned
                              ? 'border-[#00E5FF]/40 text-[#00E5FF]'
                              : 'border-rose-600/40 text-rose-400 hover:bg-rose-950/40'
                          }`}
                        >
                          {u.is_banned ? 'Desbanear' : 'Banear'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="rounded-2xl bg-[#080C14] border border-[#94A3B8]/20 overflow-hidden">
          <div className="p-4 border-b border-[#94A3B8]/20 font-bold text-xs text-[#94A3B8] uppercase">
            Últimas 50 Acciones de Auditoría del Sistema
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#FFFFFF]">
              <thead className="bg-[#080C14] border-b border-[#94A3B8]/20 text-[#94A3B8] uppercase text-[11px]">
                <tr>
                  <th className="p-4">Fecha y Hora</th>
                  <th className="p-4">Usuario</th>
                  <th className="p-4">Acción</th>
                  <th className="p-4">Detalles</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#94A3B8]/15">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#94A3B8]/5">
                    <td className="p-4 font-mono text-[#94A3B8] text-[11px]">
                      {formatDate(log.created_at, 'd MMM, yyyy HH:mm')}
                    </td>
                    <td className="p-4 font-bold text-[#FFFFFF]">{log.user_email || 'Sistema'}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded bg-[#00E5FF]/10 text-[#00E5FF] font-mono text-[10px] font-bold">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4 text-[#94A3B8] font-mono text-[11px]">{log.details || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Generate License */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Generar Nueva Licencia SaaS"
        maxWidth="sm"
      >
        {!createdLicense ? (
          <form onSubmit={handleCreateLicense} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#94A3B8] mb-1.5">
                Selecciona la Duración de la Licencia
              </label>
              <select
                value={selectedDuration}
                onChange={(e) => setSelectedDuration(e.target.value as LicenseDuration)}
                className="w-full px-3.5 py-2.5 bg-[#080C14] border border-[#94A3B8]/30 rounded-xl text-xs font-bold text-[#FFFFFF] focus:border-[#00E5FF]"
              >
                <option value="1_month" className="bg-[#080C14]">1 Mes (+30 días)</option>
                <option value="3_months" className="bg-[#080C14]">3 Meses (+90 días)</option>
                <option value="6_months" className="bg-[#080C14]">6 Meses (+180 días)</option>
                <option value="1_year" className="bg-[#080C14]">1 Año (+365 días)</option>
                <option value="unlimited" className="bg-[#080C14]">Indefinida / Vitalicia</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#94A3B8]/20">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-[#94A3B8]/30 text-[#94A3B8] text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#00E5FF] text-[#080C14] text-xs font-black uppercase uf-glow-sm"
              >
                Generar Clave
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/40 flex items-center justify-center mx-auto uf-glow-sm">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-[#FFFFFF]">¡Clave Generada Exitosamente!</h4>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                Entrega esta clave al usuario para que la ingrese en su pantalla de activación:
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#080C14] border border-[#00E5FF]/50 text-xl font-mono font-black text-[#00E5FF] tracking-widest flex items-center justify-center gap-3 uf-glow-sm">
              <span>{createdLicense.key_code}</span>
              <button
                onClick={() => copyToClipboard(createdLicense.key_code)}
                className="p-1.5 rounded bg-[#00E5FF]/20 text-[#00E5FF] hover:bg-[#00E5FF]/30 transition-colors"
                title="Copiar Clave"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-[#00E5FF] text-[#080C14] text-xs font-bold uppercase uf-glow-sm"
            >
              Cerrar y Regresar
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
};
