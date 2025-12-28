import React, { useState } from 'react';
import { supabase } from '../utils/supabase';
import { LogIn, UserPlus, Mail, Lock, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

const Login: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                toast.success('Bem-vindo de volta!');
            } else {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                toast.success('Conta criada! Verifique seu e-mail para confirmar.');
            }
        } catch (error: any) {
            toast.error(error.message || 'Erro ao processar solicitação');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center p-4">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[25%] -left-[10%] w-[60%] h-[60%] bg-blue-600/5 rounded-full blur-[120px]" />
                <div className="absolute -bottom-[25%] -right-[10%] w-[60%] h-[60%] bg-indigo-600/5 rounded-full blur-[120px]" />
            </div>

            <div className="w-full max-w-lg relative">
                <div className="bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl shadow-blue-900/10 border border-slate-100 dark:border-slate-800 p-8 md:p-12 transition-all">
                    <div className="flex flex-col items-center mb-10">
                        <div className="w-20 h-20 mb-6 relative group">
                            <div className="absolute inset-0 bg-blue-600 blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
                            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain relative rounded-2xl" />
                        </div>
                        <h1 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white mb-2">Meta Finance</h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium text-center">
                            {isLogin ? 'Transforme seu planejamento financeiro hoje.' : 'Comece sua jornada rumo à liberdade financeira.'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">E-mail</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                                <input
                                    type="email"
                                    required
                                    placeholder="exemplo@email.com"
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-50 dark:border-slate-700 rounded-2xl outline-none focus:border-blue-600 dark:focus:border-blue-600 transition-all font-medium"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Senha</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                                <input
                                    type="password"
                                    required
                                    placeholder="Min. 6 caracteres"
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-50 dark:border-slate-700 rounded-2xl outline-none focus:border-blue-600 dark:focus:border-blue-600 transition-all font-medium"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-xl shadow-blue-600/25 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin" />
                            ) : isLogin ? (
                                <>
                                    <LogIn size={22} /> Entrar no sistema
                                </>
                            ) : (
                                <>
                                    <UserPlus size={22} /> Criar conta agora
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-10 flex flex-col items-center gap-4">
                        <div className="flex items-center gap-2 text-slate-400">
                            <div className="h-px w-12 bg-slate-100 dark:bg-slate-800" />
                            <span className="text-sm font-medium">ou</span>
                            <div className="h-px w-12 bg-slate-100 dark:bg-slate-800" />
                        </div>

                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-blue-600 dark:text-blue-400 font-bold hover:underline transition-all"
                        >
                            {isLogin ? 'Não tem uma conta? Registre-se' : 'Já tem uma conta? Entre aqui'}
                        </button>
                    </div>

                    <div className="mt-12 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-100 dark:border-amber-800/30 flex items-start gap-3">
                        <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={18} />
                        <p className="text-[11px] text-amber-800 dark:text-amber-400 leading-normal font-medium">
                            {isLogin
                                ? "Caso suas credenciais não estejam configuradas no .env.local, o login falhará visualmente."
                                : "Após o registro, um e-mail de confirmação será enviado via Supabase por padrão."
                            }
                        </p>
                    </div>
                </div>

                <p className="mt-8 text-center text-slate-400 text-xs font-medium uppercase tracking-widest">
                    © {new Date().getFullYear()} Meta Finance · Advanced Agentic Coding
                </p>
            </div>
        </div>
    );
};

export default Login;
