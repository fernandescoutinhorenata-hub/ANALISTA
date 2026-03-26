
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    XAxis, YAxis, Tooltip, ResponsiveContainer,
    AreaChart, Area
} from 'recharts';
import {
    Trophy, Target, Zap, 
    TrendingUp, Users, Sword,
    LayoutDashboard,
    AlertCircle, Map, Activity
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { DashboardData } from '../types';
import { processData } from '../utils/data-processing';

// ─── Design Tokens ────────────────────────────────────────────────────────
const S = {
    bgMain: '#0B0B0C',
    bgCard: '#161618',
    accent: '#A855F7',
    border: '#2D2D30',
};

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <div className={`bg-[#161618] border border-[#2D2D30] rounded-2xl p-6 relative overflow-hidden shadow-xl ${className}`}>
        {children}
    </div>
);

const MetricCard: React.FC<{ title: string; value: string | number; icon: any; color?: string; glow?: boolean }> = ({ title, value, icon: Icon, color = S.accent, glow }) => (
    <div className="bg-[#161618] border border-[#2D2D30] rounded-2xl p-6 flex flex-col gap-3 relative transition-all hover:border-[#A855F7]/40 shadow-lg">
        <div className="flex justify-between items-start">
            <div className="p-2.5 rounded-xl bg-[#A855F7]/10 text-[#A855F7]" style={{ color: color, backgroundColor: `${color}15` }}>
                <Icon size={20} />
            </div>
            {glow && <div className="absolute top-0 right-0 w-20 h-20 bg-[#A855F7]/5 blur-3xl rounded-full" />}
        </div>
        <div>
            <h3 className="text-3xl font-black text-white tracking-tighter">{value}</h3>
            <p className="text-[10px] font-bold text-[#71717A] uppercase tracking-widest mt-1">{title}</p>
        </div>
    </div>
);

export const PublicSquad: React.FC = () => {
    const { token } = useParams();
    const navigate = useNavigate();

    const [coachProfile, setCoachProfile] = useState<any>(null);
    const [data, setData] = useState<DashboardData | null>(null);
    const [allGeneralRows, setAllGeneralRows] = useState<any[]>([]);
    const [allPlayerRows, setAllPlayerRows] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'players'>('overview');
    const [filters, setFilters] = useState({ date: 'Todos', championship: 'Todos' });

    // ─── BUSCA DE DADOS ───────────────────────────────────────────────────
    useEffect(() => {
        if (!token) return;

        const fetchData = async () => {
            setIsLoading(true);
            try {
                // 1. Validar Token e obter Coach ID
                const { data: profile, error: profileErr } = await supabase
                    .from('perfis')
                    .select('id, nome, share_token')
                    .eq('share_token', token)
                    .single();

                if (profileErr || !profile) {
                    setError('Link de compartilhamento inválido ou expirado.');
                    return;
                }
                setCoachProfile(profile);

                // 2. Buscar Dados usando o Token no Header (para o RLS funcionar com current_setting)
                // O Supabase JS não injeta headers no RLS facilmente, então usaremos o filtro ID + Token na query
                const [generalRes, playersRes] = await Promise.all([
                    supabase
                        .from('partidas_geral')
                        .select('*')
                        .eq('user_id', profile.id)
                        .order('data', { ascending: false }),
                    supabase
                        .from('performance_jogadores')
                        .select('*')
                        .eq('user_id', profile.id)
                ]);

                if (generalRes.error || playersRes.error) throw new Error('Erro ao carregar banco.');

                const mappedGen = (generalRes.data || []).map(r => ({
                    Data: r.data,
                    Campeonato: r.campeonato,
                    Rodada: r.rodada,
                    Mapa: r.mapa,
                    Equipe: r.equipe,
                    Colocacao: r.colocacao,
                    Kill: r.kill,
                    "Pontos/Posicao": r.pontos_posicao,
                    Pontos_Total: r.pontos_total,
                    Booyah: r.booyah ? 'SIM' : 'NAO',
                }));

                const mappedPlay = (playersRes.data || []).map(r => ({
                    Data: r.data,
                    Equipe: r.equipe,
                    Modo: r.modo,
                    Mapa: r.mapa,
                    Posicao: r.posicao,
                    Player: r.player,
                    Kill: r.kill,
                    Morte: r.morte,
                    Assistencia: r.assistencia,
                    Queda: r.queda,
                    "Dano causado": r.dano_causado,
                    "Derrubados": r.derrubados,
                    "Ressurgimento": r.ressurgimento
                }));

                setAllGeneralRows(mappedGen);
                setAllPlayerRows(mappedPlay);

            } catch (err) {
                setError('Ocorreu um erro ao processar os dados do squad.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [token]);

    // ─── PROCESSAMENTO ─────────────────────────────────────────────────────
    useEffect(() => {
        if (allGeneralRows.length > 0) {
            const fGen = allGeneralRows.filter(r => (filters.date === 'Todos' || r.Data === filters.date) && (filters.championship === 'Todos' || r.Campeonato === filters.championship));
            const fPlay = allPlayerRows.filter(r => filters.date === 'Todos' || r.Data === filters.date);
            setData(processData(fGen, fPlay));
        }
    }, [filters, allGeneralRows, allPlayerRows]);

    const filterOptions = useMemo(() => {
        const dates = new Set(allGeneralRows.map(r => r.Data).filter(Boolean));
        const champs = new Set(allGeneralRows.map(r => r.Campeonato).filter(Boolean));
        return { dates: Array.from(dates).sort(), championships: Array.from(champs).sort() };
    }, [allGeneralRows]);

    const playerTableData = useMemo(() => {
        if (!data || allPlayerRows.length === 0) return [];
        const agg: Record<string, any> = {};
        allPlayerRows.filter(r => filters.date === 'Todos' || r.Data === filters.date).forEach(p => {
            if (!agg[p.Player]) agg[p.Player] = { name: p.Player, kills: 0, deaths: 0, assists: 0, damage: 0, knocks: 0 };
            agg[p.Player].kills += p.Kill || 0;
            agg[p.Player].deaths += p.Morte || 0;
            agg[p.Player].assists += p.Assistencia || 0;
            agg[p.Player].damage += p["Dano causado"] || 0;
            agg[p.Player].knocks += p.Derrubados || 0;
        });
        return Object.values(agg).map(a => ({
            ...a,
            kd: parseFloat((a.kills / (a.deaths || 1)).toFixed(2))
        })).sort((a,b) => b.kills - a.kills);
    }, [data, allPlayerRows, filters.date]);

    if (isLoading) return (
        <div className="min-h-screen bg-[#0B0B0C] flex flex-col items-center justify-center text-white">
            <div className="w-12 h-12 border-2 border-[#A855F7]/20 border-t-[#A855F7] rounded-full animate-spin mb-4" />
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">Sincronizando Squad</p>
        </div>
    );

    if (error) return (
        <div className="min-h-screen bg-[#0B0B0C] flex flex-col items-center justify-center text-white p-6 text-center">
            <AlertCircle size={48} className="text-red-500 mb-4" />
            <h2 className="text-2xl font-black uppercase mb-2">Acesso Negado</h2>
            <p className="text-zinc-500 text-sm max-w-xs">{error}</p>
            <button onClick={() => navigate('/register')} className="mt-8 bg-[#A855F7] text-white px-8 py-3 rounded-full font-black text-xs uppercase tracking-widest hover:scale-105 transition-transform shadow-xl shadow-[#A855F7]/20">
                Criar meu próprio Dashboard
            </button>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0B0B0C] text-white font-['Inter',sans-serif]">
            {/* ─── HEADER ─── */}
            <header className="h-20 bg-[#0B0B0C]/80 backdrop-blur-xl border-b border-[#2D2D30] sticky top-0 z-50 px-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <img src="/image_10.png" alt="Logo" className="h-10 w-auto" />
                    <div className="h-8 w-px bg-[#2D2D30]" />
                    <div>
                        <span className="block text-[9px] font-black text-[#A855F7] uppercase tracking-[0.2em] mb-0.5">Analytics Público</span>
                        <span className="block text-xs font-black uppercase">Coach: {coachProfile?.nome || 'Analista'}</span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="hidden lg:flex items-center gap-2 bg-[#161618] border border-[#2D2D30] p-1.5 rounded-xl">
                        <select className="bg-transparent text-[10px] font-bold uppercase tracking-widest text-[#A1A1AA] outline-none px-3 border-r border-[#2D2D30]" 
                                value={filters.date} onChange={e => setFilters(prev => ({...prev, date: e.target.value}))}>
                            <option value="Todos">Todas as Datas</option>
                            {filterOptions.dates.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                        <select className="bg-transparent text-[10px] font-bold uppercase tracking-widest text-[#A1A1AA] outline-none px-3"
                                value={filters.championship} onChange={e => setFilters(prev => ({...prev, championship: e.target.value}))}>
                            <option value="Todos">Todos Eventos</option>
                            {filterOptions.championships.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <button onClick={() => navigate('/register')} className="bg-white text-black px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-zinc-200 transition-colors shadow-lg shadow-white/5">
                        Começar
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto p-6 lg:p-10 space-y-8">
                {/* ─── TABS ─── */}
                <div className="flex gap-2 p-1 bg-[#161618] border border-[#2D2D30] rounded-2xl w-fit">
                    {[
                        { id: 'overview', label: 'Estatísticas', icon: LayoutDashboard },
                        { id: 'players', label: 'Desempenho Jogadores', icon: Users },
                    ].map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-[#A855F7] text-white shadow-lg shadow-[#A855F7]/20' : 'text-zinc-500 hover:text-white'}`}>
                            <tab.icon size={14} /> {tab.label}
                        </button>
                    ))}
                </div>

                {data && activeTab === 'overview' && (
                    <div className="space-y-8 animate-fade-in">
                        {/* Metrics Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                            <MetricCard title="Total Kills" value={data.playerMetrics.totalKills} icon={Sword} glow />
                            <MetricCard title="Pontuação Total" value={data.general.totalPontos} icon={Trophy} />
                            <MetricCard title="Booyahs" value={data.general.totalBooyahs} icon={TrendingUp} color="#10B981" />
                            <MetricCard title="Dano Médio / Queda" value={data.squadMetrics.avgDamage.toLocaleString()} icon={Target} color="#BEF264" />
                        </div>

                        {/* Charts Area */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <Card className="lg:col-span-2 min-h-[400px]">
                                <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-10">Evolução Diária (Kills)</h4>
                                <ResponsiveContainer width="100%" height={300}>
                                    <AreaChart data={allGeneralRows.map(r => ({ data: r.Data, kill: r.Kill })).reverse()}>
                                        <defs>
                                            <linearGradient id="gradPublic" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#A855F7" stopOpacity={0.3} />
                                                <stop offset="100%" stopColor="#A855F7" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="data" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#52525B' }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#52525B' }} />
                                        <Tooltip contentStyle={{ backgroundColor: '#161618', border: '1px solid #2D2D30', borderRadius: '12px' }} />
                                        <Area type="monotone" dataKey="kill" stroke="#A855F7" fill="url(#gradPublic)" strokeWidth={3} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </Card>

                            <div className="space-y-6">
                                <Card>
                                    <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-6">Squad Performance</h4>
                                    <div className="space-y-5">
                                        {[
                                            { label: 'Total Quedas', value: data.general.totalQuedas, icon: Activity },
                                            { label: 'K/D Equipe', value: data.playerMetrics.kdRatio, icon: Zap },
                                            { label: 'Booyah Rate', value: `${data.general.percentBooyah}%`, icon: Trophy },
                                        ].map((item, i) => (
                                            <div key={i} className="flex items-center justify-between">
                                                <div className="flex items-center gap-3 text-zinc-400">
                                                    <item.icon size={12} />
                                                    <span className="text-[10px] uppercase font-bold tracking-widest">{item.label}</span>
                                                </div>
                                                <span className="text-white font-black text-sm">{item.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                                <Card>
                                    <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Mapa Dominante</h4>
                                    <div className="text-center py-4">
                                        <Map className="mx-auto text-[#A855F7] mb-2" size={32} />
                                        <span className="block text-2xl font-black uppercase text-white">{data.byMap[0]?.mapa || 'N/A'}</span>
                                        <span className="text-[9px] text-zinc-500 uppercase font-black">{data.byMap[0]?.totalPontos || 0} Pontos Acumulados</span>
                                    </div>
                                </Card>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'players' && (
                    <Card className="animate-fade-in !p-0 overflow-hidden">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-[#1C1C1F] border-b border-[#2D2D30]">
                                    {['Jogador', 'Abates', 'Mortes', 'Assists', 'Dano', 'KD'].map((h, i) => (
                                        <th key={i} className="px-6 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {playerTableData.map((p, idx) => (
                                    <tr key={idx} className="border-b border-[#2D2D30]/50 hover:bg-[#A855F7]/5 transition-colors group">
                                        <td className="px-6 py-5 font-black text-white uppercase text-xs">{p.name}</td>
                                        <td className="px-6 py-5 font-bold text-[#A855F7]">{p.kills}</td>
                                        <td className="px-6 py-5 text-zinc-400">{p.deaths}</td>
                                        <td className="px-6 py-5 text-zinc-400">{p.assists}</td>
                                        <td className="px-6 py-5 font-mono text-zinc-300">{p.damage.toLocaleString()}</td>
                                        <td className="px-6 py-5">
                                            <span className="bg-[#A855F7]/10 text-[#A855F7] px-2 py-1 rounded text-[10px] font-black">{p.kd} KD</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Card>
                )}
            </main>
        </div>
    );
};
