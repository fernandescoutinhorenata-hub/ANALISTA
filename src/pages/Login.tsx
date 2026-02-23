import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, UserPlus, Lock, Mail, AlertCircle, Shield } from 'lucide-react';

interface LoginProps {
    mode?: 'login' | 'register';
}

export const Login: React.FC<LoginProps> = ({ mode = 'login' }) => {
    const [activeTab, setActiveTab] = useState<'login' | 'register'>(mode);

    React.useEffect(() => {
        setActiveTab(mode);
    }, [mode]);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [teamName, setTeamName] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const COLORS = {
        background: '#0A0E17',
        cardTitle: '#FFFFFF',
        textSoft: '#7A8291',
        purple: '#8A2BE2',
        cyan: '#00BFFF',
        danger: '#FF0055',
        cardBg: '#0D1117',
        border: '#2A3042'
    };

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (activeTab === 'register') {
                if (!teamName.trim()) {
                    throw new Error("O nome do time é obrigatório.");
                }
                const { data, error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            team_name: teamName,
                        }
                    }
                });

                if (signUpError) throw signUpError;

                // Create initial profile with 0 credits and team name
                if (data?.user) {
                    const { error: profileError } = await supabase
                        .from('profiles')
                        .insert([
                            {
                                id: data.user.id,
                                email: email,
                                team_name: teamName,
                                creditos: 5,
                                is_admin: false,
                            }
                        ]);
                    if (profileError) {
                        console.error('Falha ao criar perfil inicial:', profileError);
                    }
                }

                alert(`Bem-vindo, Membro do ${teamName}!`);
                navigate('/');
            } else {
                const { data, error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (signInError) throw signInError;

                // Fetch team name? Optional, could just say welcome
                alert(`Bem-vindo de volta, ${data?.user?.email}!`);
                navigate('/');
            }
        } catch (err: any) {
            setError(err.message || 'Ocorreu um erro durante a autenticação.');
        } finally {
            setLoading(false);
            // Don't auto-clear password so user can try again
        }
    };

    return (
        <div style={{ backgroundColor: COLORS.background, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', fontFamily: 'Inter, sans-serif' }}>

            {/* Efeitos Giga de Fundo Estético */}
            <div style={{ position: 'absolute', top: '10%', left: '20%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(138,43,226,0.15) 0%, rgba(10,14,23,0) 70%)', filter: 'blur(40px)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: '10%', right: '20%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(0,191,255,0.1) 0%, rgba(10,14,23,0) 70%)', filter: 'blur(40px)', pointerEvents: 'none' }} />

            <div style={{ width: '100%', maxWidth: '420px', backgroundColor: COLORS.cardBg, border: `1px solid ${COLORS.border}`, borderRadius: '24px', padding: '32px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(138,43,226, 0.05)', position: 'relative', zIndex: 10 }}>

                {/* Logo Giga Centralizada */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px' }}>
                    <img
                        src="/image_10.png"
                        alt="Logo Celo Tracker"
                        style={{ height: '100px', width: 'auto', objectFit: 'contain', imageRendering: 'high-quality' as any, marginBottom: '16px' }}
                    />
                    <h2 style={{ fontSize: '24px', fontWeight: 800, color: COLORS.cardTitle, letterSpacing: '-0.5px' }}>
                        Portal de Acesso
                    </h2>
                    <p style={{ color: COLORS.textSoft, fontSize: '14px', marginTop: '4px' }}>Gerencie a elite do cenário com precisão.</p>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', backgroundColor: '#0A0E17', borderRadius: '12px', padding: '4px', marginBottom: '24px', border: `1px solid ${COLORS.border}` }}>
                    <Link
                        to="/login"
                        onClick={() => setError(null)}
                        style={{
                            flex: 1, padding: '10px 0', borderRadius: '8px', fontSize: '14px', fontWeight: 600, transition: 'all 0.2s',
                            backgroundColor: activeTab === 'login' ? '#1E2332' : 'transparent',
                            color: activeTab === 'login' ? COLORS.cardTitle : COLORS.textSoft,
                            border: activeTab === 'login' ? `1px solid ${COLORS.border}` : '1px solid transparent',
                            textDecoration: 'none',
                            textAlign: 'center'
                        }}
                    >
                        Entrar
                    </Link>
                    <Link
                        to="/register"
                        onClick={() => setError(null)}
                        style={{
                            flex: 1, padding: '10px 0', borderRadius: '8px', fontSize: '14px', fontWeight: 600, transition: 'all 0.2s',
                            backgroundColor: activeTab === 'register' ? '#1E2332' : 'transparent',
                            color: activeTab === 'register' ? COLORS.cardTitle : COLORS.textSoft,
                            border: activeTab === 'register' ? `1px solid ${COLORS.border}` : '1px solid transparent',
                            textDecoration: 'none',
                            textAlign: 'center'
                        }}
                    >
                        Criar Conta
                    </Link>
                </div>

                {error && (
                    <div style={{ backgroundColor: `${COLORS.danger}15`, border: `1px solid ${COLORS.danger}30`, color: COLORS.danger, padding: '12px', borderRadius: '12px', display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '24px', fontSize: '13px', lineHeight: 1.5 }}>
                        <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                    {/* Campos de Input c/ classes embutidas para focus/hover */}
                    {activeTab === 'register' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '13px', fontWeight: 600, color: COLORS.cardTitle, marginLeft: '4px' }}>Nome do Time</label>
                            <div style={{ position: 'relative' }}>
                                <Shield size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: COLORS.textSoft }} />
                                <input
                                    type="text"
                                    value={teamName}
                                    onChange={(e) => setTeamName(e.target.value)}
                                    placeholder="Ex: LOUD, Fluxo, paiN..."
                                    required={activeTab === 'register'}
                                    className="w-full bg-[#0A0E17] border border-[#2A3042] rounded-xl py-3 pl-11 pr-4 text-white placeholder-[#4A5568] focus:outline-none focus:border-[#00BFFF] focus:ring-1 focus:ring-[#00BFFF] transition-all"
                                />
                            </div>
                        </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '13px', fontWeight: 600, color: COLORS.cardTitle, marginLeft: '4px' }}>E-mail Escalonado</label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: COLORS.textSoft }} />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="analista@exemplo.com"
                                required
                                className="w-full bg-[#0A0E17] border border-[#2A3042] rounded-xl py-3 pl-11 pr-4 text-white placeholder-[#4A5568] focus:outline-none focus:border-[#00BFFF] focus:ring-1 focus:ring-[#00BFFF] transition-all"
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '13px', fontWeight: 600, color: COLORS.cardTitle, marginLeft: '4px' }}>Senha de Segurança</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: COLORS.textSoft }} />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="•••••••••"
                                required
                                className="w-full bg-[#0A0E17] border border-[#2A3042] rounded-xl py-3 pl-11 pr-4 text-white placeholder-[#4A5568] focus:outline-none focus:border-[#00BFFF] focus:ring-1 focus:ring-[#00BFFF] transition-all"
                            />
                        </div>
                    </div>

                    <div style={{ marginTop: '8px' }}>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
                            style={{
                                backgroundColor: COLORS.purple,
                                boxShadow: `0 0 15px ${COLORS.purple}40`,
                            }}
                        >
                            {/* Hover effect glow */}
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />

                            <span className="relative z-10 flex items-center gap-2">
                                {loading ? (
                                    <div className="animate-spin h-5 w-5 border-2 border-white/30 border-t-white rounded-full" />
                                ) : (
                                    <>
                                        {activeTab === 'login' ? <LogIn size={18} /> : <UserPlus size={18} />}
                                        {activeTab === 'login' ? 'Acessar Central' : 'Garantir Acesso e 5 Créditos'}
                                    </>
                                )}
                            </span>
                        </button>
                    </div>
                </form>

                {/* Termos textinhos */}
                <div style={{ marginTop: '24px', textAlign: 'center', color: COLORS.textSoft, fontSize: '12px', lineHeight: 1.5 }}>
                    Ao {activeTab === 'login' ? 'entrar' : 'se registrar'}, você concorda que somos os donos supremos de todas as planilhas da Liga.
                </div>
            </div>
        </div>
    );
};
