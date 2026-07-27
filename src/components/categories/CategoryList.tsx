import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Category, CategoryType } from '../../types';
import { AVAILABLE_ICONS, AVAILABLE_COLORS } from '../../lib/constants';
import { IconHelper } from '../ui/IconHelper';
import { Modal } from '../ui/Modal';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { Plus, Edit2, Trash2, ShieldCheck, Tag } from 'lucide-react';

export const CategoryList: React.FC = () => {
  const { categories, addCategory, updateCategory, deleteCategory } = useFinance();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('Tag');
  const [color, setColor] = useState('#3b82f6');
  const [type, setType] = useState<CategoryType>('expense');
  const [error, setError] = useState('');

  const openCreateModal = () => {
    setEditingCategory(null);
    setName('');
    setIcon('Tag');
    setColor('#3b82f6');
    setType('expense');
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setIcon(cat.icon);
    setColor(cat.color);
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
        return <span className="text-[10px] px-2 py-0.5 font-bold rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">Ingreso</span>;
      case 'expense':
        return <span className="text-[10px] px-2 py-0.5 font-bold rounded-md bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">Gasto</span>;
      default:
        return <span className="text-[10px] px-2 py-0.5 font-bold rounded-md bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">Ambos</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Categorías
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Organiza tus gastos e ingresos con colores e iconos personalizados
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all self-start sm:self-auto"
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
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-xs"
                style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
              >
                <IconHelper name={cat.icon} className="w-5 h-5" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {cat.name}
                  </h4>
                  {cat.is_default && (
                    <span title="Categoría Predeterminada" className="inline-flex items-center">
                      <ShieldCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    </span>
                  )}
                </div>
                <div className="mt-1">{getTypeBadge(cat.type)}</div>
              </div>
            </div>

            {/* Edit / Delete for custom categories */}
            <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => openEditModal(cat)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Editar"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              {!cat.is_default && (
                <button
                  onClick={() => setDeleteId(cat.id)}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
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
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nombre de la Categoría
            </label>
            <input
              type="text"
              placeholder="Ej. Mascotas, Suscripciones, Gimnasio..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {error && <p className="text-xs text-rose-500 mt-1">{error}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Tipo
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as CategoryType)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white"
            >
              <option value="expense">Solo Gastos</option>
              <option value="income">Solo Ingresos</option>
              <option value="both">Ambos (Ingreso y Gasto)</option>
            </select>
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Color Distintivo
            </label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-xl transition-transform ${
                    color === c ? 'scale-110 ring-2 ring-indigo-500 ring-offset-2' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Icon Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Seleccionar Icono
            </label>
            <div className="grid grid-cols-5 sm:grid-cols-8 gap-2 max-h-36 overflow-y-auto p-1 border border-slate-100 dark:border-slate-800 rounded-xl">
              {AVAILABLE_ICONS.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setIcon(ic)}
                  className={`p-2 rounded-xl flex items-center justify-center transition-all ${
                    icon === ic
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <IconHelper name={ic} className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors"
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
