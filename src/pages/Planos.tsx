import React, { useState, useEffect } from 'react';
import { ChevronLeft, Loader2, Zap, Calendar, Clock, CreditCard, RefreshCw, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { PlanosWhatsApp } from '../components/PlanosWhatsApp';

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <div className={`card p-6 relative overflow-hidden ${className}`}>
        {children}
    </div>
);

export const Planos: React.FC = () => {
    const [subscription, setSubscription] = useState<any>(null);
    const [loadingSubs, setLoadingSubs] = useState(true);
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchSubscription = async () => {
            if (!user) {
                setLoadingSubs(false);
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('subscriptions')
                    .select('*')
                    .eq('user_id', user.id)
                    .eq('status', 'ativo')
                    .maybeSingle();

                if (error) throw error;
                setSubscription(data);
            } catch (err) {
                console.error('Erro ao buscar assinatura:', err);
            } finally {
                setLoadingSubs(false);
            }
        };

        fetchSubscription();
    }, [user]);

    const getStatusConfig = () => {
        if (!subscription?.data_fim) return { color: 'var(--text-tertiary)', label: '-', bar: 'bg-zinc-800' };
        
        const now = new Date();
        const end = new Date(subscription.data_fim);
        const diffMs = end.getTime() - now.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return { color: '#EF4444', label: 'VENCIDO', bar: 'bg-red-500', days: 0 };
        if (diffDays <= 7) return { color: '#F59E0B', label: 'VENCENDO EM BREVE', bar: 'bg-orange-500', days: diffDays };
        return { color: '#10B981', label: 'ATIVO', bar: 'bg-green-500', days: diffDays };
    };

    const statusConfig = getStatusConfig();
    const planValue = subscription?.plano === 'mensal' ? 'R$ 25,00/mês' : 'R$ 10,00/semana';

    const getProgress = () => {
        if (!subscription?.data_inicio || !subscription?.data_fim) return 0;
        const start = new Date(subscription.data_inicio).getTime();
        const end = new Date(subscription.data_fim).getTime();
        const now = new Date().getTime();
        
        const total = end - start;
        const used = now - start;
        return Math.min(100, Math.max(0, (used / total) * 100));
    };

    if (loadingSubs) {
        return (
            <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center">
                <Loader2 size={40} className="text-[var(--accent)] animate-spin" />
            </div>
        );
    }

    if (subscription) {
        return (
            <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] p-6 md:p-12 font-['Inter',sans-serif] animate-reveal">
                <header className="max-w-4xl mx-auto mb-16">
                    <button 
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors mb-4 text-sm font-medium"
                    >
                        <ChevronLeft size={16} />
                        Voltar ao Dashboard
                    </button>
                    <h1 className="text-3xl font-extrabold tracking-tight">Sua Assinatura</h1>
                    <p className="text-[var(--text-secondary)] mt-2">Gerencie seu plano e acompanhe o vencimento.</p>
                </header>

                <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Card className="flex flex-col items-start justify-center p-10 bg-[#141416] border-none">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 rounded-2xl bg-green-500/10 text-green-500">
                                <Zap size={24} fill="currentColor" />
                            </div>
                            <span className="px-3 py-1 rounded-full text-[10px] font-black tracking-widest bg-green-500 text-white uppercase">
                                PLANO ATIVO
                            </span>
                        </div>
                        
                        <h2 className="text-4xl font-black uppercase tracking-tight text-white mb-2">
                            PLANO {subscription.plano}
                        </h2>
                        <div className="flex items-center gap-2 text-xl font-bold text-white/70 mb-8">
                            <CreditCard size={18} />
                            {planValue}
                        </div>

                        <div className="w-full pt-6 border-t border-white/5">
                            <button 
                                onClick={() => setSubscription(null)}
                                className="btn-primary w-full py-4 text-xs tracking-widest font-black uppercase flex items-center justify-center gap-3"
                            >
                                <RefreshCw size={14} /> Renovar Plano
                            </button>
                        </div>
                    </Card>

                    <Card className="p-10 bg-[#141416] border-none flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-2 text-label !mt-0 uppercase font-black text-[10px] tracking-widest opacity-50">
                                    <Clock size={14} /> Tempo de Acesso
                                </div>
                                {statusConfig.label !== 'ATIVO' && (
                                    <span className="px-2 py-1 rounded text-[9px] font-bold tracking-wider" style={{ backgroundColor: `${statusConfig.color}20`, color: statusConfig.color }}>
                                        {statusConfig.label}
                                    </span>
                                )}
                            </div>

                            <div className="mb-10 text-center md:text-left">
                                <div className="text-5xl font-black text-white mb-2">
                                    {statusConfig.days} <span className="text-base text-white/30 uppercase tracking-widest font-bold">Dias Restantes</span>
                                </div>
                                <div className="text-sm font-medium text-white/50 flex items-center justify-center md:justify-start gap-2">
                                    <Calendar size={14} /> Expira em: {new Date(subscription.data_fim).toLocaleDateString('pt-BR')}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-end mb-2">
                                <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Uso do Período</span>
                                <span className="text-[10px] font-black text-white/70">{Math.round(getProgress())}%</span>
                            </div>
                            <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full transition-all duration-1000 ${statusConfig.bar}`}
                                    style={{ width: `${getProgress()}%`, boxShadow: `0 0 10px ${statusConfig.color}40` }}
                                />
                            </div>
                            {statusConfig.label !== 'ATIVO' && (
                                <div className="flex items-center gap-2 text-[10px] font-bold mt-4" style={{ color: statusConfig.color }}>
                                    <AlertCircle size={12} /> Sugerimos renovar seu plano agora para evitar interrupções.
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] p-6 md:p-12 font-['Inter',sans-serif] animate-reveal">
            <header className="max-w-6xl mx-auto mb-16 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <button 
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors mb-4 text-sm font-medium"
                    >
                        <ChevronLeft size={16} />
                        Voltar
                    </button>
                    <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Evolua seu Squad</h1>
                    <p className="text-[var(--text-secondary)] mt-2">Profissionalize suas análises via WhatsApp.</p>
                </div>
            </header>

            <PlanosWhatsApp />

            <div className="max-w-4xl mx-auto mt-20 text-center">
                <p className="text-[var(--text-tertiary)] text-xs leading-relaxed max-w-2xl mx-auto">
                    Suporte dedicado Celo Tracker. Assinaturas são ativadas manualmente após confirmação do comprovante.
                </p>
            </div>
        </div>
    );
};
