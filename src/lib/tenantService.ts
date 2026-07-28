import { Organization, OrganizationMember, Invitation, OrgRole, PlanTier } from '../types';

const STORAGE_ORGS_KEY = 'finance_organizations';
const STORAGE_MEMBERS_KEY = 'finance_org_members';
const STORAGE_INVITES_KEY = 'finance_org_invitations';
const STORAGE_CURRENT_ORG_KEY = 'finance_current_org_id';

const DEFAULT_ORGS: Organization[] = [
  {
    id: 'org-personal',
    name: 'Finanzas Personales',
    slug: 'finanzas-personales',
    owner_id: 'superadmin-gabriel-id',
    plan_tier: 'pro',
    member_count: 1,
    created_at: new Date().toISOString(),
  },
  {
    id: 'org-company',
    name: 'Upfunnel Agency & Corp',
    slug: 'upfunnel-agency',
    owner_id: 'superadmin-gabriel-id',
    plan_tier: 'enterprise',
    member_count: 3,
    created_at: new Date().toISOString(),
  },
];

const DEFAULT_MEMBERS: OrganizationMember[] = [
  {
    id: 'm-1',
    organization_id: 'org-personal',
    user_id: 'superadmin-gabriel-id',
    full_name: 'Gabriel Aristizábal',
    email: 'gabriel.au2023@gmail.com',
    role: 'owner',
    joined_at: new Date().toISOString(),
  },
  {
    id: 'm-2',
    organization_id: 'org-company',
    user_id: 'superadmin-gabriel-id',
    full_name: 'Gabriel Aristizábal',
    email: 'gabriel.au2023@gmail.com',
    role: 'owner',
    joined_at: new Date().toISOString(),
  },
  {
    id: 'm-3',
    organization_id: 'org-company',
    user_id: 'user-laura',
    full_name: 'Laura Gómez',
    email: 'laura@upfunnel.com',
    role: 'admin',
    joined_at: new Date().toISOString(),
  },
  {
    id: 'm-4',
    organization_id: 'org-company',
    user_id: 'user-carlos',
    full_name: 'Carlos Mendoza',
    email: 'carlos@upfunnel.com',
    role: 'member',
    joined_at: new Date().toISOString(),
  },
];

export const tenantService = {
  getOrganizations(): Organization[] {
    if (typeof window === 'undefined') return DEFAULT_ORGS;
    const saved = localStorage.getItem(STORAGE_ORGS_KEY);
    if (!saved) {
      localStorage.setItem(STORAGE_ORGS_KEY, JSON.stringify(DEFAULT_ORGS));
      return DEFAULT_ORGS;
    }
    try {
      return JSON.parse(saved);
    } catch {
      return DEFAULT_ORGS;
    }
  },

  getCurrentOrgId(): string {
    if (typeof window === 'undefined') return DEFAULT_ORGS[0].id;
    const saved = localStorage.getItem(STORAGE_CURRENT_ORG_KEY);
    return saved || DEFAULT_ORGS[0].id;
  },

  setCurrentOrgId(orgId: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_CURRENT_ORG_KEY, orgId);
    }
  },

  createOrganization(name: string, ownerUserId: string): Organization {
    const orgs = this.getOrganizations();
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const newOrg: Organization = {
      id: `org-${Date.now()}`,
      name,
      slug,
      owner_id: ownerUserId,
      plan_tier: 'starter',
      member_count: 1,
      created_at: new Date().toISOString(),
    };

    const updatedOrgs = [...orgs, newOrg];
    localStorage.setItem(STORAGE_ORGS_KEY, JSON.stringify(updatedOrgs));
    this.setCurrentOrgId(newOrg.id);

    // Add owner member
    const members = this.getMembers(newOrg.id);
    const ownerMember: OrganizationMember = {
      id: `m-${Date.now()}`,
      organization_id: newOrg.id,
      user_id: ownerUserId,
      full_name: 'Propietario de Espacio',
      email: 'owner@upfunnel.com',
      role: 'owner',
      joined_at: new Date().toISOString(),
    };
    const allMembers = this.getAllMembers();
    localStorage.setItem(STORAGE_MEMBERS_KEY, JSON.stringify([...allMembers, ownerMember]));

    return newOrg;
  },

  getAllMembers(): OrganizationMember[] {
    if (typeof window === 'undefined') return DEFAULT_MEMBERS;
    const saved = localStorage.getItem(STORAGE_MEMBERS_KEY);
    if (!saved) {
      localStorage.setItem(STORAGE_MEMBERS_KEY, JSON.stringify(DEFAULT_MEMBERS));
      return DEFAULT_MEMBERS;
    }
    try {
      return JSON.parse(saved);
    } catch {
      return DEFAULT_MEMBERS;
    }
  },

  getMembers(orgId: string): OrganizationMember[] {
    const all = this.getAllMembers();
    return all.filter((m) => m.organization_id === orgId);
  },

  inviteMember(orgId: string, email: string, role: OrgRole): Invitation {
    const invites = this.getInvitations(orgId);
    const token = `inv-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const newInvite: Invitation = {
      id: `invite-${Date.now()}`,
      organization_id: orgId,
      email,
      role,
      status: 'pending',
      token,
      created_at: new Date().toISOString(),
      expires_at: expiresAt,
    };

    const allInvites = this.getAllInvitations();
    localStorage.setItem(STORAGE_INVITES_KEY, JSON.stringify([...allInvites, newInvite]));
    return newInvite;
  },

  getAllInvitations(): Invitation[] {
    if (typeof window === 'undefined') return [];
    const saved = localStorage.getItem(STORAGE_INVITES_KEY);
    if (!saved) return [];
    try {
      return JSON.parse(saved);
    } catch {
      return [];
    }
  },

  getInvitations(orgId: string): Invitation[] {
    return this.getAllInvitations().filter((i) => i.organization_id === orgId);
  },

  removeMember(memberId: string): void {
    const all = this.getAllMembers().filter((m) => m.id !== memberId);
    localStorage.setItem(STORAGE_MEMBERS_KEY, JSON.stringify(all));
  },

  updateMemberRole(memberId: string, role: OrgRole): void {
    const all = this.getAllMembers().map((m) => (m.id === memberId ? { ...m, role } : m));
    localStorage.setItem(STORAGE_MEMBERS_KEY, JSON.stringify(all));
  },

  getPlanLimits(tier: PlanTier) {
    switch (tier) {
      case 'enterprise':
        return { maxMembers: 999, maxTransactionsPerMonth: 999999, aiLevel: 'Enterprise Unlimited' };
      case 'pro':
        return { maxMembers: 10, maxTransactionsPerMonth: 5000, aiLevel: 'Pro Advisor' };
      case 'starter':
      default:
        return { maxMembers: 3, maxTransactionsPerMonth: 200, aiLevel: 'Básico' };
    }
  },
};
