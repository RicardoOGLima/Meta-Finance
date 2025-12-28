
import React from 'react';
import { useApp } from '../context/AppContext';
import { Download, Upload, Trash2, ShieldAlert, Info, Github } from 'lucide-react';

const Configuracoes: React.FC = () => {
  const { transactions, assets, budgetGoals, resetData, importData } = useApp();

  const handleExport = () => {
    const data = { transactions, assets, budgetGoals };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meta-finance-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => importData(ev.target?.result as string);
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight">Configurações</h2>
        <p className="text-slate-500 dark:text-slate-400">Personalização e gerenciamento de dados.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 space-y-6">
            <h3 className="text-lg font-bold flex items-center gap-2"><Download size={20} /> Backup e Portabilidade</h3>
            <p className="text-sm text-slate-500">Exporte seus dados para um arquivo local ou restaure um backup anterior.</p>
            
            <div className="flex flex-col gap-3">
              <button 
                onClick={handleExport}
                className="flex items-center justify-center gap-2 w-full py-3 border-2 border-slate-100 dark:border-slate-700 hover:border-blue-600 hover:text-blue-600 rounded-2xl font-bold transition-all"
              >
                <Download size={18} /> Exportar Backup (JSON)
              </button>
              
              <label className="flex items-center justify-center gap-2 w-full py-3 border-2 border-slate-100 dark:border-slate-700 hover:border-blue-600 hover:text-blue-600 rounded-2xl font-bold cursor-pointer transition-all">
                <Upload size={18} /> Importar Backup (JSON)
                <input type="file" className="hidden" accept=".json" onChange={handleImport} />
              </label>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 space-y-6">
            <h3 className="text-lg font-bold flex items-center gap-2 text-red-500"><Trash2 size={20} /> Zona de Perigo</h3>
            <p className="text-sm text-slate-500">Ações irreversíveis que afetam permanentemente seus dados.</p>
            
            <button 
              onClick={() => {
                if (window.confirm('Tem certeza? Isso apagará TODAS as suas transações e ativos.')) {
                  resetData();
                }
              }}
              className="flex items-center justify-center gap-2 w-full py-3 bg-red-50 dark:bg-red-900/10 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-2xl font-bold transition-all"
            >
              <Trash2 size={18} /> Resetar Todo o Aplicativo
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 space-y-6">
            <h3 className="text-lg font-bold flex items-center gap-2"><Info size={20} /> Sobre</h3>
            <div className="space-y-4 text-sm text-slate-500">
              <div className="flex justify-between border-b dark:border-slate-700 pb-2">
                <span>Versão</span>
                <span className="font-mono">1.0.0-stable</span>
              </div>
              <div className="flex justify-between border-b dark:border-slate-700 pb-2">
                <span>Licença</span>
                <span>MIT</span>
              </div>
              <div className="flex justify-between border-b dark:border-slate-700 pb-2">
                <span>Ambiente</span>
                <span>Web / LocalStorage</span>
              </div>
            </div>
            
            <p className="text-xs leading-relaxed text-slate-400">
              Meta Finance é um projeto open-source focado em privacidade. Seus dados nunca saem do seu navegador. 
              Utilizamos o armazenamento local (LocalStorage) para persistir suas informações de forma segura.
            </p>
          </div>

          <div className="p-6 bg-slate-900 text-white rounded-3xl space-y-4">
            <div className="flex items-center gap-2 text-blue-400 font-bold">
              <ShieldAlert size={20} />
              Segurança
            </div>
            <p className="text-sm opacity-80 leading-relaxed">
              Lembre-se de fazer backups regulares. Como os dados são salvos apenas no navegador, 
              limpar o cache ou trocar de computador resultará na perda das informações se não houver um backup.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Configuracoes;
