import { Organization, OrganizationMember, Invitation, OrgRole, PlanTier } from '../types';

const STORAGE_ORGS_KEY = 'finance_organizations';
const STORAGE_MEMBERS_KEY = 'finance_org_members';
const STORAGE_INVITES_KEY = 'finance_org_invitations';
const STORAGE_CURRENT_ORG_KEY = 'finance_current_org_id';

const DEMO_ORGS: Organization[] = [
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

const DEMO_MEMBERS: OrganizationMember[] = [
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
  initializeUserTenant(user: { id: string; email: string; full_name?: string }, isDemo: boolean = false): void {
    if (typeof localStorage === 'undefined') return;

    const email = (user.email || '').trim().toLowerCase();
    const isSuper = email === 'gabriel.au2023@gmail.com';

    if (isDemo || isSuper) {
      const savedOrgs = localStorage.getItem(STORAGE_ORGS_KEY);
      if (!savedOrgs) {
        localStorage.setItem(STORAGE_ORGS_KEY, JSON.stringify(DEMO_ORGS));
        localStorage.setItem(STORAGE_MEMBERS_KEY, JSON.stringify(DEMO_MEMBERS));
        localStorage.setItem(STORAGE_CURRENT_ORG_KEY, DEMO_ORGS[0].id);
      }
      return;
    }

    // For new/regular users: check and purge any lingering demo/superadmin data
    const savedOrgs = localStorage.getItem(STORAGE_ORGS_KEY);
    const savedMembers = localStorage.getItem(STORAGE_MEMBERS_KEY);

    let orgs: Organization[] = [];
    let members: OrganizationMember[] = [];

    try {
      if (savedOrgs) orgs = JSON.parse(savedOrgs);
      if (savedMembers) members = JSON.parse(savedMembers);
    } catch {
      orgs = [];
      members = [];
    }

    // Filter out Gabriel's demo orgs and demo members for regular users
    const userOrgs = orgs.filter((o) => o.owner_id === user.id || o.id === `org-${user.id}`);
    const userMembers = members.filter((m) => m.email === email || userOrgs.some((o) => o.id === m.organization_id));

    if (userOrgs.length === 0) {
      const newOrgId = `org-${user.id}`;
      const nameOwner = user.full_name || email.split('@')[0] || 'Mi Espacio';
      const userOrg: Organization = {
        id: newOrgId,
        name: `Finanzas de ${nameOwner}`,
        slug: `finanzas-${user.id.slice(0, 8)}`,
        owner_id: user.id,
        plan_tier: 'starter',
        member_count: 1,
        created_at: new Date().toISOString(),
      };

      const userMember: OrganizationMember = {
        id: `m-${user.id}`,
        organization_id: newOrgId,
        user_id: user.id,
        full_name: nameOwner,
        email: user.email,
        role: 'owner',
        joined_at: new Date().toISOString(),
      };

      localStorage.setItem(STORAGE_ORGS_KEY, JSON.stringify([userOrg]));
      localStorage.setItem(STORAGE_MEMBERS_KEY, JSON.stringify([userMember]));
      localStorage.setItem(STORAGE_CURRENT_ORG_KEY, newOrgId);
      localStorage.removeItem(STORAGE_INVITES_KEY);
    } else {
      localStorage.setItem(STORAGE_ORGS_KEY, JSON.stringify(userOrgs));
      localStorage.setItem(STORAGE_MEMBERS_KEY, JSON.stringify(userMembers));
      const activeId = localStorage.getItem(STORAGE_CURRENT_ORG_KEY);
      if (!activeId || !userOrgs.some((o) => o.id === activeId)) {
        localStorage.setItem(STORAGE_CURRENT_ORG_KEY, userOrgs[0].id);
      }
    }
  },

  getOrganizations(): Organization[] {
    if (typeof localStorage === 'undefined') return [];
    const saved = localStorage.getItem(STORAGE_ORGS_KEY);
    if (!saved) return [];
    try {
      return JSON.parse(saved);
    } catch {
      return [];
    }
  },

  getCurrentOrgId(): string {
    if (typeof localStorage === 'undefined') return '';
    const orgs = this.getOrganizations();
    if (orgs.length === 0) return '';
    const saved = localStorage.getItem(STORAGE_CURRENT_ORG_KEY);
    if (saved && orgs.some((o) => o.id === saved)) return saved;
    const firstId = orgs[0].id;
    this.setCurrentOrgId(firstId);
    return firstId;
  },

  setCurrentOrgId(orgId: string): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_CURRENT_ORG_KEY, orgId);
    }
  },

  createOrganization(name: string, ownerUserId: string, ownerName?: string, ownerEmail?: string): Organization {
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

    const ownerMember: OrganizationMember = {
      id: `m-${Date.now()}`,
      organization_id: newOrg.id,
      user_id: ownerUserId,
      full_name: ownerName || 'Propietario de Espacio',
      email: ownerEmail || 'propietario@empresa.com',
      role: 'owner',
      joined_at: new Date().toISOString(),
    };
    const allMembers = this.getAllMembers();
    localStorage.setItem(STORAGE_MEMBERS_KEY, JSON.stringify([...allMembers, ownerMember]));

    return newOrg;
  },

  getAllMembers(): OrganizationMember[] {
    if (typeof localStorage === 'undefined') return [];
    const saved = localStorage.getItem(STORAGE_MEMBERS_KEY);
    if (!saved) return [];
    try {
      return JSON.parse(saved);
    } catch {
      return [];
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
    if (typeof localStorage === 'undefined') return [];
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
