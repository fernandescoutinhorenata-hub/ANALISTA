import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search, ArrowLeft, Users,
    Zap, ShieldAlert, DollarSign, TrendingUp, Clock,
    CheckCircle, BarChart2, CreditCard, Activity
} from 'lucide-react';
import {
    ResponsiveContainer, BarChart, Bar, LineChart, Line,
    XAxis, YAxis, Tooltip, CartesianGrid, Legend
} from 'recharts';
import { supabase } from '../lib/supabase';

// ─── Preços por plano (para calcular receita) ────────────────────────────────
const PRECOS: Record<string, number> = { semanal: 10.0, mensal: 25.0 };

// ─── Estilos de gráfico ───────────────────────────────────────────────────────
const chartTooltipStyle = {
    backgroundColor: '#161618',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '8px',
    color: '#FAFAFA',
    fontSize: '11px',
};

// ─── Micro-componentes ────────────────────────────────────────────────────────
const TopMetric: React.FC<{
    label: string; value: string | number; icon: any; color?: string; sub?: string;
}> = ({ label, value, icon: Icon, color = '#7C3AED', sub }) => (
    <div className="card p-6 flex flex-col gap-3">
        <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl" style={{ background: `${color}18`, color }}>
                <Icon size={18} />
            </div>
            {sub && <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-tertiary)]">{sub}</span>}
        </div>
        <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-tertiary)] mb-1">{label}</p>
            <p className="text-2xl font-black" style={{ color }}>{value}</p>
        </div>
    </div>
);

const AffMetric: React.FC<{
    label: string; value: string | number; icon: any; color?: string;
}> = ({ label, value, icon: Icon, color = '#7C3AED' }) => (
    <div className="card p-5 flex flex-col gap-3">
        <div className="p-2.5 rounded-lg w-fit" style={{ background: `${color}18`, color }}>
            <Icon size={16} />
        </div>
        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-tertiary)]">{label}</p>
        <p className="text-xl font-black" style={{ color }}>{value}</p>
    </div>
);

const SectionTitle: React.FC<{ icon: any; title: string; count?: number; subtitle?: string }> = ({ icon: Icon, title, count, subtitle }) => (
    <div className="flex items-center gap-3 px-6 py-4 border-b border-[var(--border-subtle)]">
        <Icon size={14} className="text-[var(--accent)]" />
        <div>
            <h3 className="text-sm font-bold uppercase tracking-widest">{title}</h3>
            {subtitle && <p className="text-[10px] text-[var(--text-tertiary)]">{subtitle}</p>}
        </div>
        {count !== undefined && <span className="ml-auto badge badge-ghost text-[10px]">{count} registros</span>}
    </div>
);

// ─── Componente Principal ─────────────────────────────────────────────────────
export const AdminPanel: React.FC = () => {
    const navigate = useNavigate();

    // ── Estado Geral ──
    const [emailBusca, setEmailBusca] = useState('');
    const [userEncontrado, setUserEncontrado] = useState<any>(null);
    const [assinaturaAtual, setAssinaturaAtual] = useState<any>(null);
    const [todasAssinaturas, setTodasAssinaturas] = useState<any[]>([]);
    const [todosUsuarios, setTodosUsuarios] = useState<any[]>([]);
    const [ipsRegistrados, setIpsRegistrados] = useState<any[]>([]);
    const [afiliados, setAfiliados] = useState<any[]>([]);
    const [todasVendas, setTodasVendas] = useState<any[]>([]);
    const [viewMode, setViewMode] = useState<'ativos' | 'todos' | 'vendas' | 'afiliados' | 'ips'>('ativos');
    const [loading, setLoading] = useState(false);
    const [btnLoading, setBtnLoading] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    // ── Fetch Principal ──
    const fetchDados = async () => {
        setLoading(true);
        try {
            // Todas as assinaturas (com perfis)
            const { data: allSubs } = await supabase
                .from('subscriptions')
                .select('*, perfis(nome, email)')
                .order('created_at', { ascending: false });
            setTodasAssinaturas(allSubs || []);

            // Todos usuários
            try {
                const { data: funcData } = await supabase.functions.invoke('get-all-users');
                if (funcData?.users) setTodosUsuarios(funcData.users);
                else {
                    const { data: todos } = await supabase.from('perfis').select('id, email, nome, ocr_uses, created_at').order('created_at', { ascending: false }).limit(1000);
                    setTodosUsuarios(todos || []);
                }
            } catch {
                const { data: todos } = await supabase.from('perfis').select('id, email, nome, ocr_uses, created_at').order('created_at', { ascending: false }).limit(1000);
                setTodosUsuarios(todos || []);
            }

            // IPs
            const { data: ips } = await supabase.from('ip_registros').select('*').order('created_at', { ascending: false });
            setIpsRegistrados(ips || []);

            // Afiliados + Vendas de afiliados
            const { data: affs } = await supabase.from('affiliates').select('*, perfis(nome, email)').order('total_earned', { ascending: false });
            const { data: vendas } = await supabase.from('affiliate_sales').select('*, affiliates(coupon_code, perfis(nome, email))').order('created_at', { ascending: false });
            const vendasArr = vendas || [];
            setTodasVendas(vendasArr);
            if (affs) {
                setAfiliados(affs.map((a: any) => {
                    const minhasVendas = vendasArr.filter((v: any) => v.affiliate_id === a.id);
                    const pending = minhasVendas.filter((v: any) => v.status === 'pending').reduce((acc: number, v: any) => acc + Number(v.commission_amount), 0);
                    const paid = minhasVendas.filter((v: any) => v.status === 'paid').reduce((acc: number, v: any) => acc + Number(v.commission_amount), 0);
                    return { ...a, pending, paid, salesCount: minhasVendas.length };
                }));
            }
        } catch (err: any) {
            console.error('Erro adm:', err);
            showToast('Falha técnica ao carregar banco', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchDados(); }, []);

    // ── Dados Derivados ──
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const assinantesAtivos = useMemo(() =>
        todasAssinaturas.filter(s => s.status === 'ativo' && new Date(s.data_fim) > now),
        [todasAssinaturas]
    );

    const assinantesInativos = useMemo(() =>
        todasAssinaturas.filter(s => s.status !== 'ativo' || new Date(s.data_fim) <= now),
        [todasAssinaturas]
    );

    const receitaMes = useMemo(() => {
        return todasAssinaturas
            .filter(s => 
                s.data_inicio && 
                new Date(s.data_inicio) >= new Date(startOfMonth) &&
                (s.status === 'ativo' || s.status === 'expirado')
            )
            .reduce((acc, s) => acc + (Number(s.valor) || PRECOS[s.plano] || 0), 0);
    }, [todasAssinaturas, startOfMonth]);

    // ── Gráfico: Assinaturas por Mês (últimos 6 meses) ──
    const subsChartData = useMemo(() => {
        const byMonth: Record<string, { mes: string; ativos: number; total: number }> = {};
        const hoje = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const label = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
            byMonth[key] = { mes: label, ativos: 0, total: 0 };
        }
        todasAssinaturas.forEach(s => {
            if (!s.data_inicio) return;
            const d = new Date(s.data_inicio);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            if (byMonth[key]) {
                byMonth[key].total++;
                if (s.status === 'ativo') byMonth[key].ativos++;
            }
        });
        return Object.values(byMonth);
    }, [todasAssinaturas]);

    // ── Gráfico: Receita por Mês (aba Vendas) ──
    const receitaChartData = useMemo(() => {
        const byMonth: Record<string, { mes: string; receita: number; qtd: number }> = {};
        const hoje = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            byMonth[key] = { mes: d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }), receita: 0, qtd: 0 };
        }
        todasAssinaturas.forEach(s => {
            if (!s.data_inicio || (s.status !== 'ativo' && s.status !== 'expirado')) return;
            const d = new Date(s.data_inicio);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            if (byMonth[key]) {
                byMonth[key].receita += (Number(s.valor) || PRECOS[s.plano] || 0);
                byMonth[key].qtd++;
            }
        });
        return Object.values(byMonth);
    }, [todasAssinaturas]);

    // ── Métricas de Vendas ──
    const vendasMetrics = useMemo(() => {
        const validas = todasAssinaturas.filter(s => s.status === 'ativo' || s.status === 'expirado');
        const total = validas.length;
        const doMes = validas.filter(s => s.data_inicio && new Date(s.data_inicio) >= new Date(startOfMonth)).length;
        const receitaTotal = validas.reduce((acc, s) => acc + (Number(s.valor) || PRECOS[s.plano] || 0), 0);
        const ticket = total > 0 ? receitaTotal / total : 0;
        const semanais = validas.filter(s => s.plano === 'semanal').length;
        const mensais = validas.filter(s => s.plano === 'mensal').length;
        const maisVendido = semanais >= mensais ? `Semanal (${semanais})` : `Mensal (${mensais})`;
        return { total, doMes, receitaTotal, ticket, maisVendido };
    }, [todasAssinaturas, startOfMonth]);

    // ── Métricas de Afiliados ──
    const afiliadosMetrics = useMemo(() => {
        const totalPendente = todasVendas.filter(v => v.status === 'pending').reduce((acc, v) => acc + Number(v.commission_amount), 0);
        const totalPago = todasVendas.filter(v => v.status === 'paid').reduce((acc, v) => acc + Number(v.commission_amount), 0);
        return { totalAfiliados: afiliados.length, totalVendas: todasVendas.length, pendente: totalPendente, pago: totalPago, total: totalPendente + totalPago };
    }, [afiliados, todasVendas]);

    const vendasPorMes = useMemo(() => {
        const byMonth: Record<string, { mes: string; vendas: number; comissoes: number }> = {};
        todasVendas.forEach(v => {
            const d = new Date(v.created_at);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const label = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
            if (!byMonth[key]) byMonth[key] = { mes: label, vendas: 0, comissoes: 0 };
            byMonth[key].vendas += Number(v.sale_amount);
            byMonth[key].comissoes += Number(v.commission_amount);
        });
        return Object.values(byMonth).sort((a, b) => a.mes.localeCompare(b.mes));
    }, [todasVendas]);

    const rankingAfiliados = useMemo(() => [...afiliados].sort((a, b) => b.salesCount - a.salesCount).slice(0, 8), [afiliados]);

    // ── Ações ──
    const buscarUsuario = async () => {
        if (!emailBusca) return;
        setLoading(true);
        setUserEncontrado(null); setAssinaturaAtual(null);
        try {
            const { data: perfil } = await supabase.from('perfis').select('*').eq('email', emailBusca).maybeSingle();
            if (!perfil) { showToast('Usuário não encontrado!', 'error'); return; }
            setUserEncontrado(perfil);
            const { data: sub } = await supabase.from('subscriptions').select('*').eq('user_id', perfil.id).eq('status', 'ativo').gt('data_fim', now.toISOString()).maybeSingle();
            setAssinaturaAtual(sub);
        } catch { showToast('Erro ao realizar busca.', 'error'); } finally { setLoading(false); }
    };

    const ativarAssinatura = async (userId: string, plano: 'semanal' | 'mensal') => {
        setBtnLoading(`${userId}-${plano}`);
        const dias = plano === 'semanal' ? 7 : 30;
        const fim = new Date(); fim.setDate(fim.getDate() + dias);
        try {
            await supabase.from('subscriptions').delete().eq('user_id', userId);
            const { error } = await supabase.from('subscriptions').insert({ user_id: userId, plano, status: 'ativo', data_inicio: now.toISOString(), data_fim: fim.toISOString() });
            if (error) throw error;
            showToast(`Acesso ${plano.toUpperCase()} liberado!`, 'success');
            fetchDados();
            if (userEncontrado?.id === userId) buscarUsuario();
        } catch { showToast('Erro ao liberar acesso.', 'error'); } finally { setBtnLoading(null); }
    };

    const desativarAssinatura = async (userId: string, email: string) => {
        if (!window.confirm(`Desativar assinatura de [${email}]?`)) return;
        setBtnLoading(`desativar-${userId}`);
        try {
            const { error } = await supabase.from('subscriptions').update({ status: 'expirado' }).eq('user_id', userId).eq('status', 'ativo');
            if (error) throw error;
            showToast('Assinatura desativada.', 'success');
            fetchDados();
        } catch { showToast('Falha ao desativar.', 'error'); } finally { setBtnLoading(null); }
    };

    const liberarIP = async (ip: string) => {
        if (!window.confirm(`Liberar IP ${ip}?`)) return;
        setBtnLoading(`liberar-ip-${ip}`);
        try {
            const { error } = await supabase.from('ip_registros').delete().eq('ip', ip);
            if (error) throw error;
            showToast('IP liberado!', 'success');
            fetchDados();
        } catch { showToast('Erro ao liberar IP.', 'error'); } finally { setBtnLoading(null); }
    };

    const marcarComoPago = async (affiliateId: string, nome: string) => {
        if (!window.confirm(`Marcar TODAS as comissões pendentes de [${nome}] como PAGAS?`)) return;
        setBtnLoading(`pay-${affiliateId}`);
        try {
            const { data: pendingSales } = await supabase.from('affiliate_sales').select('commission_amount').eq('affiliate_id', affiliateId).eq('status', 'pending');
            const totalToPay = (pendingSales || []).reduce((acc, s) => acc + Number(s.commission_amount), 0);
            if (totalToPay <= 0) { showToast('Nenhuma comissão pendente.', 'error'); return; }
            const { error: eUpdateSales } = await supabase.from('affiliate_sales').update({ status: 'paid' }).eq('affiliate_id', affiliateId).eq('status', 'pending');
            if (eUpdateSales) throw eUpdateSales;
            const { data: currentAff } = await supabase.from('affiliates').select('total_paid').eq('id', affiliateId).single();
            await supabase.from('affiliates').update({ total_paid: Number(currentAff?.total_paid || 0) + totalToPay }).eq('id', affiliateId);
            showToast(`Pagamento de R$ ${totalToPay.toFixed(2)} registrado!`, 'success');
            fetchDados();
        } catch { showToast('Falha ao processar pagamento.', 'error'); } finally { setBtnLoading(null); }
    };

    // ─────────────────────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] font-['Inter',sans-serif]">
            {/* ── Header ── */}
            <header className="sticky top-0 z-20 bg-[var(--bg-main)]/90 backdrop-blur border-b border-[var(--border-subtle)] px-8 py-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-[var(--accent)] rounded-2xl shadow-lg shadow-[var(--accent)]/20">
                        <ShieldAlert size={24} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-extrabold tracking-tight">Painel Administrativo</h1>
                        <p className="text-[var(--text-secondary)] text-xs">CeloMaster — Controle Total</p>
                    </div>
                </div>
                <button onClick={() => navigate('/admin-celo')} className="btn-ghost flex items-center gap-2 group text-sm">
                    <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Dashboard
                </button>
            </header>

            <div className="p-8 max-w-[1600px] mx-auto space-y-8">

                {/* ══ LINHA 1: 4 CARDS GLOBAIS ══ */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                    <TopMetric label="Total de Usuários" value={todosUsuarios.length} icon={Users} color="#7C3AED" sub="cadastrados" />
                    <TopMetric label="Assinantes Ativos" value={assinantesAtivos.length} icon={CheckCircle} color="#10B981" sub="hoje" />
                    <TopMetric label="Inativos / Expirados" value={assinantesInativos.length} icon={Activity} color="#EF4444" sub="total" />
                    <TopMetric
                        label="Receita do Mês"
                        value={`R$ ${receitaMes.toFixed(2)}`}
                        icon={DollarSign}
                        color="#F59E0B"
                        sub={new Date().toLocaleDateString('pt-BR', { month: 'long' })}
                    />
                </div>

                {/* ══ LINHA 2: GRÁFICO DE ASSINATURAS ══ */}
                <div className="card p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2.5 rounded-xl bg-[var(--accent-muted)] text-[var(--accent)]">
                            <TrendingUp size={16} />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold">Assinaturas por Mês</h3>
                            <p className="text-[10px] text-[var(--text-tertiary)]">Últimos 6 meses — total e ativos</p>
                        </div>
                    </div>
                    <div className="h-52">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={subsChartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                                <CartesianGrid stroke="var(--border-subtle)" vertical={false} strokeDasharray="3 3" />
                                <XAxis dataKey="mes" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: 'var(--text-tertiary)', fontWeight: 600 }} />
                                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }} allowDecimals={false} />
                                <Tooltip contentStyle={chartTooltipStyle} />
                                <Legend wrapperStyle={{ fontSize: '10px' }} />
                                <Line type="monotone" dataKey="total" name="Total" stroke="#7C3AED" strokeWidth={2.5} dot={{ r: 4, fill: '#7C3AED', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                                <Line type="monotone" dataKey="ativos" name="Ativos" stroke="#10B981" strokeWidth={2.5} dot={{ r: 4, fill: '#10B981', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* ══ LINHA 3: BUSCA + ABAS ══ */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

                    {/* Coluna Lateral — Busca */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="card p-6">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="p-2.5 rounded-xl bg-[var(--accent-muted)] text-[var(--accent)]"><Search size={18} /></div>
                                <h2 className="font-bold text-sm">Buscar Player</h2>
                            </div>
                            <div className="space-y-3">
                                <input type="email" placeholder="email@exemplo.com" className="input-base text-sm" value={emailBusca} onChange={e => setEmailBusca(e.target.value.toLowerCase())} onKeyDown={e => e.key === 'Enter' && buscarUsuario()} />
                                <button onClick={buscarUsuario} disabled={loading} className="btn-primary w-full text-xs py-2.5 flex items-center justify-center gap-2">
                                    {loading ? <Zap className="animate-spin" size={14} /> : 'Buscar Usuário'}
                                </button>
                            </div>
                        </div>

                        {userEncontrado && (
                            <div className="card p-6 animate-reveal">
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="p-2.5 rounded-xl bg-[var(--accent-muted)] text-[var(--accent)]"><Users size={18} /></div>
                                    <h2 className="font-bold text-sm">Perfil Encontrado</h2>
                                </div>
                                <div className="space-y-4">
                                    <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                                        <p className="font-black text-base uppercase">{userEncontrado.nome || 'Sem Nome'}</p>
                                        <p className="text-xs text-[var(--text-tertiary)] lowercase mt-1">{userEncontrado.email}</p>
                                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-[var(--border-subtle)]">
                                            <span className="text-xs text-[var(--text-tertiary)]">Status:</span>
                                            <span className={`badge text-[9px] font-black ${assinaturaAtual ? 'badge-green' : 'badge-red'}`}>{assinaturaAtual ? 'ATIVO' : 'SEM PLANO'}</span>
                                        </div>
                                    </div>
                                    <button onClick={() => ativarAssinatura(userEncontrado.id, 'semanal')} disabled={!!btnLoading} className="btn-primary w-full text-xs">Ativar Semanal (7d)</button>
                                    <button onClick={() => ativarAssinatura(userEncontrado.id, 'mensal')} disabled={!!btnLoading} className="btn-primary w-full text-xs">Ativar Mensal (30d)</button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Coluna Principal — Abas */}
                    <div className="lg:col-span-3">
                        <div className="card overflow-hidden">
                            {/* Seletor de Abas */}
                            <div className="p-4 border-b border-[var(--border-subtle)] flex flex-wrap gap-2">
                                {(['ativos', 'todos', 'vendas', 'afiliados', 'ips'] as const).map(m => (
                                    <button key={m} onClick={() => setViewMode(m)}
                                        className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === m ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg-surface)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'}`}>
                                        {m}
                                    </button>
                                ))}
                            </div>

                            {/* ══ ABA ATIVOS ══ */}
                            {viewMode === 'ativos' && (
                                <div className="overflow-x-auto max-h-[520px] overflow-y-auto custom-scrollbar">
                                    <table className="w-full text-left">
                                        <thead className="bg-[var(--bg-surface)] sticky top-0 z-10 text-[9px] uppercase tracking-widest text-[var(--text-tertiary)]">
                                            <tr>
                                                {['Usuário', 'E-mail', 'Plano', 'Início', 'Expiração', 'Status', 'Ação'].map(h => (
                                                    <th key={h} className="px-5 py-3 font-black">{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[var(--border-subtle)]">
                                            {assinantesAtivos.map(sub => (
                                                <tr key={sub.id} className="hover:bg-white/[0.02] transition-colors">
                                                    <td className="px-5 py-4 font-bold text-sm uppercase">{sub.perfis?.nome || '—'}</td>
                                                    <td className="px-5 py-4 text-[11px] text-[var(--text-tertiary)]">{sub.perfis?.email || '—'}</td>
                                                    <td className="px-5 py-4"><span className="badge badge-purple text-[9px]">{sub.plano?.toUpperCase()}</span></td>
                                                    <td className="px-5 py-4 text-xs">{sub.data_inicio ? new Date(sub.data_inicio).toLocaleDateString('pt-BR') : '—'}</td>
                                                    <td className="px-5 py-4 text-xs">{sub.data_fim ? new Date(sub.data_fim).toLocaleDateString('pt-BR') : '—'}</td>
                                                    <td className="px-5 py-4"><span className="badge badge-green text-[9px]">ATIVO</span></td>
                                                    <td className="px-5 py-4"><button onClick={() => desativarAssinatura(sub.user_id, sub.perfis?.email || '')} className="text-red-500 font-black text-[9px] hover:underline">DESATIVAR</button></td>
                                                </tr>
                                            ))}
                                            {assinantesAtivos.length === 0 && (
                                                <tr><td colSpan={7} className="px-5 py-12 text-center text-xs opacity-20 uppercase tracking-widest font-bold">Nenhum assinante ativo</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* ══ ABA TODOS ══ */}
                            {viewMode === 'todos' && (
                                <div className="overflow-x-auto max-h-[520px] overflow-y-auto custom-scrollbar">
                                    <table className="w-full text-left">
                                        <thead className="bg-[var(--bg-surface)] sticky top-0 z-10 text-[9px] uppercase tracking-widest text-[var(--text-tertiary)]">
                                            <tr>
                                                {['Usuário', 'E-mail', 'OCR', 'Ação'].map(h => <th key={h} className="px-5 py-3 font-black">{h}</th>)}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[var(--border-subtle)]">
                                            {todosUsuarios.map(u => (
                                                <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                                                    <td className="px-5 py-4 font-bold text-sm uppercase">{u.nome || 'Sem Nome'}</td>
                                                    <td className="px-5 py-4 text-[11px]">{u.email}</td>
                                                    <td className="px-5 py-4"><span className="badge badge-ghost text-[9px]">{u.ocr_uses || 0}</span></td>
                                                    <td className="px-5 py-4 flex gap-2">
                                                        <button onClick={() => ativarAssinatura(u.id, 'semanal')} className="p-1.5 rounded bg-[var(--accent-muted)] text-[var(--accent)]" title="Semanal"><Zap size={12} /></button>
                                                        <button onClick={() => ativarAssinatura(u.id, 'mensal')} className="p-1.5 rounded bg-[var(--accent)] text-white" title="Mensal"><Zap size={12} fill="currentColor" /></button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* ══ ABA VENDAS ══ */}
                            {viewMode === 'vendas' && (
                                <div className="p-6 space-y-8 overflow-y-auto custom-scrollbar max-h-[80vh]">
                                    {/* 4 Métricas */}
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                        <AffMetric label="Total de Vendas" value={vendasMetrics.total} icon={CreditCard} color="#7C3AED" />
                                        <AffMetric label="Vendas do Mês" value={vendasMetrics.doMes} icon={TrendingUp} color="#10B981" />
                                        <AffMetric label="Ticket Médio" value={`R$ ${vendasMetrics.ticket.toFixed(2)}`} icon={DollarSign} color="#F59E0B" />
                                        <AffMetric label="Mais Vendido" value={vendasMetrics.maisVendido} icon={BarChart2} color="#A855F7" />
                                    </div>

                                    {/* Gráfico Receita por Mês */}
                                    <div className="card p-6">
                                        <div className="flex items-center gap-3 mb-5">
                                            <div className="p-2.5 rounded-xl bg-[var(--accent-muted)] text-[var(--accent)]"><BarChart2 size={14} /></div>
                                            <h3 className="text-sm font-bold">Receita por Mês</h3>
                                        </div>
                                        <div className="h-48">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={receitaChartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                                                    <CartesianGrid stroke="var(--border-subtle)" vertical={false} strokeDasharray="3 3" />
                                                    <XAxis dataKey="mes" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: 'var(--text-tertiary)', fontWeight: 600 }} />
                                                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }} />
                                                    <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number | undefined) => [`R$ ${(v ?? 0).toFixed(2)}`, 'Receita']} />
                                                    <Bar dataKey="receita" name="Receita R$" fill="#7C3AED" radius={[4, 4, 0, 0]} barSize={24} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    {/* Tabela de Vendas */}
                                    <div className="card overflow-hidden">
                                        <SectionTitle icon={CreditCard} title="Histórico de Vendas" count={todasAssinaturas.length} />
                                        <div className="overflow-x-auto max-h-80 overflow-y-auto custom-scrollbar">
                                            <table className="w-full text-left">
                                                <thead className="bg-[var(--bg-surface)] sticky top-0 z-10 text-[9px] uppercase tracking-widest text-[var(--text-tertiary)]">
                                                    <tr>
                                                        {['Data', 'Usuário', 'Plano', 'Valor', 'Status'].map(h => <th key={h} className="px-5 py-3 font-black">{h}</th>)}
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-[var(--border-subtle)]">
                                                    {todasAssinaturas.map(s => (
                                                        <tr key={s.id} className="hover:bg-white/[0.02] transition-colors">
                                                            <td className="px-5 py-3.5 text-xs whitespace-nowrap">{s.data_inicio ? new Date(s.data_inicio).toLocaleDateString('pt-BR') : '—'}</td>
                                                            <td className="px-5 py-3.5 text-xs font-bold uppercase">{s.perfis?.nome || s.perfis?.email || '—'}</td>
                                                            <td className="px-5 py-3.5"><span className={`badge text-[9px] ${s.plano === 'mensal' ? 'badge-purple' : 'badge-ghost'}`}>{s.plano?.toUpperCase()}</span></td>
                                                            <td className="px-5 py-3.5 text-xs font-black">R$ {(PRECOS[s.plano] || 0).toFixed(2)}</td>
                                                            <td className="px-5 py-3.5">
                                                                <span className={`badge text-[9px] ${s.status === 'ativo' ? 'badge-green' : 'badge-red'}`}>{s.status?.toUpperCase()}</span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ══ ABA AFILIADOS ══ */}
                            {viewMode === 'afiliados' && (
                                <div className="p-6 space-y-8 overflow-y-auto custom-scrollbar max-h-[80vh]">
                                    {/* 5 Cards */}
                                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                                        <AffMetric label="Total de Afiliados" value={afiliadosMetrics.totalAfiliados} icon={Users} color="#7C3AED" />
                                        <AffMetric label="Vendas com Cupom" value={afiliadosMetrics.totalVendas} icon={TrendingUp} color="#7C3AED" />
                                        <AffMetric label="Comissões Pendentes" value={`R$ ${afiliadosMetrics.pendente.toFixed(2)}`} icon={Clock} color="#F59E0B" />
                                        <AffMetric label="Comissões Pagas" value={`R$ ${afiliadosMetrics.pago.toFixed(2)}`} icon={CheckCircle} color="#10B981" />
                                        <AffMetric label="Total em Comissões" value={`R$ ${afiliadosMetrics.total.toFixed(2)}`} icon={DollarSign} color="#A855F7" />
                                    </div>

                                    {/* Gráfico + Ranking */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        <div className="card p-6">
                                            <div className="flex items-center gap-3 mb-5">
                                                <div className="p-2.5 rounded-xl bg-[var(--accent-muted)] text-[var(--accent)]"><BarChart2 size={14} /></div>
                                                <h3 className="text-sm font-bold">Vendas de Afiliados por Mês</h3>
                                            </div>
                                            {vendasPorMes.length === 0 ? (
                                                <div className="h-40 flex items-center justify-center opacity-20 text-xs uppercase tracking-widest font-bold">Sem dados</div>
                                            ) : (
                                                <div className="h-44">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <BarChart data={vendasPorMes} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                                                            <CartesianGrid stroke="var(--border-subtle)" vertical={false} strokeDasharray="3 3" />
                                                            <XAxis dataKey="mes" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: 'var(--text-tertiary)', fontWeight: 600 }} />
                                                            <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }} />
                                                            <Tooltip contentStyle={chartTooltipStyle} />
                                                            <Bar dataKey="vendas" name="Vendas R$" fill="#7C3AED" radius={[4, 4, 0, 0]} barSize={16} />
                                                            <Bar dataKey="comissoes" name="Comissões R$" fill="#A855F7" radius={[4, 4, 0, 0]} barSize={16} />
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            )}
                                        </div>

                                        <div className="card p-6">
                                            <div className="flex items-center gap-3 mb-5">
                                                <div className="p-2.5 rounded-xl bg-[var(--accent-muted)] text-[var(--accent)]"><TrendingUp size={14} /></div>
                                                <h3 className="text-sm font-bold">Ranking de Afiliados</h3>
                                            </div>
                                            <div className="space-y-3">
                                                {rankingAfiliados.length === 0 ? (
                                                    <p className="text-xs opacity-20 text-center py-8 uppercase tracking-widest font-bold">Sem afiliados</p>
                                                ) : rankingAfiliados.map((aff, idx) => (
                                                    <div key={aff.id} className="flex items-center justify-between py-2 border-b border-[var(--border-subtle)] last:border-0">
                                                        <div className="flex items-center gap-3">
                                                            <span className={`text-[10px] font-black w-5 text-center ${idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-zinc-300' : idx === 2 ? 'text-amber-600' : 'text-[var(--text-tertiary)]'}`}>{idx + 1}</span>
                                                            <div>
                                                                <p className="text-xs font-bold uppercase">{aff.perfis?.nome || aff.perfis?.email || 'Afiliado'}</p>
                                                                <p className="text-[10px] font-mono text-[var(--accent)]">{aff.coupon_code}</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-[10px] font-black">{aff.salesCount} vendas</p>
                                                            <p className="text-[10px] text-amber-500">R$ {(aff.pending + aff.paid).toFixed(2)}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Tabela de Afiliados */}
                                    <div className="card overflow-hidden">
                                        <SectionTitle icon={Users} title="Todos os Afiliados" count={afiliados.length} />
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left">
                                                <thead className="bg-[var(--bg-surface)] text-[9px] uppercase tracking-widest text-[var(--text-tertiary)]">
                                                    <tr>{['Afiliado', 'E-mail', 'Código', 'Vendas', 'Pendente', 'Pago', 'Ação'].map(h => <th key={h} className="px-5 py-3 font-black">{h}</th>)}</tr>
                                                </thead>
                                                <tbody className="divide-y divide-[var(--border-subtle)]">
                                                    {afiliados.length === 0 ? (
                                                        <tr><td colSpan={7} className="px-5 py-12 text-center text-xs opacity-20 uppercase tracking-widest font-bold">Sem afiliados</td></tr>
                                                    ) : afiliados.map(aff => (
                                                        <tr key={aff.id} className="hover:bg-white/[0.02] transition-colors">
                                                            <td className="px-5 py-4 font-bold text-sm uppercase">{aff.perfis?.nome || '—'}</td>
                                                            <td className="px-5 py-4 text-[11px] text-[var(--text-tertiary)]">{aff.perfis?.email || '—'}</td>
                                                            <td className="px-5 py-4 font-mono font-black text-[var(--accent)]">{aff.coupon_code}</td>
                                                            <td className="px-5 py-4 text-sm font-bold">{aff.salesCount}</td>
                                                            <td className="px-5 py-4 text-amber-500 font-black text-sm">R$ {aff.pending.toFixed(2)}</td>
                                                            <td className="px-5 py-4 text-green-500 font-black text-sm">R$ {aff.paid.toFixed(2)}</td>
                                                            <td className="px-5 py-4">
                                                                <button onClick={() => marcarComoPago(aff.id, aff.perfis?.nome || 'Afiliado')} disabled={aff.pending <= 0 || btnLoading === `pay-${aff.id}`}
                                                                    className={`px-3 py-1 rounded font-black text-[9px] uppercase tracking-widest transition-all ${aff.pending > 0 ? 'bg-green-500/15 text-green-400 hover:bg-green-500/25' : 'bg-[var(--bg-surface)] text-[var(--text-tertiary)] opacity-40 cursor-not-allowed'}`}>
                                                                    {btnLoading === `pay-${aff.id}` ? '...' : 'Marcar Pago'}
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Histórico de Vendas de Afiliados */}
                                    <div className="card overflow-hidden">
                                        <SectionTitle icon={DollarSign} title="Histórico de Vendas via Cupom" count={todasVendas.length} />
                                        <div className="overflow-x-auto max-h-80 overflow-y-auto custom-scrollbar">
                                            <table className="w-full text-left">
                                                <thead className="bg-[var(--bg-surface)] sticky top-0 z-10 text-[9px] uppercase tracking-widest text-[var(--text-tertiary)]">
                                                    <tr>{['Data', 'Afiliado', 'Código', 'Plano', 'Valor', 'Comissão', 'Status'].map(h => <th key={h} className="px-5 py-3 font-black">{h}</th>)}</tr>
                                                </thead>
                                                <tbody className="divide-y divide-[var(--border-subtle)]">
                                                    {todasVendas.length === 0 ? (
                                                        <tr><td colSpan={7} className="px-5 py-12 text-center text-xs opacity-20 uppercase tracking-widest font-bold">Nenhuma venda</td></tr>
                                                    ) : todasVendas.map(v => (
                                                        <tr key={v.id} className="hover:bg-white/[0.02] transition-colors">
                                                            <td className="px-5 py-3.5 text-xs whitespace-nowrap">{new Date(v.created_at).toLocaleDateString('pt-BR')}</td>
                                                            <td className="px-5 py-3.5 text-xs font-bold uppercase">{v.affiliates?.perfis?.nome || '—'}</td>
                                                            <td className="px-5 py-3.5 font-mono font-black text-[var(--accent)] text-xs">{v.affiliates?.coupon_code || '—'}</td>
                                                            <td className="px-5 py-3.5 text-xs font-bold uppercase">{v.plan_name}</td>
                                                            <td className="px-5 py-3.5 text-xs text-[var(--text-secondary)] font-bold">R$ {Number(v.sale_amount).toFixed(2)}</td>
                                                            <td className="px-5 py-3.5 text-xs font-black">R$ {Number(v.commission_amount).toFixed(2)}</td>
                                                            <td className="px-5 py-3.5">
                                                                {v.status === 'pending'
                                                                    ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-[9px] font-black uppercase"><Clock size={8} /> Pendente</span>
                                                                    : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 text-[9px] font-black uppercase"><CheckCircle size={8} /> Pago</span>}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ══ ABA IPS ══ */}
                            {viewMode === 'ips' && (
                                <div className="overflow-x-auto max-h-[520px] overflow-y-auto custom-scrollbar">
                                    <table className="w-full text-left">
                                        <thead className="bg-[var(--bg-surface)] sticky top-0 z-10 text-[9px] uppercase tracking-widest text-[var(--text-tertiary)]">
                                            <tr>{['IP Address', 'ID Usuário', 'Data', 'Ação'].map(h => <th key={h} className="px-5 py-3 font-black">{h}</th>)}</tr>
                                        </thead>
                                        <tbody className="divide-y divide-[var(--border-subtle)]">
                                            {ipsRegistrados.map(ip => (
                                                <tr key={ip.id} className="hover:bg-white/[0.02] transition-colors">
                                                    <td className="px-5 py-4 font-mono font-bold text-[var(--accent)] text-sm">{ip.ip}</td>
                                                    <td className="px-5 py-4 truncate max-w-[120px] text-xs opacity-30">{ip.user_id}</td>
                                                    <td className="px-5 py-4 text-xs opacity-60">{new Date(ip.created_at).toLocaleDateString('pt-BR')}</td>
                                                    <td className="px-5 py-4"><button onClick={() => liberarIP(ip.ip)} className="text-green-400 font-black text-[9px] hover:underline">LIBERAR</button></td>
                                                </tr>
                                            ))}
                                            {ipsRegistrados.length === 0 && (
                                                <tr><td colSpan={4} className="px-5 py-12 text-center text-xs opacity-20 uppercase tracking-widest font-bold">Nenhum IP registrado</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </div>

            {/* Toast */}
            {toast && (
                <div className="fixed top-6 right-6 z-50 card px-5 py-4 flex items-center gap-3 shadow-2xl border border-[var(--border-default)] animate-fade-in">
                    <span className={`font-black text-sm ${toast.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                        {toast.message}
                    </span>
                </div>
            )}
        </div>
    );
};
