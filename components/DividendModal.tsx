
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { DividendType, Asset, Dividend } from '../types';
import { X, Search, Filter } from 'lucide-react';
import { Badge } from './ui';

interface DividendModalProps {
    isOpen: boolean;
    onClose: () => void;
    editingDividend?: Dividend | null;
}

const DividendModal: React.FC<DividendModalProps> = ({ isOpen, onClose, editingDividend }) => {
    const { assets, addDividend, updateDividend } = useApp();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedClass, setSelectedClass] = useState('Todas');
    const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [type, setType] = useState<DividendType>('Dividendos');
    const [valuePerShare, setValuePerShare] = useState<number>(0);
    const [totalValue, setTotalValue] = useState<number>(0);

    React.useEffect(() => {
        if (editingDividend && isOpen) {
            setDate(editingDividend.date);
            setType(editingDividend.type);
            setValuePerShare(editingDividend.valuePerShare);
            setTotalValue(editingDividend.totalValue);
            const asset = assets.find(a => a.id === editingDividend.assetId);
            setSelectedAsset(asset || null);
        } else if (isOpen) {
            setDate(new Date().toISOString().split('T')[0]);
            setType('Dividendos');
            setValuePerShare(0);
            setTotalValue(0);
            setSelectedAsset(null);
            setSearchTerm('');
        }
    }, [editingDividend, assets, isOpen]);

    const classes = ['Todas', ...Array.from(new Set(assets.map(a => a.class)))];

    const filteredAssets = useMemo(() => {
        return assets
            .filter(a => selectedClass === 'Todas' || a.class === selectedClass)
            .filter(a => a.ticker.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [assets, selectedClass, searchTerm]);

    if (!isOpen) return null;

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedAsset) return;

        if (editingDividend) {
            updateDividend({
                ...editingDividend,
                date,
                assetId: selectedAsset.id,
                ticker: selectedAsset.ticker,
                class: selectedAsset.class,
                type,
                valuePerShare,
                totalValue
            });
        } else {
            addDividend({
                date,
                assetId: selectedAsset.id,
                ticker: selectedAsset.ticker,
                class: selectedAsset.class,
                type,
                valuePerShare,
                totalValue
            });
        }

        // Reset and close
        setSelectedAsset(null);
        setValuePerShare(0);
        setTotalValue(0);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                        {editingDividend ? 'Editar Provento' : 'Registrar Provento'}
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                <form onSubmit={handleSave} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left side: Asset Selection */}
                    <div className="space-y-4">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Selecionar Ativo</label>

                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="Buscar ticker..."
                                    className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-600 transition-all font-bold"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="relative">
                                <select
                                    className="pl-3 pr-8 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none appearance-none cursor-pointer font-bold"
                                    value={selectedClass}
                                    onChange={e => setSelectedClass(e.target.value)}
                                >
                                    {classes.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <Filter size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                        </div>

                        <div className="h-64 overflow-y-auto pr-2 custom-scrollbar space-y-2">
                            {filteredAssets.length > 0 ? filteredAssets.map(asset => (
                                <button
                                    key={asset.id}
                                    type="button"
                                    onClick={() => setSelectedAsset(asset)}
                                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${selectedAsset?.id === asset.id
                                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                                        : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                                        }`}
                                >
                                    <div className="text-left">
                                        <div className="font-bold text-slate-900 dark:text-slate-100">{asset.ticker}</div>
                                        <div className="text-[10px] text-slate-400 font-medium">{asset.class}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs font-mono text-slate-500">{asset.quantity} un.</div>
                                    </div>
                                </button>
                            )) : (
                                <div className="text-center py-8 text-slate-400 text-xs italic">
                                    Nenhum ativo encontrado.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right side: Dividend Details */}
                    <div className="space-y-5">
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-800/50">
                            {selectedAsset ? (
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Ativo Selecionado</p>
                                        <h4 className="text-xl font-black text-slate-900 dark:text-slate-100 leading-none">{selectedAsset.ticker}</h4>
                                    </div>
                                    <Badge label={selectedAsset.class} variant="investment" />
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-4 text-center">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 mb-2">
                                        <Search size={20} />
                                    </div>
                                    <p className="text-xs text-blue-600 font-bold">Selecione um ativo na lista ao lado.</p>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="flex items-end h-8 text-xs font-black text-slate-400 uppercase tracking-wider pb-1">Data do Recebimento</label>
                                <input
                                    type="date"
                                    required
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                                    value={date}
                                    onChange={e => setDate(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="flex items-end h-8 text-xs font-black text-slate-400 uppercase tracking-wider pb-1">Tipo</label>
                                <select
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-600 transition-all font-bold appearance-none cursor-pointer"
                                    value={type}
                                    onChange={e => setType(e.target.value as DividendType)}
                                >
                                    <option value="Dividendos">Dividendos</option>
                                    <option value="JSCP">JSCP</option>
                                    <option value="Rendimento">Rendimento</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-4 pt-2">
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-wider">Valor Unitário (R$)</label>
                                    {selectedAsset && (
                                        <button
                                            type="button"
                                            onClick={() => setTotalValue(Number((valuePerShare * selectedAsset.quantity).toFixed(2)))}
                                            className="text-[10px] text-blue-600 font-bold hover:underline"
                                        >
                                            Calcular Total
                                        </button>
                                    )}
                                </div>
                                <input
                                    type="number"
                                    step="0.0001"
                                    required
                                    placeholder="0,00"
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-lg font-mono outline-none focus:ring-2 focus:ring-blue-600"
                                    value={valuePerShare || ''}
                                    onChange={e => setValuePerShare(Number(e.target.value))}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-wider">Valor Total Líquido (R$)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    required
                                    placeholder="0,00"
                                    className="w-full px-4 py-3 bg-blue-50/30 dark:bg-blue-900/5 border border-blue-200 dark:border-blue-800 rounded-xl text-2xl font-black text-blue-600 font-mono outline-none focus:ring-2 focus:ring-blue-600"
                                    value={totalValue || ''}
                                    onChange={e => setTotalValue(Number(e.target.value))}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={!selectedAsset}
                            className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-2xl font-black text-lg shadow-xl shadow-blue-600/20 active:scale-95 transition-all mt-4"
                        >
                            {editingDividend ? 'Salvar Alterações' : 'Confirmar Registro'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DividendModal;
