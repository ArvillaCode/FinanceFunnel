import { describe, it, expect, beforeEach } from 'vitest';
import { tenantService } from './tenantService';

describe('tenantService Multi-Tenant Suite', () => {
  let store: Record<string, string> = {};

  beforeEach(() => {
    store = {};
    globalThis.localStorage = {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
      length: 0,
      key: () => null,
    };
  });

  it('debe inicializar un espacio de trabajo único para un usuario nuevo sin incluir correos de superadmin', () => {
    const newUser = {
      id: 'user-new-123',
      email: 'nuevo.usuario@empresa.com',
      full_name: 'Carlos Ruiz',
    };

    tenantService.initializeUserTenant(newUser, false);

    const orgs = tenantService.getOrganizations();
    expect(orgs.length).toBe(1);
    expect(orgs[0].owner_id).toBe(newUser.id);
    expect(orgs[0].name).toContain('Carlos Ruiz');

    const members = tenantService.getAllMembers();
    expect(members.length).toBe(1);
    expect(members[0].email).toBe(newUser.email);
    expect(members[0].full_name).toBe(newUser.full_name);
    expect(members[0].role).toBe('owner');

    // Verificar que NO incluya el email del superadmin gabriel
    const gabrielMember = members.find((m) => m.email === 'gabriel.au2023@gmail.com');
    expect(gabrielMember).toBeUndefined();
  });

  it('debe inicializar datos de demostración en modo demo o superadmin', () => {
    const superAdmin = {
      id: 'superadmin-gabriel-id',
      email: 'gabriel.au2023@gmail.com',
      full_name: 'Gabriel Aristizábal',
    };

    tenantService.initializeUserTenant(superAdmin, false);

    const orgs = tenantService.getOrganizations();
    expect(orgs.length).toBeGreaterThanOrEqual(1);

    const members = tenantService.getAllMembers();
    expect(members.some((m) => m.email === 'gabriel.au2023@gmail.com')).toBe(true);
  });
});
