import React, { useState, useEffect } from 'react';
import { Check, Lock, ChevronLeft, Loader2, Zap, Calendar, Clock, CreditCard, RefreshCw, AlertCircle, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <div className={`card p-6 relative overflow-hidden ${className}`}>
        {children}
    </div>
);

export const Planos: React.FC = () => {
    const [loadingPlano, setLoadingPlano] = useState<string | null>(null);
    const [subscription, setSubscription] = useState<any>(null);
    const [loadingSubs, setLoadingSubs] = useState(true);
    const { user } = useAuth();
    const navigate = useNavigate();
    
    // Estados do Cupom
    const [couponCode, setCouponCode] = useState('');
    const [couponStatus, setCouponStatus] = useState<'none' | 'valid' | 'invalid' | 'loading'>('none');
    const [affiliateId, setAffiliateId] = useState<string | null>(null);

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

    const handleAssinar = async (planoId: string) => {
        if (!user) {
            navigate('/login');
            return;
        }

        setLoadingPlano(planoId);
        try {
            const { data, error } = await supabase.functions.invoke('create-payment', {
                body: { 
                    plano: planoId, 
                    user_id: user.id, 
                    user_email: user.email,
                    affiliate_id: affiliateId
                }
            });

            if (error) throw error;
            if (data?.init_point) {
                window.location.href = data.init_point;
            } else {
                throw new Error('URL de pagamento não recebida');
            }
        } catch (error: any) {
            console.error('Erro ao processar pagamento:', error);
            alert('Erro ao iniciar checkout: ' + (error.message || 'Tente novamente.'));
        } finally {
            setLoadingPlano(null);
        }
    };

    const validateCoupon = async () => {
        if (!couponCode) {
            setCouponStatus('none');
            setAffiliateId(null);
            return;
        }

        setCouponStatus('loading');
        try {
            const { data, error } = await supabase
                .from('affiliates')
                .select('id, coupon_code')
                .eq('coupon_code', couponCode.toUpperCase().trim())
                .maybeSingle();

            if (error) throw error;

            if (data) {
                setCouponStatus('valid');
                setAffiliateId(data.id);
            } else {
                setCouponStatus('invalid');
                setAffiliateId(null);
            }
        } catch (err) {
            console.error('Erro ao validar cupom:', err);
            setCouponStatus('invalid');
        }
    };


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

    // Cálculo da Barra de Progresso
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
                    {/* Card Principal */}
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

                    {/* Card de Vencimento */}
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

                <div className="max-w-4xl mx-auto mt-16 text-center opacity-30">
                    <p className="text-[10px] uppercase tracking-widest font-bold">ID da Assinatura: {subscription.id}</p>
                </div>
            </div>
        );
    }

    const planos = [
        {
            id: 'gratuito',
            nome: 'Gratuito',
            preco: '0',
            badge: 'Essencial',
            recursos: [
                { texto: 'Dashboard completo', check: true },
                { texto: 'Histórico de partidas', check: true },
                { texto: 'Radar de habilidades', check: true },
                { texto: 'Inserir dados manualmente', check: true },
                { texto: '4 leituras de screenshot gratuitas', check: false },
            ],
            botao: 'Plano atual'
        },
        {
            id: 'semanal',
            nome: 'Plano Semanal',
            preco: '10',
            badge: '7 dias de acesso',
            recursos: [
                { texto: 'Dashboard completo', check: true },
                { texto: 'Histórico de partidas', check: true },
                { texto: 'Radar de habilidades', check: true },
                { texto: 'Inserir dados manualmente', check: true },
                { texto: 'Leituras de screenshot ilimitadas', check: true },
            ],
            botao: 'Assinar por R$10'
        },
        {
            id: 'mensal',
            nome: 'Plano Mensal',
            preco: '25',
            badge: '30 dias (Melhor valor)',
            popular: true,
            recursos: [
                { texto: 'Dashboard completo', check: true },
                { texto: 'Histórico de partidas', check: true },
                { texto: 'Radar de habilidades', check: true },
                { texto: 'Inserir dados manualmente', check: true },
                { texto: 'Leituras de screenshot ilimitadas', check: true },
            ],
            botao: 'Assinar por R$25'
        }
    ];

    return (
        <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] p-6 md:p-12 font-['Inter',sans-serif] animate-reveal">
            {/* Header */}
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
                    <p className="text-[var(--text-secondary)] mt-2">Escolha o plano ideal para profissionalizar sua análise.</p>
                </div>

                {/* Seção de Cupom */}
                <div className="flex flex-col md:flex-row items-center gap-4 bg-[var(--bg-card)] p-4 rounded-2xl border border-[var(--border-subtle)] w-full md:w-fit">
                    <div className="flex items-center gap-3 px-3">
                        <Activity size={18} className="text-[var(--accent)]" />
                        <span className="text-sm font-bold uppercase tracking-tight">Tem um cupom?</span>
                    </div>
                    <div className="relative flex-1 md:w-64">
                        <input 
                            type="text" 
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value)}
                            placeholder="CÓDIGO"
                            className="w-full bg-[var(--bg-main)] border border-[var(--border-default)] rounded-xl px-4 py-3 text-xs font-black uppercase tracking-widest outline-none focus:border-[var(--accent)] transition-all"
                        />
                        {couponStatus === 'valid' && <Check size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" />}
                        {couponStatus === 'invalid' && <AlertCircle size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-rose-500" />}
                    </div>
                    <button 
                        onClick={validateCoupon}
                        disabled={couponStatus === 'loading' || !couponCode}
                        className="px-8 py-3 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-[10px] font-black uppercase rounded-xl transition-all disabled:opacity-50"
                    >
                        {couponStatus === 'loading' ? 'VALIDANDO...' : 'APLICAR'}
                    </button>
                    {couponStatus === 'valid' && (
                        <p className="px-4 text-[10px] font-black text-green-500 uppercase animate-reveal">Cupom aplicado com sucesso! ✅</p>
                    )}
                    {couponStatus === 'invalid' && (
                        <p className="px-4 text-[10px] font-black text-rose-500 uppercase animate-reveal">Código inválido ou expirado ❌</p>
                    )}
                </div>
            </header>

            {/* Grid de Planos */}
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                {planos.map((plano) => (
                    <div 
                        key={plano.id}
                        className={`card relative p-8 flex flex-col transition-all duration-300 hover:translate-y-[-4px] ${plano.popular ? 'border-[var(--accent)] ring-2 ring-[var(--accent-glow)] scale-105 z-10' : ''}`}
                    >
                        {plano.popular && (
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[var(--accent)] text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg shadow-[var(--accent-glow)]">
                                MAIS POPULAR
                            </div>
                        )}
                        
                        <div className="badge badge-purple mb-6 self-start font-bold">
                            {plano.badge}
                        </div>

                        <div className="mb-8">
                            <h3 className="text-xl font-bold mb-1">{plano.nome}</h3>
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-black">R${plano.preco}</span>
                                {plano.id !== 'gratuito' && <span className="text-[var(--text-secondary)] text-sm">/{plano.id === 'semanal' ? 'semana' : 'mês'}</span>}
                            </div>
                        </div>

                        <ul className="space-y-4 mb-10 flex-1">
                            {plano.recursos.map((rec, idx) => (
                                <li key={idx} className="flex items-start gap-3">
                                    {rec.check ? (
                                        <div className="bg-[var(--accent-green-muted)] p-0.5 rounded-full">
                                            <Check size={14} className="text-[var(--accent-green)] shrink-0" strokeWidth={3} />
                                        </div>
                                    ) : (
                                        <Lock size={16} className="text-[var(--text-tertiary)] shrink-0 mt-0.5" />
                                    )}
                                    <span className={`text-sm ${rec.check ? 'text-[var(--text-secondary)] font-medium' : 'text-[var(--text-tertiary)]'}`}>
                                        {rec.texto}
                                    </span>
                                </li>
                            ))}
                        </ul>

                        <button 
                            className={`w-full py-4 rounded-xl font-bold uppercase tracking-wider text-xs transition-all flex items-center justify-center gap-2 ${
                                plano.id === 'gratuito' 
                                ? 'bg-[var(--bg-surface)] text-[var(--text-tertiary)] cursor-default' 
                                : 'btn-primary shadow-lg'
                            }`}
                            onClick={() => plano.id !== 'gratuito' && handleAssinar(plano.id)}
                            disabled={plano.id === 'gratuito' || (loadingPlano !== null)}
                        >
                            {loadingPlano === plano.id ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                <>
                                    {plano.id !== 'gratuito' && <Zap size={14} className="fill-current" />}
                                    {plano.botao}
                                </>
                            )}
                        </button>
                    </div>
                ))}
            </div>

            {/* Footer Informativo */}
            <div className="max-w-4xl mx-auto mt-20 text-center">
                <p className="text-[var(--text-tertiary)] text-xs leading-relaxed max-w-2xl mx-auto">
                    Pagamento processado com segurança via <strong>Mercado Pago</strong>. 
                    Assinaturas são ativadas instantaneamente após a aprovação do pagamento. 
                    Para dúvidas, entre em contato com o suporte.
                </p>
            </div>
        </div>
    );
};
