import React, { useState, useEffect } from 'react';
import { tenantService } from '../../lib/tenantService';
import { Organization } from '../../types';
import { Building2, ChevronDown, Plus, Check, Briefcase } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { useAuth } from '../../context/AuthContext';

interface OrganizationSwitcherProps {
  onOrgChange?: (org: Organization) => void;
}

export const OrganizationSwitcher: React.FC<OrganizationSwitcherProps> = ({ onOrgChange }) => {
  const { user } = useAuth();
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');

  useEffect(() => {
    const loadedOrgs = tenantService.getOrganizations();
    setOrgs(loadedOrgs);
    const activeId = tenantService.getCurrentOrgId();
    const activeOrg = loadedOrgs.find((o) => o.id === activeId) || loadedOrgs[0];
    setCurrentOrg(activeOrg);
  }, []);

  const handleSelectOrg = (org: Organization) => {
    setCurrentOrg(org);
    tenantService.setCurrentOrgId(org.id);
    setIsOpen(false);
    if (onOrgChange) onOrgChange(org);
  };

  const handleCreateOrg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;
    const created = tenantService.createOrganization(
      newOrgName.trim(),
      user?.id || `user-${Date.now()}`,
      user?.full_name,
      user?.email
    );
    setOrgs(tenantService.getOrganizations());
    setCurrentOrg(created);
    setIsModalOpen(false);
    setNewOrgName('');
    if (onOrgChange) onOrgChange(created);
  };

  if (!currentOrg) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#080C14] border border-[#00E5FF]/30 hover:border-[#00E5FF] transition-all text-xs font-bold text-[#FFFFFF] uf-glow-sm"
        title="Espacio de Trabajo Activo"
      >
        <div className="w-5 h-5 rounded-lg bg-[#00E5FF]/10 text-[#00E5FF] flex items-center justify-center border border-[#00E5FF]/30 shrink-0">
          <Briefcase className="w-3 h-3 text-[#00E5FF]" />
        </div>
        <span className="truncate max-w-[130px] hidden sm:inline">{currentOrg.name}</span>
        <ChevronDown className="w-3.5 h-3.5 text-[#00E5FF] shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-64 rounded-2xl bg-[#080C14] border border-[#00E5FF]/50 shadow-2xl p-2 z-50 uf-glow">
          <div className="px-3 py-2 text-[11px] font-extrabold uppercase text-[#94A3B8] border-b border-[#94A3B8]/15 mb-1">
            Espacios de Trabajo (Multi-Tenant)
          </div>

          <div className="space-y-1">
            {orgs.map((org) => (
              <button
                key={org.id}
                onClick={() => handleSelectOrg(org)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  currentOrg.id === org.id
                    ? 'bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/40'
                    : 'text-[#FFFFFF] hover:bg-[#94A3B8]/10'
                }`}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <Building2 className="w-4 h-4 text-[#00E5FF] shrink-0" />
                  <span className="truncate">{org.name}</span>
                </div>
                {currentOrg.id === org.id && <Check className="w-4 h-4 text-[#00E5FF] shrink-0" />}
              </button>
            ))}
          </div>

          <div className="border-t border-[#94A3B8]/15 my-1.5" />

          <button
            onClick={() => {
              setIsOpen(false);
              setIsModalOpen(true);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-[#00E5FF] hover:bg-[#00E5FF]/10 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Nuevo Espacio</span>
          </button>
        </div>
      )}

      {/* Modal: Create Workspace */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Crear Nuevo Espacio de Trabajo"
        maxWidth="sm"
      >
        <form onSubmit={handleCreateOrg} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#94A3B8] mb-1">
              Nombre de la Empresa u Organización
            </label>
            <input
              type="text"
              placeholder="Ej. Upfunnel Agency, Familia Aristizábal..."
              value={newOrgName}
              onChange={(e) => setNewOrgName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#080C14] border border-[#94A3B8]/30 rounded-xl text-xs font-medium text-[#FFFFFF] focus:border-[#00E5FF]"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-[#94A3B8]/30 text-[#94A3B8] text-xs font-bold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#00E5FF] text-[#080C14] text-xs font-black uppercase uf-glow-sm"
            >
              Crear Espacio
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
