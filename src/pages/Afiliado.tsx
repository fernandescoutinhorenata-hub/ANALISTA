import React, { useState, useEffect, useMemo } from 'react';
import { 
    DollarSign, Copy, Check, 
    ChevronLeft, Loader2, TrendingUp, Clock, AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { SidebarLayout } from '../components/SidebarLayout';

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <div className={`card overflow-hidden ${className}`}>
        {children}
    </div>
);

const MetricCard: React.FC<{
    title: string;
    value: string | number;
    icon: any;
    color: string;
    desc?: string;
}> = ({ title, value, icon: Icon, color, desc }) => (
    <div className="card p-6 flex flex-col gap-4">
        <div className="flex items-start justify-between">
            <div className="p-3 rounded-xl" style={{ backgroundColor: `${color}15`, color }}>
                <Icon size={20} />
            </div>
            {desc && <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">{desc}</span>}
        </div>
        <div>
            <p className="text-[var(--text-secondary)] text-xs font-bold uppercase tracking-widest mb-1">{title}</p>
            <h3 className="text-2xl font-black text-[var(--text-primary)]">{value}</h3>
        </div>
    </div>
);

const FAKE_SALES = [
    { id: 'f1', created_at: '2026-04-15T12:00:00Z', plan_name: 'Modo Competitivo', sale_amount: 10.00, commission_amount: 2.00, status: 'pending' },
    { id: 'f2', created_at: '2026-04-14T12:00:00Z', plan_name: 'Modo Competitivo', sale_amount: 10.00, commission_amount: 2.00, status: 'pending' },
    { id: 'f3', created_at: '2026-04-13T12:00:00Z', plan_name: 'Modo Competitivo', sale_amount: 10.00, commission_amount: 2.00, status: 'pending' },
    { id: 'f4', created_at: '2026-04-12T12:00:00Z', plan_name: 'Modo Competitivo', sale_amount: 10.00, commission_amount: 2.00, status: 'pending' },
    { id: 'f5', created_at: '2026-04-10T12:00:00Z', plan_name: 'Modo Competitivo', sale_amount: 10.00, commission_amount: 2.00, status: 'paid' },
    { id: 'f6', created_at: '2026-04-08T12:00:00Z', plan_name: 'Elite Squad', sale_amount: 25.00, commission_amount: 5.00, status: 'paid' },
    { id: 'f7', created_at: '2026-04-05T12:00:00Z', plan_name: 'Elite Squad', sale_amount: 25.00, commission_amount: 5.00, status: 'paid' },
    { id: 'f8', created_at: '2026-04-01T12:00:00Z', plan_name: 'Elite Squad', sale_amount: 25.00, commission_amount: 5.00, status: 'paid' },
];

export default function Afiliado() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [affiliate, setAffiliate] = useState<any>(null);
    const [sales, setSales] = useState<any[]>([]);
    const [copied, setCopied] = useState(false);
    const [isSubscriber, setIsSubscriber] = useState(false);

    const isDemo = useMemo(() => sales.length === 0, [sales]);
    const activeSales = useMemo(() => isDemo ? FAKE_SALES : sales, [isDemo, sales]);

    const fetchOrCreateAffiliate = async () => {
        if (!user || !user.id) return;
        setLoading(true);
        try {
            // Verifica status de assinante via tabela subscriptions
            const { data: subscription } = await supabase
                .from('subscriptions')
                .select('status, data_fim')
                .eq('user_id', user.id)
                .eq('status', 'ativo')
                .maybeSingle();

            const isActive = !!subscription && new Date(subscription.data_fim) > new Date();
            setIsSubscriber(isActive);

            // 1. Tenta buscar registro existente
            const { data: existing } = await supabase
                .from('affiliates')
                .select('*')
                .eq('user_id', user.id)
                .maybeSingle();

            let aff = existing;

            // 2. Se não existir (usuário antigo, pré-trigger), cria agora
            if (!aff) {
                const prefix = user.email?.split('@')[0].substring(0, 4).toUpperCase() || 'USER';
                const random = Math.floor(10 + Math.random() * 90);
                const code = `${prefix}${random}`;

                const { data: newAff, error } = await supabase
                    .from('affiliates')
                    .insert([{ user_id: user.id, coupon_code: code, commission_rate: 20 }])
                    .select()
                    .single();

                if (error) {
                    const { data: retry } = await supabase
                        .from('affiliates')
                        .select('*')
                        .eq('user_id', user.id)
                        .maybeSingle();
                    aff = retry;
                } else {
                    aff = newAff;
                }
            }

            setAffiliate(aff);

            // 3. Carrega histórico de vendas
            if (aff) {
                const { data: salesData } = await supabase
                    .from('affiliate_sales')
                    .select('*')
                    .eq('affiliate_id', aff.id)
                    .order('created_at', { ascending: false });
                setSales(salesData || []);
            }
        } catch (err) {
            console.error('Erro ao carregar painel de afiliado:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrCreateAffiliate();
    }, [user]);

    const copyToClipboard = () => {
        const code = isDemo ? 'CELO20' : affiliate?.coupon_code;
        if (!code) return;
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const metrics = useMemo(() => {
        const pending = activeSales.filter(s => s.status === 'pending').reduce((acc, s) => acc + Number(s.commission_amount), 0);
        const paid = activeSales.filter(s => s.status === 'paid').reduce((acc, s) => acc + Number(s.commission_amount), 0);
        return {
            totalSales: activeSales.length,
            pending: pending.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
            paid: paid.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
            totalEarned: (pending + paid).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        };
    }, [activeSales]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center">
                <Loader2 size={40} className="text-[var(--accent)] animate-spin" />
            </div>
        );
    }

    return (
        <SidebarLayout activeTab="afiliados" isSubscriber={isSubscriber}>
            <div className="flex-1 overflow-y-auto p-6 md:p-12 font-['Inter',sans-serif] animate-reveal custom-scrollbar">
                {/* Header */}
                <header className="w-full mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <button
                            onClick={() => navigate('/')}
                            className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors mb-4 text-sm font-medium"
                        >
                            <ChevronLeft size={16} /> Dashboard
                        </button>
                        <h1 className="text-3xl font-extrabold tracking-tight">Programa de Afiliados</h1>
                        <p className="text-[var(--text-secondary)] mt-1 text-sm">Compartilhe seu código e ganhe 20% por cada venda</p>
                    </div>

                    {/* Código em destaque */}
                    {affiliate && (
                        <div className="bg-[#141416] p-5 rounded-2xl border border-[var(--border-subtle)] flex items-center gap-6 min-w-[240px]">
                            <div className="flex-1">
                                <p className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest mb-1">
                                    Seu Código de Afiliado
                                </p>
                                <p className="text-3xl font-black text-[var(--accent)] tracking-tighter font-mono flex items-center gap-2">
                                    {isDemo ? 'CELO20' : affiliate.coupon_code}
                                    {isDemo && (
                                        <span className="text-[10px] bg-[var(--accent)]/10 text-[var(--accent)] px-2 py-0.5 rounded-full font-bold">
                                            DEMO
                                        </span>
                                    )}
                                </p>
                                <p className="text-[10px] text-[var(--text-tertiary)] mt-1">20% de desconto para o comprador</p>
                            </div>
                            <button
                                onClick={copyToClipboard}
                                title="Copiar código"
                                className={`p-3 rounded-xl transition-all flex-shrink-0 ${
                                    copied
                                        ? 'bg-green-500 text-white'
                                        : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--border-default)]'
                                }`}
                            >
                                {copied ? <Check size={20} /> : <Copy size={20} />}
                            </button>
                        </div>
                    )}
                </header>

                <main className="w-full space-y-10 pb-12">
                    {/* 4 Cards de Métricas */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <MetricCard
                            title="Total de Vendas"
                            value={metrics.totalSales}
                            icon={TrendingUp}
                            color="#7C3AED"
                        />
                        <MetricCard
                            title="Comissão Pendente"
                            value={metrics.pending}
                            icon={Clock}
                            color="#F59E0B"
                            desc="Aguardando"
                        />
                        <MetricCard
                            title="Comissão Paga"
                            value={metrics.paid}
                            icon={Check}
                            color="#10B981"
                            desc="Recebido"
                        />
                        <MetricCard
                            title="Total Ganho"
                            value={metrics.totalEarned}
                            icon={DollarSign}
                            color="#A855F7"
                        />
                    </div>

                    {/* Tabela de Histórico */}
                    <Card className="bg-[#0B0B0C] border border-[var(--border-default)]">
                        <div className="p-6 border-b border-[var(--border-subtle)] flex items-center gap-3">
                            <TrendingUp size={18} className="text-[var(--accent)]" />
                            <h3 className="text-lg font-bold">Histórico de Comissões</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-[#161618]">
                                    <tr>
                                        {['Data', 'Plano', 'Valor da Venda', 'Sua Comissão', 'Status'].map(h => (
                                            <th key={h} className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-tertiary)]">
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border-subtle)]">
                                    {activeSales.map(sale => (
                                            <tr key={sale.id} className="hover:bg-white/[0.02] transition-colors">
                                                <td className="px-6 py-4 text-sm font-medium">
                                                    {new Date(sale.created_at).toLocaleDateString('pt-BR')}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-xs font-black uppercase tracking-tighter text-white">
                                                        {sale.plan_name}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm font-bold text-[var(--text-secondary)]">
                                                    R$ {Number(sale.sale_amount).toFixed(2)}
                                                </td>
                                                <td className="px-6 py-4 text-sm font-black text-white">
                                                    R$ {Number(sale.commission_amount).toFixed(2)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {sale.status === 'pending' ? (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase tracking-widest">
                                                            <Clock size={10} /> Pendente
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-[10px] font-black uppercase tracking-widest">
                                                            <Check size={10} /> Pago
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    {/* Aviso de Pagamento */}
                    <div className="flex items-start gap-3 p-6 rounded-2xl bg-[var(--accent)]/5 border border-[var(--accent)]/20 text-[var(--text-secondary)] text-xs">
                        <AlertCircle size={16} className="text-[var(--accent)] shrink-0 mt-0.5" />
                        <div>
                            <p className="font-bold text-[var(--text-primary)] mb-1 uppercase tracking-widest text-[10px]">
                                Como funcionam os pagamentos?
                            </p>
                            <p className="leading-relaxed">
                                Nossa equipe revisa semanalmente as comissões pendentes. Uma vez marcadas como "Pago" pelo administrador, 
                                o valor é enviado via PIX para os dados cadastrados no seu perfil. Em caso de dúvidas, acione o Suporte Técnico.
                            </p>
                        </div>
                    </div>
                </main>
            </div>
        </SidebarLayout>
    );
}
