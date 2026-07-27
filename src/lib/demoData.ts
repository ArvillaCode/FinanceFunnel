import { Transaction, Budget, Category } from '../types';
import { DEFAULT_CATEGORIES } from './constants';
import { format, subMonths, setDate } from 'date-fns';

export function generateSeedData(): {
  transactions: Transaction[];
  budgets: Budget[];
  categories: Category[];
} {
  const categories = [...DEFAULT_CATEGORIES];
  const transactions: Transaction[] = [];
  const budgets: Budget[] = [];

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  // Generate 6 months of data
  for (let i = 5; i >= 0; i--) {
    const monthDate = subMonths(now, i);
    const yr = monthDate.getFullYear();
    const mo = monthDate.getMonth() + 1;
    const moStr = String(mo).padStart(2, '0');

    // Monthly incomes
    transactions.push({
      id: `seed-inc-sal-${yr}-${mo}`,
      type: 'income',
      amount: 3200,
      description: 'Salario Mensual',
      category_id: 'cat-11', // Salario
      transaction_date: `${yr}-${moStr}-01`,
      notes: 'Depósito direct nomina',
    });

    transactions.push({
      id: `seed-inc-free-${yr}-${mo}`,
      type: 'income',
      amount: 650 + (i % 3) * 150,
      description: 'Proyecto Freelance Web',
      category_id: 'cat-12', // Freelance
      transaction_date: `${yr}-${moStr}-15`,
      notes: 'Pago cliente diseño UX',
    });

    if (i % 2 === 0) {
      transactions.push({
        id: `seed-inc-inv-${yr}-${mo}`,
        type: 'income',
        amount: 120 + i * 20,
        description: 'Dividendos Inversiones',
        category_id: 'cat-13', // Inversiones
        transaction_date: `${yr}-${moStr}-20`,
        notes: 'Rendimientos trimestrales',
      });
    }

    // Fixed Expenses
    transactions.push({
      id: `seed-exp-rent-${yr}-${mo}`,
      type: 'expense',
      amount: 1100,
      description: 'Renta del Departamento',
      category_id: 'cat-1', // Vivienda
      transaction_date: `${yr}-${moStr}-02`,
      notes: 'Transferencia directa al arrendador',
    });

    transactions.push({
      id: `seed-exp-util-${yr}-${mo}`,
      type: 'expense',
      amount: 185 + (i * 12 % 35),
      description: 'Electricidad, Agua e Internet',
      category_id: 'cat-4', // Servicios
      transaction_date: `${yr}-${moStr}-05`,
      notes: 'Pago de servicios básicos',
    });

    // Variable Expenses (Groceries, Dining out, Gas, Entertainment, Shopping, Debt, Health)
    transactions.push({
      id: `seed-exp-groc1-${yr}-${mo}`,
      type: 'expense',
      amount: 220 + (i * 15 % 40),
      description: 'Supermercado Mensual - Semana 1',
      category_id: 'cat-2', // Alimentación
      transaction_date: `${yr}-${moStr}-07`,
    });

    transactions.push({
      id: `seed-exp-groc2-${yr}-${mo}`,
      type: 'expense',
      amount: 195 + (i * 18 % 30),
      description: 'Supermercado y Despensa - Semana 3',
      category_id: 'cat-2', // Alimentación
      transaction_date: `${yr}-${moStr}-21`,
    });

    transactions.push({
      id: `seed-exp-trans-${yr}-${mo}`,
      type: 'expense',
      amount: 160 + (i * 10 % 50),
      description: 'Gasolina y Transporte Público',
      category_id: 'cat-3', // Transporte
      transaction_date: `${yr}-${moStr}-12`,
    });

    transactions.push({
      id: `seed-exp-ent-${yr}-${mo}`,
      type: 'expense',
      amount: 140 + (i * 25 % 80),
      description: 'Cine, Salidas y Streaming',
      category_id: 'cat-5', // Entretenimiento
      transaction_date: `${yr}-${moStr}-18`,
    });

    transactions.push({
      id: `seed-exp-debt-${yr}-${mo}`,
      type: 'expense',
      amount: 250,
      description: 'Pago Tarjeta de Crédito',
      category_id: 'cat-8', // Deudas
      transaction_date: `${yr}-${moStr}-25`,
    });

    transactions.push({
      id: `seed-exp-shop-${yr}-${mo}`,
      type: 'expense',
      amount: 130 + (i * 40 % 110),
      description: 'Ropa y Artículos Personales',
      category_id: 'cat-9', // Compras
      transaction_date: `${yr}-${moStr}-14`,
    });

    if (i === 0) {
      // Current month additional transactions for realism
      transactions.push({
        id: `seed-exp-health-${yr}-${mo}`,
        type: 'expense',
        amount: 85,
        description: 'Consulta Médica y Medicamentos',
        category_id: 'cat-6', // Salud
        transaction_date: `${yr}-${moStr}-10`,
      });

      transactions.push({
        id: `seed-exp-edu-${yr}-${mo}`,
        type: 'expense',
        amount: 120,
        description: 'Curso en Línea de Programación',
        category_id: 'cat-7', // Educación
        transaction_date: `${yr}-${moStr}-08`,
      });
    }
  }

  // Budgets for current month
  budgets.push(
    { id: 'bgt-gen', category_id: null, amount: 2600, month: currentMonth, year: currentYear },
    { id: 'bgt-viv', category_id: 'cat-1', amount: 1200, month: currentMonth, year: currentYear },
    { id: 'bgt-ali', category_id: 'cat-2', amount: 450, month: currentMonth, year: currentYear },
    { id: 'bgt-tra', category_id: 'cat-3', amount: 200, month: currentMonth, year: currentYear },
    { id: 'bgt-ser', category_id: 'cat-4', amount: 220, month: currentMonth, year: currentYear },
    { id: 'bgt-ent', category_id: 'cat-5', amount: 150, month: currentMonth, year: currentYear },
    { id: 'bgt-com', category_id: 'cat-9', amount: 200, month: currentMonth, year: currentYear }
  );

  return { transactions, budgets, categories };
}
