import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Search, ArrowLeft, Users, 
    CheckCircle, XCircle, Zap, TrendingUp,
    ShieldAlert
} from 'lucide-react';
import { supabase } from '../lib/supabase';

// ─── Componentes de UI (Reusando estilo do Dashboard) ──────────────────────────────────────────
const CardHeader: React.FC<{ title: string; subtitle?: string; icon: any }> = ({ title, subtitle, icon: Icon }) => (
    <div className="flex items-center gap-4 mb-6">
        <div className="p-3 rounded-xl bg-[var(--accent-muted)] text-[var(--accent)]">
            <Icon size={24} />
        </div>
        <div>
            <h2 className="text-xl font-bold">{title}</h2>
            {subtitle && <p className="text-label mt-1">{subtitle}</p>}
        </div>
    </div>
);

export const AdminPanel: React.FC = () => {
    const navigate = useNavigate();
    const [emailBusca, setEmailBusca] = useState('');
    const [userEncontrado, setUserEncontrado] = useState<any>(null);
    const [assinaturaAtual, setAssinaturaAtual] = useState<any>(null);
    const [assinantesAtivos, setAssinantesAtivos] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [btnLoading, setBtnLoading] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    const fetchAssinantesAtivos = async () => {
        const { data, error } = await supabase
            .from('subscriptions')
            .select(`
                *,
                perfis (email, nome)
            `)
            .eq('status', 'ativo')
            .gt('data_fim', new Date().toISOString())
            .order('data_fim', { ascending: false });

        if (error) { /* Erro silenciado */ }
        else setAssinantesAtivos(data || []);
    };

    useEffect(() => {
        fetchAssinantesAtivos();
    }, []);

    const buscarUsuario = async () => {
        if (!emailBusca) return;
        setLoading(true);
        setUserEncontrado(null);
        setAssinaturaAtual(null);

        try {
            const { data: perfil, error: pError } = await supabase
                .from('perfis')
                .select('*')
                .eq('email', emailBusca)
                .maybeSingle();

            if (pError) throw pError;
            if (!perfil) {
                showToast('Usuário não encontrado!', 'error');
                return;
            }

            setUserEncontrado(perfil);

            const { data: sub, error: sError } = await supabase
                .from('subscriptions')
                .select('*')
                .eq('user_id', perfil.id)
                .eq('status', 'ativo')
                .gt('data_fim', new Date().toISOString())
                .maybeSingle();

            if (sError) { /* Erro silenciado */ }
            setAssinaturaAtual(sub);
        } catch (error) {
            // Erro na busca silenciado
            showToast('Erro ao realizar busca.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const ativarAssinatura = async (plano: 'semanal' | 'mensal') => {
        if (!userEncontrado) return;
        setBtnLoading(plano);

        const dias = plano === 'semanal' ? 7 : 30;
        const inicio = new Date();
        const fim = new Date();
        fim.setDate(inicio.getDate() + dias);

        try {
            // Upsert na tabela de assinaturas
            const { error } = await supabase
                .from('subscriptions')
                .upsert({
                    user_id: userEncontrado.id,
                    plano: plano,
                    status: 'ativo',
                    data_inicio: inicio.toISOString(),
                    data_fim: fim.toISOString(),
                    created_at: new Date().toISOString()
                }, { onConflict: 'user_id' }); // Conflito no user_id ativa uma nova

            if (error) throw error;

            showToast(`Assinatura ${plano.toUpperCase()} ativada!`, 'success');
            buscarUsuario(); // Recalcula status na tela
            fetchAssinantesAtivos(); // Atualiza lista global
        } catch (error: any) {
            // Erro ao ativar silenciado
            showToast('Erro ao ativar assinatura.', 'error');
        } finally {
            setBtnLoading(null);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] p-8 font-['Inter',sans-serif]">
            {/* Header Administrativo */}
            <header className="max-w-7xl mx-auto flex items-center justify-between mb-12 animate-reveal">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-[var(--accent)] rounded-2xl shadow-lg shadow-[var(--accent-glow)]">
                        <ShieldAlert size={28} className="text-white" />
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-extrabold tracking-tight">Painel Administrativo</h1>
                            <span className="badge badge-purple border border-[var(--accent)] font-bold">ADMIN ROLE</span>
                        </div>
                        <p className="text-[var(--text-secondary)]">Gerenciamento de Assinaturas e Acessos</p>
                    </div>
                </div>
                <button 
                    onClick={() => navigate('/admin-celo')}
                    className="btn-ghost flex items-center gap-2 group"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Voltar ao Dashboard
                </button>
            </header>

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Lado Esquerdo: Busca e Ações */}
                <div className="lg:col-span-1 space-y-8 animate-reveal" style={{ animationDelay: '0.1s' }}>
                    <div className="card p-8">
                        <CardHeader title="Sincronizar Player" subtitle="Busque por e-mail registrado" icon={Search} />
                        <div className="space-y-4">
                            <input
                                type="email"
                                placeholder="exemplo@gmail.com"
                                className="input-base"
                                value={emailBusca}
                                onChange={(e) => setEmailBusca(e.target.value.toLowerCase())}
                                onKeyDown={(e) => e.key === 'Enter' && buscarUsuario()}
                            />
                            <button 
                                onClick={buscarUsuario}
                                disabled={loading}
                                className="btn-primary w-full py-3 flex items-center justify-center gap-2"
                            >
                                {loading && <Zap className="animate-spin" size={16} />}
                                {loading ? 'Sincronizando...' : 'Buscar Usuário'}
                            </button>
                        </div>
                    </div>

                    {userEncontrado && (
                        <div className="card p-8 animate-reveal">
                            <CardHeader title="Perfil do Jogador" icon={Users} />
                            <div className="space-y-6">
                                <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-12 h-12 rounded-lg bg-[var(--accent-muted)] flex items-center justify-center font-bold text-xl text-[var(--accent)]">
                                            {userEncontrado.nome?.[0] || 'U'}
                                        </div>
                                        <div>
                                            <p className="font-bold text-lg uppercase">{userEncontrado.nome || 'Sem Nome'}</p>
                                            <p className="text-label text-xs lowercase">{userEncontrado.email}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center justify-between pt-4 border-t border-[var(--border-subtle)]">
                                        <span className="text-label">Status:</span>
                                        {assinaturaAtual ? (
                                            <span className="badge badge-green font-bold">ATIVO</span>
                                        ) : (
                                            <span className="badge badge-red font-bold">SEM PLANO</span>
                                        )}
                                    </div>
                                    {assinaturaAtual && (
                                        <div className="flex items-center justify-between mt-2">
                                            <span className="text-label">Expira em:</span>
                                            <span className="text-heading text-xs">
                                                {new Date(assinaturaAtual.data_fim).toLocaleDateString('pt-BR')}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    <span className="text-label uppercase tracking-widest block mb-2">Liberar Acesso</span>
                                    <button 
                                        onClick={() => ativarAssinatura('semanal')}
                                        disabled={!!btnLoading}
                                        className="btn-primary w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] border-none"
                                    >
                                        {btnLoading === 'semanal' ? 'Processando...' : 'Ativar Semanal (7 dias)'}
                                    </button>
                                    <button 
                                        onClick={() => ativarAssinatura('mensal')}
                                        disabled={!!btnLoading}
                                        className="btn-primary w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] border-none"
                                    >
                                        {btnLoading === 'mensal' ? 'Processando...' : 'Ativar Mensal (30 dias)'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Lado Direito: Listagem Geral */}
                <div className="lg:col-span-2 space-y-8 animate-reveal" style={{ animationDelay: '0.2s' }}>
                    <div className="card overflow-hidden">
                        <div className="p-8 border-b border-[var(--border-subtle)] flex items-center justify-between">
                            <CardHeader title="Base de Assinantes" subtitle="Monitoramento vital de ativações" icon={TrendingUp} />
                            <div className="p-2 px-4 rounded-lg bg-[var(--accent-green-muted)] text-[var(--accent-green)] font-bold text-xs uppercase">
                                {assinantesAtivos.length} Ativos
                            </div>
                        </div>
                        
                        <div className="overflow-x-auto h-[600px] overflow-y-auto custom-scrollbar">
                            <table className="w-full text-left">
                                <thead className="bg-[var(--bg-surface)] text-label uppercase tracking-wider sticky top-0 z-10">
                                    <tr>
                                        <th className="px-8 py-4">Usuário</th>
                                        <th className="px-8 py-4">Plano</th>
                                        <th className="px-8 py-4">Início</th>
                                        <th className="px-8 py-4">Expiração</th>
                                        <th className="px-8 py-4 text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border-subtle)]">
                                    {assinantesAtivos.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-8 py-20 text-center opacity-30 text-label italic">
                                                Nenhuma assinatura ativa encontrada no momento.
                                            </td>
                                        </tr>
                                    ) : (
                                        assinantesAtivos.map((sub) => (
                                            <tr key={sub.id} className="table-row group">
                                                <td className="px-8 py-5">
                                                    <p className="font-bold text-[var(--text-primary)] uppercase truncate w-48">
                                                        {sub.perfis?.nome || 'Usuário'}
                                                    </p>
                                                    <p className="text-[10px] text-[var(--text-tertiary)]">{sub.perfis?.email}</p>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <span className={`badge ${sub.plano === 'mensal' ? 'badge-purple' : 'badge-ghost border border-[var(--border-subtle)]'}`}>
                                                        {sub.plano.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-5 font-mono text-xs opacity-60">
                                                    {new Date(sub.data_inicio).toLocaleDateString('pt-BR')}
                                                </td>
                                                <td className="px-8 py-5 font-mono text-xs font-bold text-[var(--accent)]">
                                                    {new Date(sub.data_fim).toLocaleDateString('pt-BR')}
                                                </td>
                                                <td className="px-8 py-5 text-right">
                                                    <div className="inline-flex items-center gap-2 text-[var(--accent-green)] font-bold text-[10px] uppercase">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-green)] animate-pulse" />
                                                        Ativo
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Toasts */}
            {toast && (
                <div className={`fixed top-8 right-8 z-[100] card p-4 flex items-center gap-3 animate-fade-in shadow-2xl`}>
                    <div className={`badge ${toast.type === 'success' ? 'badge-green' : 'badge-red'}`}>
                        {toast.type === 'success' ? <CheckCircle size={14} /> : <XCircle size={14} />}
                    </div>
                    <span className="text-heading font-bold">{toast.message}</span>
                </div>
            )}
        </div>
    );
};
