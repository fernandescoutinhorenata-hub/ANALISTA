import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, AlertCircle, Shield, ArrowRight } from 'lucide-react';

interface LoginProps {
    mode?: 'login' | 'register';
}

export const Login: React.FC<LoginProps> = ({ mode = 'login' }) => {
    const [activeTab, setActiveTab] = useState<'login' | 'register'>(mode);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [teamName, setTeamName] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    React.useEffect(() => {
        setActiveTab(mode);
    }, [mode]);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (activeTab === 'register') {
                if (!teamName.trim()) throw new Error("O nome do time é obrigatório.");
                const { data, error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: { data: { team_name: teamName } }
                });
                if (signUpError) throw signUpError;
                if (data?.user) {
                    await supabase.from('profiles').insert([{
                        id: data.user.id,
                        email: email,
                        team_name: teamName,
                        creditos: 5,
                        is_admin: false,
                    }]);
                }
                navigate('/');
            } else {
                const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
                if (signInError) throw signInError;
                navigate('/');
            }
        } catch (err: any) {
            setError(err.message || 'Ocorreu um erro na autenticação.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0B0B0C] flex flex-col md:flex-row overflow-hidden font-['Inter',sans-serif]">

            {/* Background Narrative Section - Fragmented Depth */}
            <div className="hidden md:flex md:w-[65%] relative items-center justify-center p-20 overflow-hidden">
                <div className="absolute inset-0 opacity-20 pointer-events-none"
                    style={{ backgroundImage: 'radial-gradient(#2D2D30 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

                <div className="relative z-10 animate-reveal">
                    <h1 className="text-[14vw] font-black tracking-tighter leading-[0.8] mix-blend-difference text-white/5 select-none absolute -left-20 -top-20">
                        CELO<br />TRACKER
                    </h1>

                    <div className="relative">
                        <img
                            src="/image_10.png"
                            alt="Celo Logo"
                            className="w-80 h-auto grayscale brightness-125 transition-all duration-700 hover:grayscale-0 hover:scale-105 cursor-pointer"
                        />
                        <div className="mt-12 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="h-[1px] w-12 bg-[#06B6D4]" />
                                <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-[#06B6D4]">Advanced Analytics System</span>
                            </div>
                            <h2 className="text-5xl font-black text-white leading-tight">Métricas Precisas.<br />Domínio Absoluto.</h2>
                            <p className="text-zinc-500 max-w-md text-lg leading-relaxed font-medium">
                                Operando no núcleo do cenário competitivo para entregar inteligência bruta e vantagem estratégica.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="absolute bottom-12 left-12 flex gap-8">
                    {[
                        { label: 'Uptime', val: '99.9%' },
                        { label: 'Latency', val: '12ms' },
                        { label: 'Signal', val: 'Encrypted' }
                    ].map((stat, i) => (
                        <div key={i} className="flex flex-col gap-1">
                            <span className="text-[9px] uppercase tracking-widest text-zinc-600 font-bold">{stat.label}</span>
                            <span className="text-xs font-mono text-zinc-400">{stat.val}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Content Section - Asymmetric Alignment */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-16 bg-[#111113] border-l border-[#2D2D30] relative z-20">
                <div className="w-full max-w-[340px] animate-reveal" style={{ animationDelay: '0.2s' }}>

                    <header className="mb-12">
                        <div className="md:hidden flex justify-center mb-8">
                            <img src="/image_10.png" alt="Logo" className="h-16 w-auto" />
                        </div>
                        <h3 className="text-2xl font-black text-white tracking-tight mb-2">
                            {activeTab === 'login' ? 'Identificação Necessária' : 'Codificar Nova Conta'}
                        </h3>
                        <p className="text-zinc-500 text-sm font-medium">Acesse a central de comando.</p>
                    </header>

                    {/* Navigation Tab Brutalism */}
                    <div className="flex gap-2 mb-10 border-b border-[#2D2D30] pb-2">
                        {[
                            { id: 'login', label: 'Login', path: '/login' },
                            { id: 'register', label: 'Cadastro', path: '/register' }
                        ].map(tab => (
                            <Link
                                key={tab.id}
                                to={tab.path}
                                onClick={() => { setActiveTab(tab.id as any); setError(null); }}
                                className={`text-[10px] uppercase tracking-[0.2em] font-black transition-all px-2 py-1 ${activeTab === tab.id ? 'text-[#06B6D4] border-b-2 border-[#06B6D4]' : 'text-zinc-600 hover:text-white'}`}
                                style={{ textDecoration: 'none' }}
                            >
                                {tab.label}
                            </Link>
                        ))}
                    </div>

                    {error && (
                        <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-sm flex gap-3 items-start animate-reveal">
                            <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                            <span className="text-red-500 text-xs font-bold leading-relaxed">{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleAuth} className="space-y-6">
                        {activeTab === 'register' && (
                            <div className="space-y-2 group">
                                <label className="text-[9px] uppercase tracking-widest font-black text-zinc-500 group-focus-within:text-[#06B6D4] transition-colors">Nome da Unidade / Time</label>
                                <div className="relative">
                                    <Shield size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" />
                                    <input
                                        type="text"
                                        value={teamName}
                                        onChange={e => setTeamName(e.target.value)}
                                        placeholder="Ex: LOUD ALPHA"
                                        className="w-full bg-[#161618] border border-[#2D2D30] rounded-sm py-3.5 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-[#06B6D4] transition-all placeholder:text-zinc-700 placeholder:font-bold"
                                        required={activeTab === 'register'}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-2 group">
                            <label className="text-[9px] uppercase tracking-widest font-black text-zinc-500 group-focus-within:text-[#06B6D4] transition-colors">Credential Email</label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="agente@celo.io"
                                    className="w-full bg-[#161618] border border-[#2D2D30] rounded-sm py-3.5 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-[#06B6D4] transition-all placeholder:text-zinc-700 placeholder:font-bold"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2 group">
                            <label className="text-[9px] uppercase tracking-widest font-black text-zinc-500 group-focus-within:text-[#06B6D4] transition-colors">Access Override / Senha</label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••••••"
                                    className="w-full bg-[#161618] border border-[#2D2D30] rounded-sm py-3.5 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-[#06B6D4] transition-all placeholder:text-zinc-700 placeholder:font-bold"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-white text-black py-4 rounded-sm font-black text-[11px] uppercase tracking-[0.3em] flex items-center justify-center gap-2 hover:bg-[#06B6D4] hover:text-white transition-all duration-300 disabled:opacity-50 mt-4 overflow-hidden relative group"
                        >
                            <div className="absolute inset-0 w-1/2 h-full bg-white/20 skew-x-[-20deg] -translate-x-full group-hover:translate-x-[300%] transition-transform duration-700" />
                            {loading ? (
                                <div className="h-4 w-4 border-2 border-black/30 border-t-black animate-spin rounded-full" />
                            ) : (
                                <>
                                    <span>{activeTab === 'login' ? 'Conectar Filtro' : 'Inicializar Protocolo'}</span>
                                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <footer className="mt-16 pt-8 border-t border-[#2D2D30]">
                        <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest text-center leading-relaxed">
                            Celo Tracker v2.5.4 // <br className="md:hidden" />
                            Authorized Personnel Only
                        </p>
                    </footer>
                </div>
            </div>
        </div>
    );
};
