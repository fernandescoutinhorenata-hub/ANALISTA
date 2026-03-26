import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Search, ArrowLeft, Users, 
    Zap, ShieldAlert
} from 'lucide-react';
import { supabase } from '../lib/supabase';

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
    const [todosUsuarios, setTodosUsuarios] = useState<any[]>([]);
    const [ipsRegistrados, setIpsRegistrados] = useState<any[]>([]);
    const [afiliados, setAfiliados] = useState<any[]>([]);
    const [viewMode, setViewMode] = useState<'ativos' | 'todos' | 'ips' | 'afiliados'>('ativos');
    const [loading, setLoading] = useState(false);
    const [btnLoading, setBtnLoading] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    const fetchDados = async () => {
        setLoading(true);
        try {
            const { data: subs } = await supabase
                .from('subscriptions')
                .select('*')
                .eq('status', 'ativo')
                .gt('data_fim', new Date().toISOString())
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

            try {
                const { data: funcData } = await supabase.functions.invoke('get-all-users');
                if (funcData?.users) setTodosUsuarios(funcData.users);
                else {
                    const { data: todos } = await supabase.from('perfis').select('id, email, nome, ocr_uses, created_at').order('created_at', { ascending: false }).limit(1000);
                    setTodosUsuarios(todos || []);
                }
            } catch (e) {
                const { data: todos } = await supabase.from('perfis').select('id, email, nome, ocr_uses, created_at').order('created_at', { ascending: false }).limit(1000);
                setTodosUsuarios(todos || []);
            }

            const { data: ips } = await supabase.from('ip_registros').select('*').order('created_at', { ascending: false });
            setIpsRegistrados(ips || []);

            const { data: affs } = await supabase.from('affiliates').select('*, perfis(nome, email)').order('created_at', { ascending: false });
            if (affs) {
                const affsWithStats = await Promise.all(affs.map(async (a: any) => {
                    const { data: v } = await supabase.from('affiliate_sales').select('commission_amount, status').eq('affiliate_id', a.id);
                    const pending = (v || []).filter(s => s.status === 'pending').reduce((acc, s) => acc + Number(s.commission_amount), 0);
                    return { ...a, pending };
                }));
                setAfiliados(affsWithStats);
            }
        } catch (err: any) {
            console.error('Erro ao carregar dados adm:', err);
            showToast('Falha técnica ao carregar banco', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchDados(); }, []);

    const buscarUsuario = async () => {
        if (!emailBusca) return;
        setLoading(true);
        setUserEncontrado(null);
        setAssinaturaAtual(null);
        try {
            const { data: perfil } = await supabase.from('perfis').select('*').eq('email', emailBusca).maybeSingle();
            if (!perfil) { showToast('Usuário não encontrado!', 'error'); return; }
            setUserEncontrado(perfil);
            const { data: sub } = await supabase.from('subscriptions').select('*').eq('user_id', perfil.id).eq('status', 'ativo').gt('data_fim', new Date().toISOString()).maybeSingle();
            setAssinaturaAtual(sub);
        } catch (error) { showToast('Erro ao realizar busca.', 'error'); } finally { setLoading(false); }
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
        } catch (error) { showToast('Erro ao liberar acesso.', 'error'); } finally { setBtnLoading(null); }
    };

    const desativarAssinatura = async (userId: string, email: string) => {
        if (!window.confirm(`Desativar assinatura de [${email}]?`)) return;
        setBtnLoading(`desativar-${userId}`);
        try {
            const { error } = await supabase.from('subscriptions').update({ status: 'expirado' }).eq('user_id', userId).eq('status', 'ativo');
            if (error) throw error;
            showToast('Assinatura desativada.', 'success');
            fetchDados();
        } catch (error) { showToast('Falha ao desativar.', 'error'); } finally { setBtnLoading(null); }
    };

    const liberarIP = async (ip: string) => {
        if (!window.confirm(`Liberar IP ${ip}?`)) return;
        setBtnLoading(`liberar-ip-${ip}`);
        try {
            const { error } = await supabase.from('ip_registros').delete().eq('ip', ip);
            if (error) throw error;
            showToast('IP liberado!', 'success');
            fetchDados();
        } catch (error) { showToast('Erro ao liberar IP.', 'error'); } finally { setBtnLoading(null); }
    };

    const marcarComoPago = async (affiliateId: string) => {
        if (!window.confirm("Marcar TODAS as vendas pendentes deste afiliado como PAGAS?")) return;
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
        } catch (error) { showToast('Falha ao processar pagamento.', 'error'); } finally { setBtnLoading(null); }
    };

    return (
        <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] p-8 font-['Inter',sans-serif]">
            <header className="max-w-7xl mx-auto flex items-center justify-between mb-12">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-[var(--accent)] rounded-2xl shadow-lg">
                        <ShieldAlert size={28} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight">Painel Administrativo</h1>
                        <p className="text-[var(--text-secondary)]">Gerenciamento de Assinaturas e Acessos</p>
                    </div>
                </div>
                <button onClick={() => navigate('/admin-celo')} className="btn-ghost flex items-center gap-2 group">
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Voltar ao Dashboard
                </button>
            </header>

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
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

                <div className="lg:col-span-2 space-y-8">
                    <div className="card overflow-hidden">
                        <div className="p-8 border-b border-[var(--border-subtle)] flex items-center justify-between">
                            <div className="flex bg-[var(--bg-main)] p-1 rounded-lg border border-[var(--border-subtle)]">
                                {['ativos', 'todos', 'afiliados', 'ips'].map((m) => (
                                    <button key={m} onClick={() => setViewMode(m as any)} className={`px-4 py-1.5 rounded-md text-[10px] font-bold transition-all ${viewMode === m ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'}`}>
                                        {m.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="overflow-x-auto h-[600px] overflow-y-auto custom-scrollbar">
                            <table className="w-full text-left">
                                <thead className="bg-[var(--bg-surface)] text-label uppercase tracking-wider sticky top-0 z-10">
                                    <tr>
                                        {viewMode === 'ativos' && (<><th className="px-8 py-4">Usuário</th><th className="px-8 py-4">Plano</th><th className="px-8 py-4">Expiração</th></>)}
                                        {viewMode === 'todos' && (<><th className="px-8 py-4">Usuário</th><th className="px-8 py-4">E-mail</th><th className="px-8 py-4">OCR</th></>)}
                                        {viewMode === 'afiliados' && (<><th className="px-8 py-4">Afiliado</th><th className="px-8 py-4">Código</th><th className="px-8 py-4">Pendente</th></>)}
                                        {viewMode === 'ips' && (<><th className="px-8 py-4">IP Address</th><th className="px-8 py-4">ID Usuário</th><th className="px-8 py-4">Data</th></>)}
                                        <th className="px-8 py-4 text-right">Ação</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border-subtle)]">
                                    {viewMode === 'ativos' && assinantesAtivos.map(sub => (
                                        <tr key={sub.id} className="table-row group">
                                            <td className="px-8 py-5 font-bold">{sub.perfis?.nome || 'Usuário'}</td>
                                            <td className="px-8 py-5"><span className="badge badge-purple">{sub.plano.toUpperCase()}</span></td>
                                            <td className="px-8 py-5 text-sm">{new Date(sub.data_fim).toLocaleDateString()}</td>
                                            <td className="px-8 py-5 text-right"><button onClick={() => desativarAssinatura(sub.user_id, sub.perfis?.email || '')} className="text-red-500 font-bold text-[10px]">DESATIVAR</button></td>
                                        </tr>
                                    ))}
                                    {viewMode === 'todos' && todosUsuarios.map(u => (
                                        <tr key={u.id} className="table-row group">
                                            <td className="px-8 py-5 font-bold uppercase">{u.nome || 'Sem Nome'}</td>
                                            <td className="px-8 py-5 text-xs">{u.email}</td>
                                            <td className="px-8 py-5"><span className="badge badge-ghost text-[10px]">{u.ocr_uses || 0}</span></td>
                                            <td className="px-8 py-5 text-right flex justify-end gap-2">
                                                <button onClick={() => ativarAssinatura(u.id, 'semanal')} className="p-2 rounded bg-[var(--accent-muted)] text-[var(--accent)]"><Zap size={14} /></button>
                                                <button onClick={() => ativarAssinatura(u.id, 'mensal')} className="p-2 rounded bg-[var(--accent)] text-white"><Zap size={14} fill="currentColor" /></button>
                                            </td>
                                        </tr>
                                    ))}
                                    {viewMode === 'afiliados' && afiliados.map(aff => (
                                        <tr key={aff.id} className="table-row group">
                                            <td className="px-8 py-5 font-bold uppercase">{aff.perfis?.nome || 'Afiliado'}</td>
                                            <td className="px-8 py-5 font-mono text-[var(--accent)] font-bold">{aff.coupon_code}</td>
                                            <td className="px-8 py-5 text-amber-500 font-black">R$ {aff.pending.toFixed(2)}</td>
                                            <td className="px-8 py-5 text-right"><button onClick={() => marcarComoPago(aff.id)} disabled={aff.pending <= 0} className="px-3 py-1 bg-green-500/10 text-green-500 rounded font-bold text-[10px]">PAGAR</button></td>
                                        </tr>
                                    ))}
                                    {viewMode === 'ips' && ipsRegistrados.map(ip => (
                                        <tr key={ip.id} className="table-row group">
                                            <td className="px-8 py-5 font-mono text-[var(--accent)] font-bold">{ip.ip}</td>
                                            <td className="px-8 py-5 truncate max-w-[100px] text-xs opacity-40">{ip.user_id}</td>
                                            <td className="px-8 py-5 text-xs opacity-60">{new Date(ip.created_at).toLocaleDateString()}</td>
                                            <td className="px-8 py-5 text-right"><button onClick={() => liberarIP(ip.ip)} className="text-[var(--accent-green)] font-bold text-[10px]">LIBERAR</button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
            {toast && (
                <div className={`fixed top-8 right-8 z-[100] card p-4 flex items-center gap-3 animate-fade-in`}>
                    <span className="font-bold">{toast.message}</span>
                </div>
            )}
        </div>
    );
};
