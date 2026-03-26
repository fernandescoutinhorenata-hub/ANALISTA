import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search, ArrowLeft, Users,
    Zap, ShieldAlert, DollarSign, TrendingUp, Clock,
    CheckCircle, BarChart2
} from 'lucide-react';
import {
    ResponsiveContainer, BarChart, Bar,
    XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';
import { supabase } from '../lib/supabase';

// ─── Micro-componentes ────────────────────────────────────────────────────────

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

const AffMetric: React.FC<{
    label: string; value: string | number; color?: string; icon: any;
}> = ({ label, value, color = 'var(--accent)', icon: Icon }) => (
    <div className="card p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-lg" style={{ background: `${color}18`, color }}>
                <Icon size={16} />
            </div>
        </div>
        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-tertiary)]">{label}</p>
        <p className="text-xl font-black" style={{ color }}>{value}</p>
    </div>
);

const neonStyle = {
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-default)',
    borderRadius: '8px',
    color: 'var(--text-primary)',
    fontSize: '11px',
};

// ─── Componente Principal ─────────────────────────────────────────────────────

export const AdminPanel: React.FC = () => {
    const navigate = useNavigate();

    // ─── Estado Geral ───
    const [emailBusca, setEmailBusca] = useState('');
    const [userEncontrado, setUserEncontrado] = useState<any>(null);
    const [assinaturaAtual, setAssinaturaAtual] = useState<any>(null);
    const [assinantesAtivos, setAssinantesAtivos] = useState<any[]>([]);
    const [todosUsuarios, setTodosUsuarios] = useState<any[]>([]);
    const [ipsRegistrados, setIpsRegistrados] = useState<any[]>([]);
    const [viewMode, setViewMode] = useState<'ativos' | 'todos' | 'ips' | 'afiliados'>('ativos');
    const [loading, setLoading] = useState(false);
    const [btnLoading, setBtnLoading] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // ─── Estado Específico das Afiliados ───
    const [afiliados, setAfiliados] = useState<any[]>([]);
    const [todasVendas, setTodasVendas] = useState<any[]>([]);

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    // ─── Fetch Dados Gerais ───
    const fetchDados = async () => {
        setLoading(true);
        try {
            // Assinantes ativos
            const { data: subs } = await supabase
                .from('subscriptions').select('*')
                .eq('status', 'ativo').gt('data_fim', new Date().toISOString())
                .order('data_fim', { ascending: false });

            if (subs && subs.length > 0) {
                const userIds = subs.map((s: any) => s.user_id);
                const { data: perfisAtivos } = await supabase.from('perfis').select('id, email, nome').in('id', userIds);
                const perfisMap: Record<string, any> = {};
                (perfisAtivos || []).forEach((p: any) => { perfisMap[p.id] = p; });
                setAssinantesAtivos(subs.map((s: any) => ({ ...s, perfis: perfisMap[s.user_id] || null })));
            } else {
                setAssinantesAtivos([]);
            }

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

            // Afiliados
            await fetchAfiliadosDados();

        } catch (err: any) {
            console.error('Erro ao carregar dados adm:', err);
            showToast('Falha técnica ao carregar banco', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchAfiliadosDados = async () => {
        // Busca afiliados com perfis
        const { data: affs } = await supabase
            .from('affiliates')
            .select('*, perfis(nome, email)')
            .order('total_earned', { ascending: false });

        // Busca todas as vendas com join em perfis do comprador
        const { data: vendas } = await supabase
            .from('affiliate_sales')
            .select('*, affiliates(coupon_code, perfis(nome, email))')
            .order('created_at', { ascending: false });

        const vendasArr = vendas || [];
        setTodasVendas(vendasArr);

        if (affs) {
            // Calcula pendente e total de vendas por afiliado dinamicamente
            const affsEnriquecidos = affs.map((a: any) => {
                const minhasVendas = vendasArr.filter((v: any) => v.affiliate_id === a.id);
                const pending = minhasVendas.filter((v: any) => v.status === 'pending').reduce((acc: number, v: any) => acc + Number(v.commission_amount), 0);
                const paid = minhasVendas.filter((v: any) => v.status === 'paid').reduce((acc: number, v: any) => acc + Number(v.commission_amount), 0);
                return { ...a, pending, paid, salesCount: minhasVendas.length };
            });
            setAfiliados(affsEnriquecidos);
        }
    };

    useEffect(() => { fetchDados(); }, []);

    // ─── Métricas Calculadas da Aba Afiliados ───
    const afiliadosMetrics = useMemo(() => {
        const totalPendente = todasVendas.filter(v => v.status === 'pending').reduce((acc, v) => acc + Number(v.commission_amount), 0);
        const totalPago = todasVendas.filter(v => v.status === 'paid').reduce((acc, v) => acc + Number(v.commission_amount), 0);
        return {
            totalAfiliados: afiliados.length,
            totalVendas: todasVendas.length,
            pendente: totalPendente,
            pago: totalPago,
            total: totalPendente + totalPago,
        };
    }, [afiliados, todasVendas]);

    // ─── Gráfico: Vendas por Mês ───
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

    // ─── Ranking de Afiliados ───
    const rankingAfiliados = useMemo(() =>
        [...afiliados].sort((a, b) => b.salesCount - a.salesCount).slice(0, 8),
        [afiliados]
    );

    // ─── Ações de Usuário ───
    const buscarUsuario = async () => {
        if (!emailBusca) return;
        setLoading(true);
        setUserEncontrado(null); setAssinaturaAtual(null);
        try {
            const { data: perfil } = await supabase.from('perfis').select('*').eq('email', emailBusca).maybeSingle();
            if (!perfil) { showToast('Usuário não encontrado!', 'error'); return; }
            setUserEncontrado(perfil);
            const { data: sub } = await supabase.from('subscriptions').select('*').eq('user_id', perfil.id).eq('status', 'ativo').gt('data_fim', new Date().toISOString()).maybeSingle();
            setAssinaturaAtual(sub);
        } catch { showToast('Erro ao realizar busca.', 'error'); } finally { setLoading(false); }
    };

    const ativarAssinatura = async (userId: string, plano: 'semanal' | 'mensal') => {
        setBtnLoading(`${userId}-${plano}`);
        const dias = plano === 'semanal' ? 7 : 30;
        const fim = new Date();
        fim.setDate(fim.getDate() + dias);
        try {
            await supabase.from('subscriptions').delete().eq('user_id', userId);
            const { error } = await supabase.from('subscriptions').insert({ user_id: userId, plano, status: 'ativo', data_inicio: new Date().toISOString(), data_fim: fim.toISOString() });
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
            const newTotalPaid = Number(currentAff?.total_paid || 0) + totalToPay;
            await supabase.from('affiliates').update({ total_paid: newTotalPaid }).eq('id', affiliateId);
            showToast(`Pagamento de R$ ${totalToPay.toFixed(2)} registrado!`, 'success');
            fetchDados();
        } catch { showToast('Falha ao processar pagamento.', 'error'); } finally { setBtnLoading(null); }
    };

    // ─────────────────────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] p-8 font-['Inter',sans-serif]">
            {/* Header */}
            <header className="max-w-7xl mx-auto flex items-center justify-between mb-12">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-[var(--accent)] rounded-2xl shadow-lg">
                        <ShieldAlert size={28} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight">Painel Administrativo</h1>
                        <p className="text-[var(--text-secondary)]">Gerenciamento de Assinaturas, Acessos e Afiliados</p>
                    </div>
                </div>
                <button onClick={() => navigate('/admin-celo')} className="btn-ghost flex items-center gap-2 group">
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Voltar ao Dashboard
                </button>
            </header>

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* ── Coluna Lateral: Busca de Usuário ── */}
                <div className="lg:col-span-1 space-y-8">
                    <div className="card p-8">
                        <CardHeader title="Sincronizar Player" icon={Search} />
                        <div className="space-y-4">
                            <input type="email" placeholder="email@exemplo.com" className="input-base" value={emailBusca} onChange={(e) => setEmailBusca(e.target.value.toLowerCase())} onKeyDown={(e) => e.key === 'Enter' && buscarUsuario()} />
                            <button onClick={buscarUsuario} disabled={loading} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
                                {loading ? <Zap className="animate-spin" size={16} /> : 'Buscar Usuário'}
                            </button>
                        </div>
                    </div>
                    {userEncontrado && (
                        <div className="card p-8 animate-reveal">
                            <CardHeader title="Perfil do Jogador" icon={Users} />
                            <div className="space-y-6">
                                <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                                    <p className="font-bold text-lg uppercase">{userEncontrado.nome || 'Sem Nome'}</p>
                                    <p className="text-label text-xs lowercase">{userEncontrado.email}</p>
                                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-[var(--border-subtle)]">
                                        <span className="text-label">Status:</span>
                                        <span className={`badge ${assinaturaAtual ? 'badge-green' : 'badge-red'} font-bold`}>{assinaturaAtual ? 'ATIVO' : 'SEM PLANO'}</span>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <button onClick={() => ativarAssinatura(userEncontrado.id, 'semanal')} disabled={!!btnLoading} className="btn-primary w-full">Ativar Semanal (7 dias)</button>
                                    <button onClick={() => ativarAssinatura(userEncontrado.id, 'mensal')} disabled={!!btnLoading} className="btn-primary w-full">Ativar Mensal (30 dias)</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Coluna Principal: Abas ── */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Seletor de Abas */}
                    <div className="card overflow-hidden">
                        <div className="p-6 border-b border-[var(--border-subtle)]">
                            <div className="flex bg-[var(--bg-main)] p-1 rounded-lg border border-[var(--border-subtle)] w-fit">
                                {(['ativos', 'todos', 'afiliados', 'ips'] as const).map((m) => (
                                    <button key={m} onClick={() => setViewMode(m)} className={`px-4 py-1.5 rounded-md text-[10px] font-bold transition-all ${viewMode === m ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'}`}>
                                        {m.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* ══ ABA ATIVOS ══ */}
                        {viewMode === 'ativos' && (
                            <div className="overflow-x-auto h-[600px] overflow-y-auto custom-scrollbar">
                                <table className="w-full text-left">
                                    <thead className="bg-[var(--bg-surface)] text-label uppercase tracking-wider sticky top-0 z-10">
                                        <tr>
                                            <th className="px-8 py-4">Usuário</th>
                                            <th className="px-8 py-4">Plano</th>
                                            <th className="px-8 py-4">Expiração</th>
                                            <th className="px-8 py-4 text-right">Ação</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--border-subtle)]">
                                        {assinantesAtivos.map(sub => (
                                            <tr key={sub.id} className="hover:bg-white/[0.02] transition-colors">
                                                <td className="px-8 py-5 font-bold">{sub.perfis?.nome || 'Usuário'}</td>
                                                <td className="px-8 py-5"><span className="badge badge-purple">{sub.plano.toUpperCase()}</span></td>
                                                <td className="px-8 py-5 text-sm">{new Date(sub.data_fim).toLocaleDateString()}</td>
                                                <td className="px-8 py-5 text-right"><button onClick={() => desativarAssinatura(sub.user_id, sub.perfis?.email || '')} className="text-red-500 font-bold text-[10px]">DESATIVAR</button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* ══ ABA TODOS ══ */}
                        {viewMode === 'todos' && (
                            <div className="overflow-x-auto h-[600px] overflow-y-auto custom-scrollbar">
                                <table className="w-full text-left">
                                    <thead className="bg-[var(--bg-surface)] text-label uppercase tracking-wider sticky top-0 z-10">
                                        <tr>
                                            <th className="px-8 py-4">Usuário</th>
                                            <th className="px-8 py-4">E-mail</th>
                                            <th className="px-8 py-4">OCR</th>
                                            <th className="px-8 py-4 text-right">Ação</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--border-subtle)]">
                                        {todosUsuarios.map(u => (
                                            <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                                                <td className="px-8 py-5 font-bold uppercase">{u.nome || 'Sem Nome'}</td>
                                                <td className="px-8 py-5 text-xs">{u.email}</td>
                                                <td className="px-8 py-5"><span className="badge badge-ghost text-[10px]">{u.ocr_uses || 0}</span></td>
                                                <td className="px-8 py-5 text-right flex justify-end gap-2">
                                                    <button onClick={() => ativarAssinatura(u.id, 'semanal')} className="p-2 rounded bg-[var(--accent-muted)] text-[var(--accent)]"><Zap size={14} /></button>
                                                    <button onClick={() => ativarAssinatura(u.id, 'mensal')} className="p-2 rounded bg-[var(--accent)] text-white"><Zap size={14} fill="currentColor" /></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* ══ ABA IPS ══ */}
                        {viewMode === 'ips' && (
                            <div className="overflow-x-auto h-[600px] overflow-y-auto custom-scrollbar">
                                <table className="w-full text-left">
                                    <thead className="bg-[var(--bg-surface)] text-label uppercase tracking-wider sticky top-0 z-10">
                                        <tr>
                                            <th className="px-8 py-4">IP Address</th>
                                            <th className="px-8 py-4">ID Usuário</th>
                                            <th className="px-8 py-4">Data</th>
                                            <th className="px-8 py-4 text-right">Ação</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--border-subtle)]">
                                        {ipsRegistrados.map(ip => (
                                            <tr key={ip.id} className="hover:bg-white/[0.02] transition-colors">
                                                <td className="px-8 py-5 font-mono text-[var(--accent)] font-bold">{ip.ip}</td>
                                                <td className="px-8 py-5 truncate max-w-[100px] text-xs opacity-40">{ip.user_id}</td>
                                                <td className="px-8 py-5 text-xs opacity-60">{new Date(ip.created_at).toLocaleDateString()}</td>
                                                <td className="px-8 py-5 text-right"><button onClick={() => liberarIP(ip.ip)} className="text-[var(--accent-green)] font-bold text-[10px]">LIBERAR</button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* ══ ABA AFILIADOS ══ */}
                        {viewMode === 'afiliados' && (
                            <div className="p-6 space-y-8 overflow-y-auto custom-scrollbar" style={{ maxHeight: '90vh' }}>

                                {/* LINHA 1 — 5 Cards de Métricas */}
                                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                                    <AffMetric label="Total de Afiliados" value={afiliadosMetrics.totalAfiliados} icon={Users} color="#7C3AED" />
                                    <AffMetric label="Vendas com Cupom" value={afiliadosMetrics.totalVendas} icon={TrendingUp} color="#7C3AED" />
                                    <AffMetric
                                        label="Comissões Pendentes"
                                        value={`R$ ${afiliadosMetrics.pendente.toFixed(2)}`}
                                        icon={Clock}
                                        color="#F59E0B"
                                    />
                                    <AffMetric
                                        label="Comissões Pagas"
                                        value={`R$ ${afiliadosMetrics.pago.toFixed(2)}`}
                                        icon={CheckCircle}
                                        color="#10B981"
                                    />
                                    <AffMetric
                                        label="Total em Comissões"
                                        value={`R$ ${afiliadosMetrics.total.toFixed(2)}`}
                                        icon={DollarSign}
                                        color="#A855F7"
                                    />
                                </div>

                                {/* LINHA 2 — Gráfico + Ranking */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Gráfico de Barras — Vendas por Mês */}
                                    <div className="card p-6">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="p-2.5 rounded-lg bg-[var(--accent-muted)] text-[var(--accent)]">
                                                <BarChart2 size={16} />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-bold">Vendas por Mês</h3>
                                                <p className="text-[10px] text-[var(--text-tertiary)]">Valor total e comissões</p>
                                            </div>
                                        </div>
                                        {vendasPorMes.length === 0 ? (
                                            <div className="h-40 flex items-center justify-center opacity-20">
                                                <p className="text-xs uppercase tracking-widest font-bold">Sem dados ainda</p>
                                            </div>
                                        ) : (
                                            <div className="h-44">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={vendasPorMes} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                                                        <CartesianGrid stroke="var(--border-subtle)" vertical={false} strokeDasharray="3 3" />
                                                        <XAxis dataKey="mes" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: 'var(--text-tertiary)', fontWeight: 600 }} />
                                                        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }} />
                                                        <Tooltip contentStyle={neonStyle} />
                                                        <Bar dataKey="vendas" name="Vendas R$" fill="#7C3AED" radius={[4, 4, 0, 0]} barSize={18} />
                                                        <Bar dataKey="comissoes" name="Comissões R$" fill="#A855F7" radius={[4, 4, 0, 0]} barSize={18} />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        )}
                                    </div>

                                    {/* Ranking de Afiliados */}
                                    <div className="card p-6">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="p-2.5 rounded-lg bg-[var(--accent-muted)] text-[var(--accent)]">
                                                <TrendingUp size={16} />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-bold">Ranking de Afiliados</h3>
                                                <p className="text-[10px] text-[var(--text-tertiary)]">Por total de indicações</p>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            {rankingAfiliados.length === 0 ? (
                                                <p className="text-xs opacity-20 text-center py-8 uppercase tracking-widest font-bold">Sem afiliados ainda</p>
                                            ) : (
                                                rankingAfiliados.map((aff, idx) => (
                                                    <div key={aff.id} className="flex items-center justify-between py-2 border-b border-[var(--border-subtle)] last:border-0">
                                                        <div className="flex items-center gap-3">
                                                            <span className={`text-[10px] font-black w-5 text-center ${idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-zinc-300' : idx === 2 ? 'text-amber-600' : 'text-[var(--text-tertiary)]'}`}>
                                                                {idx + 1}
                                                            </span>
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
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* LINHA 3 — Tabela de Afiliados */}
                                <div className="card overflow-hidden">
                                    <div className="px-6 py-4 border-b border-[var(--border-subtle)] flex items-center gap-2">
                                        <Users size={14} className="text-[var(--accent)]" />
                                        <h3 className="text-sm font-bold uppercase tracking-widest">Todos os Afiliados</h3>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead className="bg-[var(--bg-surface)] text-label uppercase tracking-wider text-[10px]">
                                                <tr>
                                                    <th className="px-6 py-3">Afiliado</th>
                                                    <th className="px-6 py-3">E-mail</th>
                                                    <th className="px-6 py-3">Código</th>
                                                    <th className="px-6 py-3">Vendas</th>
                                                    <th className="px-6 py-3">Pendente</th>
                                                    <th className="px-6 py-3">Pago</th>
                                                    <th className="px-6 py-3 text-right">Ação</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[var(--border-subtle)]">
                                                {afiliados.length === 0 ? (
                                                    <tr><td colSpan={7} className="px-6 py-12 text-center text-xs opacity-20 uppercase tracking-widest font-bold">Sem afiliados registrados</td></tr>
                                                ) : afiliados.map(aff => (
                                                    <tr key={aff.id} className="hover:bg-white/[0.02] transition-colors">
                                                        <td className="px-6 py-4 font-bold text-sm uppercase">{aff.perfis?.nome || '—'}</td>
                                                        <td className="px-6 py-4 text-xs text-[var(--text-tertiary)]">{aff.perfis?.email || '—'}</td>
                                                        <td className="px-6 py-4 font-mono font-black text-[var(--accent)]">{aff.coupon_code}</td>
                                                        <td className="px-6 py-4 text-sm font-bold">{aff.salesCount}</td>
                                                        <td className="px-6 py-4 text-amber-500 font-black text-sm">R$ {aff.pending.toFixed(2)}</td>
                                                        <td className="px-6 py-4 text-green-500 font-black text-sm">R$ {aff.paid.toFixed(2)}</td>
                                                        <td className="px-6 py-4 text-right">
                                                            <button
                                                                onClick={() => marcarComoPago(aff.id, aff.perfis?.nome || 'Afiliado')}
                                                                disabled={aff.pending <= 0 || btnLoading === `pay-${aff.id}`}
                                                                className={`px-3 py-1.5 rounded font-black text-[10px] uppercase tracking-widest transition-all ${
                                                                    aff.pending > 0
                                                                        ? 'bg-green-500/15 text-green-400 hover:bg-green-500/25'
                                                                        : 'bg-[var(--bg-surface)] text-[var(--text-tertiary)] cursor-not-allowed opacity-50'
                                                                }`}
                                                            >
                                                                {btnLoading === `pay-${aff.id}` ? '...' : 'Marcar Pago'}
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* LINHA 4 — Histórico de Todas as Vendas */}
                                <div className="card overflow-hidden">
                                    <div className="px-6 py-4 border-b border-[var(--border-subtle)] flex items-center gap-2">
                                        <DollarSign size={14} className="text-[var(--accent)]" />
                                        <h3 className="text-sm font-bold uppercase tracking-widest">Histórico de Todas as Vendas</h3>
                                        <span className="ml-auto badge badge-ghost text-[10px]">{todasVendas.length} registros</span>
                                    </div>
                                    <div className="overflow-x-auto max-h-96 overflow-y-auto custom-scrollbar">
                                        <table className="w-full text-left">
                                            <thead className="bg-[var(--bg-surface)] text-label uppercase tracking-wider text-[10px] sticky top-0 z-10">
                                                <tr>
                                                    <th className="px-6 py-3">Data</th>
                                                    <th className="px-6 py-3">Afiliado</th>
                                                    <th className="px-6 py-3">Código</th>
                                                    <th className="px-6 py-3">Plano</th>
                                                    <th className="px-6 py-3">Valor</th>
                                                    <th className="px-6 py-3">Comissão</th>
                                                    <th className="px-6 py-3">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[var(--border-subtle)]">
                                                {todasVendas.length === 0 ? (
                                                    <tr><td colSpan={7} className="px-6 py-12 text-center text-xs opacity-20 uppercase tracking-widest font-bold">Nenhuma venda registrada</td></tr>
                                                ) : todasVendas.map(v => (
                                                    <tr key={v.id} className="hover:bg-white/[0.02] transition-colors">
                                                        <td className="px-6 py-4 text-xs font-medium whitespace-nowrap">
                                                            {new Date(v.created_at).toLocaleDateString('pt-BR')}
                                                        </td>
                                                        <td className="px-6 py-4 text-xs font-bold uppercase">
                                                            {v.affiliates?.perfis?.nome || v.affiliates?.perfis?.email || '—'}
                                                        </td>
                                                        <td className="px-6 py-4 font-mono font-black text-[var(--accent)] text-xs">
                                                            {v.affiliates?.coupon_code || '—'}
                                                        </td>
                                                        <td className="px-6 py-4 text-xs font-bold uppercase">{v.plan_name}</td>
                                                        <td className="px-6 py-4 text-xs font-bold text-[var(--text-secondary)]">
                                                            R$ {Number(v.sale_amount).toFixed(2)}
                                                        </td>
                                                        <td className="px-6 py-4 text-xs font-black">
                                                            R$ {Number(v.commission_amount).toFixed(2)}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            {v.status === 'pending' ? (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-[9px] font-black uppercase tracking-widest">
                                                                    <Clock size={8} /> Pendente
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 text-[9px] font-black uppercase tracking-widest">
                                                                    <CheckCircle size={8} /> Pago
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Toast */}
            {toast && (
                <div className="fixed top-8 right-8 z-[100] card p-4 flex items-center gap-3 animate-fade-in border border-[var(--border-default)] shadow-2xl">
                    <span className={`font-bold text-sm ${toast.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                        {toast.message}
                    </span>
                </div>
            )}
        </div>
    );
};
