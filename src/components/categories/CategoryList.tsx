import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Category, CategoryType } from '../../types';
import { AVAILABLE_ICONS, AVAILABLE_COLORS } from '../../lib/constants';
import { IconHelper } from '../ui/IconHelper';
import { Modal } from '../ui/Modal';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { Plus, Edit2, Trash2, ShieldCheck } from 'lucide-react';

export const CategoryList: React.FC = () => {
  const { categories, addCategory, updateCategory, deleteCategory } = useFinance();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('Tag');
  const [color, setColor] = useState('#00E5FF');
  const [type, setType] = useState<CategoryType>('expense');
  const [error, setError] = useState('');

  const openCreateModal = () => {
    setEditingCategory(null);
    setName('');
    setIcon('Tag');
    setColor('#00E5FF');
    setType('expense');
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setIcon(cat.icon);
    setColor(cat.color || '#00E5FF');
    setType(cat.type);
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('El nombre de la categoría es requerido.');
      return;
    }

    if (editingCategory) {
      updateCategory(editingCategory.id, {
        name: name.trim(),
        icon,
        color,
        type,
      });
    } else {
      addCategory({
        name: name.trim(),
        icon,
        color,
        type,
      });
    }

    setIsModalOpen(false);
  };

  const getTypeBadge = (t: CategoryType) => {
    switch (t) {
      case 'income':
        return <span className="text-[10px] px-2 py-0.5 font-bold rounded-md bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/30">Ingreso</span>;
      case 'expense':
        return <span className="text-[10px] px-2 py-0.5 font-bold rounded-md bg-[#FFFFFF]/10 text-[#FFFFFF] border border-[#FFFFFF]/30">Gasto</span>;
      default:
        return <span className="text-[10px] px-2 py-0.5 font-bold rounded-md bg-[#94A3B8]/10 text-[#94A3B8] border border-[#94A3B8]/30">Ambos</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#FFFFFF]">
            Categorías
          </h2>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Organiza tus gastos e ingresos bajo la paleta oficial de Upfunnel
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#00E5FF] hover:bg-[#00E5FF]/90 text-[#080C14] text-xs font-bold shadow-md shadow-[#00E5FF]/20 transition-all self-start sm:self-auto uf-glow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Categoría</span>
        </button>
      </div>

      {/* Grid of Categories */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="p-4 rounded-2xl bg-[#080C14] border border-[#94A3B8]/20 shadow-xs hover:border-[#00E5FF]/40 transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-[#080C14] border border-[#00E5FF]/40 text-[#00E5FF] flex items-center justify-center shrink-0 shadow-xs uf-glow-sm">
                <IconHelper name={cat.icon} className="w-5 h-5" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-[#FFFFFF] truncate">
                    {cat.name}
                  </h4>
                  {cat.is_default && (
                    <span title="Categoría Predeterminado" className="inline-flex items-center">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
                    </span>
                  )}
                </div>
                <div className="mt-1">{getTypeBadge(cat.type)}</div>
              </div>
            </div>

            {/* Edit / Delete */}
            <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => openEditModal(cat)}
                className="p-2 rounded-xl text-[#94A3B8] hover:text-[#00E5FF] hover:bg-[#00E5FF]/10 transition-colors"
                title="Editar"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              {!cat.is_default && (
                <button
                  onClick={() => setDeleteId(cat.id)}
                  className="p-2 rounded-xl text-[#94A3B8] hover:text-[#FFFFFF] hover:bg-[#FFFFFF]/10 transition-colors"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal Form */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
              Nombre de la Categoría
            </label>
            <input
              type="text"
              placeholder="Ej. Mascotas, Suscripciones, Gimnasio..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#080C14] border border-[#94A3B8]/30 rounded-xl text-xs font-medium text-[#FFFFFF] focus:outline-none focus:border-[#00E5FF]"
            />
            {error && <p className="text-xs text-[#FFFFFF] font-bold mt-1">{error}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
              Tipo
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as CategoryType)}
              className="w-full px-3.5 py-2.5 bg-[#080C14] border border-[#94A3B8]/30 rounded-xl text-xs font-medium text-[#FFFFFF] focus:border-[#00E5FF]"
            >
              <option value="expense">Solo Gastos</option>
              <option value="income">Solo Ingresos</option>
              <option value="both">Ambos (Ingreso y Gasto)</option>
            </select>
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] mb-2">
              Color Distintivo (Oficial Upfunnel)
            </label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-xl transition-transform border ${
                    color === c ? 'scale-110 border-[#00E5FF] ring-2 ring-[#00E5FF]/50' : 'border-[#94A3B8]/20 hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Icon Selector */}
          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] mb-2">
              Seleccionar Icono
            </label>
            <div className="grid grid-cols-5 sm:grid-cols-8 gap-2 max-h-36 overflow-y-auto p-1 border border-[#94A3B8]/20 rounded-xl bg-[#080C14]">
              {AVAILABLE_ICONS.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setIcon(ic)}
                  className={`p-2 rounded-xl flex items-center justify-center transition-all ${
                    icon === ic
                      ? 'bg-[#00E5FF] text-[#080C14] font-bold uf-glow-sm'
                      : 'bg-[#080C14] text-[#94A3B8] hover:bg-[#94A3B8]/10 hover:text-[#FFFFFF]'
                  }`}
                >
                  <IconHelper name={ic} className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#94A3B8]/20">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2.5 rounded-xl border border-[#94A3B8]/30 text-[#94A3B8] text-xs font-semibold hover:text-[#FFFFFF]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#00E5FF] text-[#080C14] text-xs font-bold hover:bg-[#00E5FF]/90 uf-glow-sm"
            >
              {editingCategory ? 'Guardar Cambios' : 'Crear Categoría'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) deleteCategory(deleteId);
        }}
        title="¿Eliminar categoría personalizada?"
        description="Las transacciones asociadas conservarán la categoría o pasarán a categoría predeterminada."
      />
    </div>
  );
};
