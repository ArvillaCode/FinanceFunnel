import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { useFinance } from '../../context/FinanceContext';
import { Transaction, TransactionType } from '../../types';
import { DollarSign, Tag, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';

interface TransactionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionToEdit?: Transaction | null;
}

export const TransactionFormModal: React.FC<TransactionFormModalProps> = ({
  isOpen,
  onClose,
  transactionToEdit,
}) => {
  const { categories, addTransaction, updateTransaction, selectedMonth, selectedYear } = useFinance();

  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (transactionToEdit) {
      setType(transactionToEdit.type);
      setAmount(transactionToEdit.amount.toString());
      setDescription(transactionToEdit.description);
      setCategoryId(transactionToEdit.category_id);
      setDate(transactionToEdit.transaction_date);
      setNotes(transactionToEdit.notes || '');
    } else {
      setType('expense');
      setAmount('');
      setDescription('');
      const today = new Date();
      const yrStr = String(selectedYear);
      const moStr = String(selectedMonth).padStart(2, '0');
      const dayStr = String(today.getDate()).padStart(2, '0');
      setDate(`${yrStr}-${moStr}-${dayStr}`);
      setNotes('');
    }
    setErrors({});
  }, [transactionToEdit, isOpen, selectedMonth, selectedYear]);

  const availableCategories = categories.filter(
    (c) => c.type === 'both' || c.type === type
  );

  useEffect(() => {
    if (availableCategories.length > 0 && !availableCategories.some((c) => c.id === categoryId)) {
      setCategoryId(availableCategories[0].id);
    }
  }, [type, availableCategories]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      newErrors.amount = 'Ingresa un monto válido mayor a 0';
    }

    if (!description.trim()) {
      newErrors.description = 'La descripción es obligatoria';
    }

    if (!categoryId) {
      newErrors.category = 'Selecciona una categoría';
    }

    if (!date) {
      newErrors.date = 'Selecciona una fecha';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (transactionToEdit) {
      updateTransaction(transactionToEdit.id, {
        type,
        amount: numAmount,
        description: description.trim(),
        category_id: categoryId,
        transaction_date: date,
        notes: notes.trim(),
      });
    } else {
      addTransaction({
        type,
        amount: numAmount,
        description: description.trim(),
        category_id: categoryId,
        transaction_date: date,
        notes: notes.trim(),
      });
    }

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={transactionToEdit ? 'Editar Transacción' : 'Nueva Transacción'}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type Selector Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-[#080C14] border border-[#94A3B8]/20 rounded-xl">
          <button
            type="button"
            onClick={() => setType('expense')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
              type === 'expense'
                ? 'bg-[#FFFFFF] text-[#080C14] shadow-sm'
                : 'text-[#94A3B8] hover:text-[#FFFFFF]'
            }`}
          >
            <ArrowDownCircle className="w-4 h-4" />
            <span>Gasto (-)</span>
          </button>

          <button
            type="button"
            onClick={() => setType('income')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
              type === 'income'
                ? 'bg-[#00E5FF] text-[#080C14] shadow-sm uf-glow-sm'
                : 'text-[#94A3B8] hover:text-[#FFFFFF]'
            }`}
          >
            <ArrowUpCircle className="w-4 h-4" />
            <span>Ingreso (+)</span>
          </button>
        </div>

        {/* Amount */}
        <div>
          <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
            Monto ($)
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8]" />
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#080C14] border border-[#94A3B8]/30 rounded-xl text-lg font-bold text-[#FFFFFF] focus:outline-none focus:border-[#00E5FF]"
            />
          </div>
          {errors.amount && <p className="text-xs text-[#FFFFFF] font-bold mt-1">{errors.amount}</p>}
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
            Descripción
          </label>
          <input
            type="text"
            placeholder="Ej. Supermercado, Nomina, Restaurante..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-[#080C14] border border-[#94A3B8]/30 rounded-xl text-xs font-medium text-[#FFFFFF] focus:outline-none focus:border-[#00E5FF]"
          />
          {errors.description && <p className="text-xs text-[#FFFFFF] font-bold mt-1">{errors.description}</p>}
        </div>

        {/* Category & Date Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
              Categoría
            </label>
            <div className="relative">
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full pl-3 pr-8 py-2.5 bg-[#080C14] border border-[#94A3B8]/30 rounded-xl text-xs font-medium text-[#FFFFFF] focus:outline-none focus:border-[#00E5FF] appearance-none cursor-pointer"
              >
                {availableCategories.map((c) => (
                  <option key={c.id} value={c.id} className="bg-[#080C14] text-[#FFFFFF]">
                    {c.name}
                  </option>
                ))}
              </select>
              <Tag className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] pointer-events-none" />
            </div>
            {errors.category && <p className="text-xs text-[#FFFFFF] font-bold mt-1">{errors.category}</p>}
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
              Fecha
            </label>
            <div className="relative">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#080C14] border border-[#94A3B8]/30 rounded-xl text-xs font-medium text-[#FFFFFF] focus:outline-none focus:border-[#00E5FF]"
              />
            </div>
            {errors.date && <p className="text-xs text-[#FFFFFF] font-bold mt-1">{errors.date}</p>}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
            Notas Adicionales (Opcional)
          </label>
          <textarea
            rows={2}
            placeholder="Añade detalles o recibo..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3.5 py-2 bg-[#080C14] border border-[#94A3B8]/30 rounded-xl text-xs text-[#FFFFFF] focus:outline-none focus:border-[#00E5FF]"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#94A3B8]/20">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-[#94A3B8]/30 text-[#94A3B8] text-xs font-semibold hover:text-[#FFFFFF]"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-[#00E5FF] text-[#080C14] text-xs font-bold hover:bg-[#00E5FF]/90 uf-glow-sm"
          >
            {transactionToEdit ? 'Guardar Cambios' : 'Crear Transacción'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
