import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./supabase', () => ({ supabase: null }));

import { supabaseService } from './supabaseService';

beforeEach(() => {
  vi.stubGlobal('localStorage', {
    getItem: () => null,
    setItem: vi.fn(),
    removeItem: vi.fn(),
  });
});

describe('license persistence', () => {
  it('does not fabricate a local license when Supabase is unavailable', async () => {
    await expect(
      supabaseService.createLicense('1_month', '2c4dfb40-6985-49c6-bbb1-2d854daa5855')
    ).rejects.toThrow('Supabase no está configurado');
    expect(localStorage.setItem).not.toHaveBeenCalled();
  });

  it('does not claim activation succeeded without the license server', async () => {
    await expect(
      supabaseService.activateLicenseForKey(
        '2c4dfb40-6985-49c6-bbb1-2d854daa5855',
        'ABCD-EFGH-IJKL-MNOP'
      )
    ).resolves.toMatchObject({ success: false });
    expect(localStorage.setItem).not.toHaveBeenCalled();
  });
});
