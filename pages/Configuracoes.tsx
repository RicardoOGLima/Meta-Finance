
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Download, Upload, Trash2, ShieldAlert, Info, FolderSync, Monitor, CheckCircle, Tag, Pencil, Calendar, RefreshCw } from 'lucide-react';
import { PageHeader, Card } from '../components/ui';
import { storage } from '../utils/storage';
import { open } from '@tauri-apps/plugin-dialog';
import toast from 'react-hot-toast';

const Configuracoes: React.FC = () => {
  const { transactions, assets, budgetGoals, subcategories, updateSubcategories, resetData, importData } = useApp();
  const [desktopPath, setDesktopPath] = useState<string>('');
  const [newSubName, setNewSubName] = useState('');
  const [editingSub, setEditingSub] = useState<{ index: number, name: string } | null>(null);
  const [backups, setBackups] = useState<{ name: string, date: Date, size: number }[]>([]);

  useEffect(() => {
    if (storage.isDesktop()) {
      storage.getConfiguredPath().then(setDesktopPath);
      loadBackups();
    }
  }, []);

  const loadBackups = async () => {
    try {
      const list = await storage.listBackups();
      setBackups(list);
    } catch (e) {
      console.error('Failed to load backups', e);
    }
  };

  const handleRestoreBackup = async (filename: string) => {
    if (!window.confirm('ATENÇÃO: Restaurar este backup substituirá todos os dados atuais.\n\nO sistema fará um arquivo de segurança do estado atual antes de prosseguir.\n\nDeseja continuar?')) return;

    const toastId = toast.loading('Restaurando backup...');
    try {
      await storage.restoreBackup(filename);
      toast.success('Backup restaurado! O aplicativo será recarregado.', { id: toastId });
      setTimeout(() => window.location.reload(), 2000);
    } catch (e) {
      console.error(e);
      toast.error('Erro ao restaurar backup.', { id: toastId });
    }
  };

  const handleSelectFolder = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Selecione sua pasta do Google Drive'
      });

      if (selected && typeof selected === 'string') {
        // We append /data.json to the selected folder
        const fullPath = `${selected}\\data.json`.replace(/\\\\/g, '\\');
        storage.setConfiguredPath(fullPath);
        setDesktopPath(fullPath);
        toast.success('Pasta de sincronização atualizada!');
      }
    } catch (error) {
      console.error('Erro ao selecionar pasta:', error);
      toast.error('Não foi possível selecionar a pasta.');
    }
  };

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

  const handleAddSub = () => {
    if (!newSubName.trim()) return;
    if (subcategories.includes(newSubName.trim())) {
      toast.error('Esta subcategoria já existe!');
      return;
    }
    updateSubcategories([...subcategories, newSubName.trim()]);
    setNewSubName('');
  };

  const handleEditSub = () => {
    if (!editingSub || !editingSub.name.trim()) return;
    const newList = [...subcategories];
    newList[editingSub.index] = editingSub.name.trim();
    updateSubcategories(newList);
    setEditingSub(null);
  };

  const handleDeleteSub = (index: number) => {
    if (window.confirm('Tem certeza que deseja excluir esta subcategoria?')) {
      const newList = subcategories.filter((_, i) => i !== index);
      updateSubcategories(newList);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        title="Configurações"
        description="Personalização e gerenciamento de dados."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          {storage.isDesktop() && (
            <Card
              padding="large"
              title="Sincronização Desktop"
              headerAction={<Monitor size={20} className="text-blue-600" />}
              subtitle="Seus dados são salvos automaticamente no arquivo local abaixo."
            >
              <div className="space-y-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Caminho Atual</span>
                  <p className="text-xs font-mono text-slate-600 dark:text-slate-300 break-all">{desktopPath}</p>
                </div>

                <button
                  onClick={handleSelectFolder}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 text-white hover:bg-blue-700 rounded-2xl font-bold transition-all shadow-lg shadow-blue-600/20"
                >
                  <FolderSync size={18} /> Alterar Pasta de Sincronização
                </button>

                <div className="flex items-start gap-2 text-[11px] text-green-600 dark:text-green-400 font-medium bg-green-50 dark:bg-green-900/10 p-3 rounded-xl">
                  <CheckCircle size={14} className="shrink-0 mt-0.5" />
                  Sincronização automática ativa. Qualquer alteração no app será salva instantaneamente neste arquivo.
                </div>
              </div>
            </Card>
          )}

          <Card
            padding="large"
            title="Backup e Portabilidade"
            headerAction={<Download size={20} />}
            subtitle="Exporte seus dados para um arquivo local ou restaure um backup anterior."
          >
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
          </Card>

          {storage.isDesktop() && (
            <Card
              padding="large"
              title="Histórico de Backups"
              headerAction={<Calendar size={20} className="text-purple-600" />}
              subtitle="Pontos de restauração automáticos (Ontem, Semana passada)."
            >
              <div className="space-y-3">
                {backups.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-sm">
                    <Calendar size={32} className="mx-auto mb-2 opacity-20" />
                    Nenhum backup encontrado ainda.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {backups.map((backup) => (
                      <div key={backup.name} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 group hover:border-purple-200 dark:hover:border-purple-900 transition-colors">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                            {new Date(backup.date).toLocaleString()}
                            {Date.now() - new Date(backup.date).getTime() < 86400000 && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-md">Novo</span>}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {(backup.size / 1024).toFixed(1)} KB • {backup.name}
                          </span>
                        </div>
                        <button
                          onClick={() => handleRestoreBackup(backup.name)}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-purple-600 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/40 rounded-lg transition-all opacity-80 hover:opacity-100"
                        >
                          <RefreshCw size={14} /> Restaurar
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-3 border-t dark:border-slate-700 text-center">
                  <p className="text-[10px] text-slate-400">
                    O sistema mantém automaticamente o backup mais recente, um de ontem e um da semana passada.
                  </p>
                </div>
              </div>
            </Card>
          )}

          <Card
            padding="large"
            title="Zona de Perigo"
            headerAction={<Trash2 size={20} className="text-red-500" />}
            subtitle="Ações irreversíveis que afetam permanentemente seus dados."
          >
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
          </Card>
        </div>

        <div className="space-y-6">
          <Card
            padding="large"
            title="Sobre"
            headerAction={<Info size={20} />}
          >
            <div className="space-y-4 text-sm text-slate-500">
              <div className="flex justify-between border-b dark:border-slate-700 pb-2">
                <span>Versão</span>
                <span className="font-mono">1.1.0-hybrid</span>
              </div>
              <div className="flex justify-between border-b dark:border-slate-700 pb-2">
                <span>Licença</span>
                <span>MIT</span>
              </div>
              <div className="flex justify-between border-b dark:border-slate-700 pb-2">
                <span>Ambiente</span>
                <span>{storage.isDesktop() ? 'Desktop / File System' : 'Web / LocalStorage'}</span>
              </div>
            </div>

            <p className="mt-6 text-xs leading-relaxed text-slate-400">
              Meta Finance é um projeto open-source focado em privacidade.
              {storage.isDesktop()
                ? ' Na versão desktop, seus dados são armazenados diretamente no seu computador em um arquivo JSON.'
                : ' Seus dados nunca saem do seu navegador. Utilizamos o armazenamento local (LocalStorage).'}
            </p>
          </Card>

          {!storage.isDesktop() && (
            <div className="p-6 bg-slate-900 text-white rounded-3xl space-y-4">
              <div className="flex items-center gap-2 text-blue-400 font-bold">
                <ShieldAlert size={20} />
                Segurança
              </div>
              <p className="text-sm opacity-80 leading-relaxed">
                Lembre-se de fazer backups regulares. Como os dados são salvos apenas no navegador,
                limpar o cache ou trocar de computador resultará na perda das informações se não houver um backup.
                <b> Dica: Use a versão Desktop para sincronização automática com o Google Drive!</b>
              </p>
            </div>
          )}

          <Card
            padding="large"
            title="Gerenciar Subcategorias"
            headerAction={<Tag size={20} className="text-blue-600" />}
            subtitle="Adicione ou edite subcategorias de despesas."
          >
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nova subcategoria..."
                  className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 transition-all text-sm"
                  value={newSubName}
                  onChange={e => setNewSubName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddSub()}
                />
                <button
                  onClick={handleAddSub}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all text-sm"
                >
                  Adicionar
                </button>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                {subcategories.map((sub, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-xl group">
                    {editingSub?.index === idx ? (
                      <div className="flex gap-2 w-full">
                        <input
                          type="text"
                          className="flex-1 px-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-1 focus:ring-blue-600 text-sm"
                          value={editingSub.name}
                          onChange={e => setEditingSub({ ...editingSub, name: e.target.value })}
                          onKeyDown={e => e.key === 'Enter' && handleEditSub()}
                          autoFocus
                        />
                        <button onClick={handleEditSub} className="text-green-600 hover:text-green-700 font-bold text-xs uppercase">Salvar</button>
                        <button onClick={() => setEditingSub(null)} className="text-slate-400 hover:text-slate-500 font-bold text-xs uppercase">X</button>
                      </div>
                    ) : (
                      <>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{sub}</span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setEditingSub({ index: idx, name: sub })}
                            className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteSub(idx)}
                            className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Configuracoes;
