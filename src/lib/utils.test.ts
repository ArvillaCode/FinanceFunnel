import { describe, it, expect } from 'vitest';
import { formatCurrency, calculatePercentage, getMonthlyTotals } from './utils';
import { Transaction } from '../types';

describe('Financial Utils Suite', () => {
  describe('formatCurrency', () => {
    it('debe formatear correctamente los números en formato USD por defecto', () => {
      const formatted = formatCurrency(1254.5, 'USD');
      expect(formatted).toContain('1,254.50');
    });

    it('debe manejar montos en 0 de forma segura', () => {
      const formatted = formatCurrency(0, 'USD');
      expect(formatted).toContain('0.00');
    });
  });

  describe('calculatePercentage', () => {
    it('debe calcular la variación porcentual entre dos montos correctamente', () => {
      const percentage = calculatePercentage(150, 100);
      expect(percentage).toBe(50);
    });

    it('debe manejar división por cero devolviendo 0', () => {
      const percentage = calculatePercentage(100, 0);
      expect(percentage).toBe(0);
    });
  });

  describe('getMonthlyTotals', () => {
    it('debe calcular el balance, ingresos y gastos totales para un mes seleccionado', () => {
      const mockTxs: Transaction[] = [
        {
          id: 'tx-1',
          type: 'income',
          amount: 2000,
          description: 'Sueldo',
          category_id: 'cat-1',
          transaction_date: '2026-07-15',
        },
        {
          id: 'tx-2',
          type: 'expense',
          amount: 500,
          description: 'Comida',
          category_id: 'cat-2',
          transaction_date: '2026-07-20',
        },
      ];

      const totals = getMonthlyTotals(mockTxs, 2026, 7);
      expect(totals.income).toBe(2000);
      expect(totals.expenses).toBe(500);
      expect(totals.balance).toBe(1500);
      expect(totals.count).toBe(2);
    });
  });
});
