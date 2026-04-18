import React, { useState } from 'react';
import { Turnstile } from '@marsidev/react-turnstile';
import { supabase } from '../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AlertCircle } from 'lucide-react';

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
    const [captchaToken, setCaptchaToken] = useState<string | null>(null);
    const navigate = useNavigate();

    const { session } = useAuth();

    React.useEffect(() => {
        setActiveTab(mode);
        if (session) {
            navigate('/', { replace: true });
        }
    }, [mode, session, navigate]);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!captchaToken) return;
        setLoading(true);
        setError(null);

        try {
            // Validate Turnstile captcha token via Edge Function
            const { error: captchaError } = await supabase.functions.invoke('validate-captcha', {
                body: { token: captchaToken }
            });
            if (captchaError) {
                throw new Error('Verificação de segurança falhou. Tente novamente.');
            }

            if (activeTab === 'register') {
                if (!teamName.trim()) throw new Error("O nome do time é obrigatório.");
                
                // 1. Verificar Anti-Fraude (IP)
                const { data: ipCheck, error: ipError } = await supabase.functions.invoke('check-ip', {
                    body: { action: 'check' }
                });

                if (ipError) {
                    console.warn('Erro ao verificar IP (Anti-Fraude):', ipError);
                } else if (ipCheck?.bloqueado) {
                    throw new Error("Já existe uma conta cadastrada neste dispositivo.");
                }

                // 2. Prosseguir com Cadastro
                const { data, error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: { data: { team_name: teamName } }
                });
                if (signUpError) throw signUpError;
                
                if (data?.user) {
                    // 3. Registrar Perfil
                    const referral = localStorage.getItem('celo_referral');
                    await supabase.from('perfis').insert([{
                        id: data.user.id,
                        email: email,
                        nome: teamName,
                        referral_code: referral || null
                    }]);

                    if (referral) {
                        localStorage.removeItem('celo_referral');
                    }

                    // 4. Registrar IP do Novo Usuário
                    await supabase.functions.invoke('check-ip', {
                        body: { action: 'register', user_id: data.user.id }
                    });
                }
                navigate('/');
            } else {
                const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
                if (signInError) throw signInError;

                // 5. Verificar conformidade de MFA (Obrigatório para Admins)
                const { data: mfaCheck, error: mfaError } = await supabase.functions.invoke('enforce-mfa');
                
                if (!mfaError && mfaCheck?.error === 'mfa_required') {
                    navigate('/setup-mfa', { replace: true });
                    return;
                }

                navigate('/');
            }
        } catch (err: any) {
            setError(err.message || 'Ocorreu um erro na autenticação.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--bg-main)] flex flex-col md:flex-row overflow-hidden font-['Inter',sans-serif]">

            {/* Background Narrative Section */}
            <div className="hidden md:flex md:w-[60%] relative items-center justify-center p-20 overflow-hidden border-r border-[var(--border-subtle)]">
                <div className="absolute inset-0 opacity-10 pointer-events-none"
                    style={{ backgroundImage: 'radial-gradient(var(--border-strong) 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

                <div className="relative z-10 flex flex-col items-center text-center animate-reveal">
                    <img
                        src="/logo_ctracker.png"
                        alt="Celo Tracker"
                        className="h-[280px] object-contain mb-10 transition-all duration-700 hover:scale-105"
                    />
                    <div className="space-y-4">
                        <h2 className="text-5xl font-extrabold text-[var(--text-primary)] leading-tight tracking-tight">
                            Métricas Precisas.<br />Domínio Absoluto.
                        </h2>
                        <p className="text-[var(--text-secondary)] max-w-sm text-lg leading-relaxed font-medium">
                            A plataforma de análise para times competitivos de Free Fire.
                        </p>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-16 bg-[var(--bg-surface)] relative z-20">
                <div className="w-full max-w-[360px] animate-reveal">

                    <header className="mb-10 text-center md:text-left">
                        <div className="md:hidden flex justify-center mb-10">
                            <img src="/logo_ctracker.png" alt="Celo Tracker" className="h-[280px] object-contain" />
                        </div>
                        <h3 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight mb-2">
                            {activeTab === 'login' ? 'Entrar' : 'Criar conta'}
                        </h3>
                        <p className="text-[var(--text-secondary)] text-sm font-medium">
                            {activeTab === 'login' ? 'Bem-vindo ao Celo Tracker' : 'Crie sua conta gratuitamente'}
                        </p>
                    </header>

                    {/* Navigation Tab */}
                    <div className="flex gap-4 mb-8 text-label relative">
                        {[
                            { id: 'login', label: 'Entrar', path: '/login' },
                            { id: 'register', label: 'Cadastro', path: '/register' }
                        ].map(tab => (
                            <Link
                                key={tab.id}
                                to={tab.path}
                                onClick={() => { setActiveTab(tab.id as any); setError(null); }}
                                className={`transition-all pb-2 z-10 ${activeTab === tab.id ? 'text-[var(--accent)] border-b-2 border-[var(--accent)]' : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'}`}
                                style={{ textDecoration: 'none' }}
                            >
                                {tab.label}
                            </Link>
                        ))}
                    </div>
                    
                    {/* Separador Sutil */}
                    <div className="w-full h-px bg-[var(--border-subtle)] -mt-10 mb-10" />

                    {error && (
                        <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-md flex gap-3 items-start animate-reveal">
                            <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
                            <span className="text-red-500 text-sm font-medium leading-relaxed">{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleAuth} className="space-y-6">
                        {activeTab === 'register' && (
                            <div className="space-y-2 group">
                                <label className="text-[13px] font-semibold text-[var(--text-secondary)] group-focus-within:text-[var(--accent)] transition-colors">Nome do time</label>
                                <input
                                    type="text"
                                    value={teamName}
                                    onChange={e => setTeamName(e.target.value)}
                                    placeholder="Ex: LOUD, Team Liquid..."
                                    className="input-base px-4 border-[var(--border-default)] bg-[var(--bg-surface)]"
                                    required={activeTab === 'register'}
                                />
                            </div>
                        )}

                        <div className="space-y-2 group">
                            <label className="text-[13px] font-semibold text-[var(--text-secondary)] group-focus-within:text-[var(--accent)] transition-colors">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="seu@email.com"
                                className="input-base px-4 border-[var(--border-default)] bg-[var(--bg-surface)]"
                                required
                            />
                        </div>

                        <div className="space-y-2 group">
                            <label className="text-[13px] font-semibold text-[var(--text-secondary)] group-focus-within:text-[var(--accent)] transition-colors">Senha</label>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="input-base px-4 border-[var(--border-default)] bg-[var(--bg-surface)]"
                                required
                            />
                        </div>

                        {/* Cloudflare Turnstile Widget */}
                        <div className="flex justify-center">
                            <Turnstile
                                siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
                                onSuccess={(token) => setCaptchaToken(token)}
                                onExpire={() => setCaptchaToken(null)}
                                options={{ theme: 'dark' }}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !captchaToken}
                            className="btn-primary w-full py-3.5 flex items-center justify-center font-semibold text-sm rounded-[8px] mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <div className="h-5 w-5 border-2 border-white/30 border-t-white animate-spin rounded-full" />
                            ) : (
                                <span>{activeTab === 'login' ? 'Entrar' : 'Criar conta'}</span>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};
