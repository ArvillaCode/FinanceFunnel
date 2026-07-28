import React, { useState, useEffect } from 'react';
import { tenantService } from '../../lib/tenantService';
import { OrganizationMember, Invitation, OrgRole } from '../../types';
import { Users, UserPlus, Mail, Shield, Trash2, CheckCircle, Clock, Building2 } from 'lucide-react';
import { Modal } from '../ui/Modal';

export const TeamManagerView: React.FC = () => {
  const [currentOrgId, setCurrentOrgId] = useState(tenantService.getCurrentOrgId());
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<OrgRole>('member');
  const [successMsg, setSuccessMsg] = useState('');

  const loadData = () => {
    const orgId = tenantService.getCurrentOrgId();
    setCurrentOrgId(orgId);
    setMembers(tenantService.getMembers(orgId));
    setInvitations(tenantService.getInvitations(orgId));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    tenantService.inviteMember(currentOrgId, inviteEmail.trim(), inviteRole);
    loadData();
    setIsInviteModalOpen(false);
    setInviteEmail('');
    setSuccessMsg(`Invitación enviada a ${inviteEmail.trim()}`);
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  const handleRemoveMember = (memberId: string, name: string) => {
    if (!confirm(`¿Eliminar a ${name} del equipo?`)) return;
    tenantService.removeMember(memberId);
    loadData();
  };

  const handleRoleChange = (memberId: string, role: OrgRole) => {
    tenantService.updateMemberRole(memberId, role);
    loadData();
  };

  const orgs = tenantService.getOrganizations();
  const currentOrg = orgs.find((o) => o.id === currentOrgId) || orgs[0];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/40 text-xs font-extrabold uppercase tracking-wider uf-glow-sm">
              GESTIÓN DE EQUIPO MULTI-TENANT
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-[#FFFFFF] mt-1 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#00E5FF]" />
            <span>{currentOrg?.name || 'Espacio de Trabajo'}</span>
          </h2>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Invita colaboradores, gestiona permisos de acceso y administra los miembros de tu equipo
          </p>
        </div>

        <button
          onClick={() => setIsInviteModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#00E5FF] hover:bg-[#00E5FF]/90 text-[#080C14] text-xs font-black tracking-wide uppercase transition-all shadow-md uf-glow-sm self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Invitar Colaborador</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-[#00E5FF]/10 border border-[#00E5FF]/40 text-xs font-bold text-[#00E5FF] flex items-center gap-2 uf-glow-sm">
          <CheckCircle className="w-4 h-4" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Members Table */}
      <div className="rounded-2xl bg-[#080C14] border border-[#94A3B8]/20 overflow-hidden space-y-4">
        <div className="p-4 border-b border-[#94A3B8]/20 font-bold text-xs text-[#FFFFFF] uppercase flex items-center justify-between">
          <span>Miembros Activos ({members.length})</span>
          <span className="text-[11px] text-[#94A3B8] font-mono">Plan: {currentOrg?.plan_tier.toUpperCase()}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#FFFFFF]">
            <thead className="bg-[#080C14] border-b border-[#94A3B8]/20 text-[#94A3B8] uppercase text-[11px]">
              <tr>
                <th className="p-4">Colaborador</th>
                <th className="p-4">Correo</th>
                <th className="p-4">Rol en Espacio</th>
                <th className="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#94A3B8]/15">
              {members.map((m) => (
                <tr key={m.id} className="hover:bg-[#94A3B8]/5">
                  <td className="p-4 font-bold text-[#FFFFFF] flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/30 font-bold text-xs flex items-center justify-center">
                      {m.full_name.charAt(0).toUpperCase()}
                    </div>
                    <span>{m.full_name}</span>
                  </td>
                  <td className="p-4 text-[#94A3B8] font-mono">{m.email}</td>
                  <td className="p-4">
                    {m.role === 'owner' ? (
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/40 uf-glow-sm">
                        PROPIETARIO (OWNER)
                      </span>
                    ) : (
                      <select
                        value={m.role}
                        onChange={(e) => handleRoleChange(m.id, e.target.value as OrgRole)}
                        className="bg-[#080C14] border border-[#94A3B8]/30 rounded-xl px-2.5 py-1 text-xs text-[#FFFFFF] focus:border-[#00E5FF]"
                      >
                        <option value="admin">Administrador</option>
                        <option value="member">Miembro</option>
                        <option value="viewer">Observador (Solo Lectura)</option>
                      </select>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    {m.role !== 'owner' && (
                      <button
                        onClick={() => handleRemoveMember(m.id, m.full_name)}
                        className="p-1.5 rounded-lg text-[#94A3B8] hover:text-rose-400 transition-colors"
                        title="Eliminar del equipo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pending Invitations Table */}
      {invitations.length > 0 && (
        <div className="rounded-2xl bg-[#080C14] border border-[#94A3B8]/20 overflow-hidden">
          <div className="p-4 border-b border-[#94A3B8]/20 font-bold text-xs text-[#94A3B8] uppercase flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#00E5FF]" />
            <span>Invitaciones Pendientes ({invitations.length})</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#FFFFFF]">
              <thead className="bg-[#080C14] border-b border-[#94A3B8]/20 text-[#94A3B8] uppercase text-[11px]">
                <tr>
                  <th className="p-4">Correo Invitado</th>
                  <th className="p-4">Rol Asignado</th>
                  <th className="p-4">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#94A3B8]/15">
                {invitations.map((inv) => (
                  <tr key={inv.id} className="hover:bg-[#94A3B8]/5">
                    <td className="p-4 text-[#FFFFFF] font-mono">{inv.email}</td>
                    <td className="p-4 uppercase font-bold text-[#00E5FF]">{inv.role}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/30">
                        Pendiente de Aceptación
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Invite Member */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Invitar Colaborador al Equipo"
        maxWidth="sm"
      >
        <form onSubmit={handleSendInvite} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#94A3B8] mb-1">
              Correo Electrónico del Colaborador
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
              <input
                type="email"
                placeholder="colaborador@empresa.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-[#080C14] border border-[#94A3B8]/30 rounded-xl text-xs font-medium text-[#FFFFFF] focus:border-[#00E5FF]"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#94A3B8] mb-1">
              Rol de Permisos
            </label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as OrgRole)}
              className="w-full px-3.5 py-2.5 bg-[#080C14] border border-[#94A3B8]/30 rounded-xl text-xs font-bold text-[#FFFFFF] focus:border-[#00E5FF]"
            >
              <option value="admin" className="bg-[#080C14]">Administrador (Gestión total)</option>
              <option value="member" className="bg-[#080C14]">Miembro (Registrar y editar)</option>
              <option value="viewer" className="bg-[#080C14]">Observador (Solo lectura)</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsInviteModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-[#94A3B8]/30 text-[#94A3B8] text-xs font-bold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#00E5FF] text-[#080C14] text-xs font-black uppercase uf-glow-sm"
            >
              Enviar Invitación
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
