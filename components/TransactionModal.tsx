
import React, { useState, useEffect } from 'react';
import { Transaction, TransactionType, ExpenseCategory, IncomeCategory, PaymentMethod } from '../types';
import { useApp } from '../context/AppContext';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, PAYMENT_METHODS } from '../constants';
import { X, Calendar, DollarSign, Tag, Info } from 'lucide-react';
import { formatCurrency } from '../utils/calculations';

interface TransactionModalProps {
  type: TransactionType;
  isOpen: boolean;
  onClose: () => void;
  onSave: (t: any) => void;
  editingTransaction?: Transaction | null;
}

const TransactionModal: React.FC<TransactionModalProps> = ({ type, isOpen, onClose, onSave, editingTransaction }) => {
  const { subcategories } = useApp();
  const categories = type === 'RECCEITA' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    category: categories[0] as string,
    subcategory: type === 'RECCEITA' ? '' : subcategories[0],
    description: '',
    paymentMethod: PAYMENT_METHODS[0] as PaymentMethod,
    installments: 1,
    value: 0
  });

  // Handle editing mode
  useEffect(() => {
    if (editingTransaction) {
      setFormData({
        date: editingTransaction.date.split('T')[0],
        category: editingTransaction.category,
        subcategory: editingTransaction.subcategory || '',
        description: editingTransaction.description,
        paymentMethod: editingTransaction.paymentMethod,
        installments: editingTransaction.installments || 1,
        value: editingTransaction.value
      });
    } else {
      const cats = type === 'RECCEITA' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
      setFormData({
        date: new Date().toISOString().split('T')[0],
        category: cats[0],
        subcategory: type === 'RECCEITA' ? '' : subcategories[0],
        description: '',
        paymentMethod: PAYMENT_METHODS[0] as PaymentMethod,
        installments: 1,
        value: 0
      });
    }
  }, [editingTransaction, isOpen, type, subcategories]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTransaction) {
      onSave({
        ...editingTransaction,
        ...formData,
        value: Number(formData.value),
        installments: Number(formData.installments)
      });
    } else {
      onSave({
        ...formData,
        type,
        value: Number(formData.value),
        installments: Number(formData.installments)
      });
    }
    onClose();
  };

  const previewInstallments = () => {
    if (formData.installments <= 1) return null;
    const installments = [];
    const baseDate = new Date(formData.date);
    for (let i = 1; i <= formData.installments; i++) {
      const d = new Date(baseDate);
      d.setMonth(baseDate.getMonth() + (i - 1));
      installments.push({
        num: i,
        date: d.toLocaleDateString('pt-BR'),
        val: formData.value
      });
    }
    return installments;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
          <h3 className="text-xl font-bold flex items-center gap-2">
            {editingTransaction
              ? `Editar ${type === 'RECCEITA' ? 'Receita' : 'Despesa'}`
              : `Nova ${type === 'RECCEITA' ? 'Receita' : 'Despesa'}`}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Valor (R$)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><DollarSign size={18} /></span>
                <input
                  type="number" step="0.01" required
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none transition-all text-xl font-mono font-bold"
                  value={formData.value}
                  onChange={e => setFormData({ ...formData, value: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Data</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Calendar size={18} /></span>
                <input
                  type="date" required
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Categoria</label>
              <select
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none appearance-none cursor-pointer"
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
              >
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>

            {type === 'DESPESA' && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Subcategoria</label>
                <select
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none appearance-none cursor-pointer"
                  value={formData.subcategory}
                  onChange={e => setFormData({ ...formData, subcategory: e.target.value })}
                >
                  {subcategories.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                </select>
              </div>
            )}

            <div className={`space-y-2 ${type === 'RECCEITA' ? 'md:col-span-1' : 'md:col-span-2'}`}>
              <label className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Descrição</label>
              <input
                type="text" required placeholder="Ex: Mercado mensal"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Pagamento</label>
              <select
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none"
                value={formData.paymentMethod}
                onChange={e => setFormData({ ...formData, paymentMethod: e.target.value as PaymentMethod })}
              >
                {PAYMENT_METHODS.map(pm => <option key={pm} value={pm}>{pm}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Nº Parcelas</label>
              <input
                type="number" min="1" max="60"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none font-mono"
                value={formData.installments}
                onChange={e => setFormData({ ...formData, installments: Number(e.target.value) })}
                disabled={!!editingTransaction}
              />
            </div>
          </div>

          {/* Installments Preview */}
          {formData.installments > 1 && !editingTransaction && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-2xl border border-blue-100 dark:border-blue-900/30">
              <h4 className="text-sm font-bold text-blue-800 dark:text-blue-300 mb-4 flex items-center gap-2">
                <Info size={16} /> Cronograma de Parcelas
              </h4>
              <div className="space-y-2 max-h-32 overflow-y-auto text-xs font-mono">
                {previewInstallments()?.map(item => (
                  <div key={item.num} className="flex justify-between border-b border-blue-100 dark:border-blue-900/30 pb-1">
                    <span>{item.num}/{formData.installments} - {item.date}</span>
                    <span className="font-bold">{formatCurrency(item.val)}</span>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-[10px] text-blue-600 dark:text-blue-400 italic">
                * Serão criadas {formData.installments} entradas futuras automaticamente.
              </p>
            </div>
          )}
        </form>

        <div className="px-8 py-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-6 py-2.5 font-semibold text-slate-600 hover:bg-white rounded-xl transition-all">
            Cancelar
          </button>
          <button onClick={handleSubmit} className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 active:scale-95 transition-all">
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionModal;
