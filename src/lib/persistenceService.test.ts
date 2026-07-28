import { beforeEach, describe, expect, it, vi } from 'vitest';
import { persistenceService } from './persistenceService';

const values = new Map<string, string>();

beforeEach(() => {
  values.clear();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  });
});

describe('persistenceService account isolation', () => {
  it('keeps financial records separated by user id', async () => {
    await persistenceService.saveTransactions('user-a', [{ id: 'private-a', amount: 100 }]);
    await persistenceService.saveTransactions('user-b', [{ id: 'private-b', amount: 25 }]);
    persistenceService.saveCategories('user-a', [{ id: 'cat-a' }]);
    persistenceService.saveCategories('user-b', [{ id: 'cat-b' }]);
    persistenceService.saveBudgets('user-a', [{ id: 'budget-a' }]);
    persistenceService.saveBudgets('user-b', [{ id: 'budget-b' }]);

    await expect(persistenceService.loadTransactions('user-b')).resolves.toEqual([
      { id: 'private-b', amount: 25 },
    ]);
    expect(persistenceService.loadCategories('user-b')).toEqual([{ id: 'cat-b' }]);
    expect(persistenceService.loadBudgets('user-b')).toEqual([{ id: 'budget-b' }]);
  });

  it('clears only the requested user', async () => {
    await persistenceService.saveTransactions('user-a', [{ id: 'private-a' }]);
    await persistenceService.saveTransactions('user-b', [{ id: 'private-b' }]);

    persistenceService.clearUserData('user-a');

    await expect(persistenceService.loadTransactions('user-a')).resolves.toEqual([]);
    await expect(persistenceService.loadTransactions('user-b')).resolves.toEqual([{ id: 'private-b' }]);
  });
});
