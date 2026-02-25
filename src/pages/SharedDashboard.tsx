import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell,
    AreaChart, Area, Legend
} from 'recharts';
import {
    Trophy, Target, Zap, FileSpreadsheet,
    TrendingUp, Users, Sword,
    Calendar, LayoutDashboard, UserPlus,
    AlertCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { DashboardData } from '../types';
import { processData } from '../utils/data-processing';

// ─── SaaS Premium – Design Tokens ──────────────────────────────────────────
const S = {
    bgMain: { backgroundColor: '#0B0B0C' },
    bgCard: { backgroundColor: '#161618' },
    border: { border: '1px solid #2D2D30' },
};

// ─── Shared Card ─────────────────────────────────────────────────────────────
const Card: React.FC<{ children: React.ReactNode; className?: string; style?: React.CSSProperties }> = ({ children, className = '', style }) => (
    <div
        className={`rounded-xl p-6 ${className}`}
        style={{ backgroundColor: '#161618', border: '1px solid #2D2D30', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', ...style }}
    >
        {children}
    </div>
);

// ─── Metric Card ─────────────────────────────────────────────────────────────
const MetricCard: React.FC<{
    title: string;
    value: string | number;
    subValue?: string;
    icon: any;
    accentColor: string;
}> = ({ title, value, subValue, icon: Icon, accentColor }) => (
    <div
        className="rounded-xl p-6 flex flex-col gap-4"
        style={{ backgroundColor: '#161618', border: '1px solid #2D2D30' }}
    >
        <div className="flex justify-between items-start">
            <div
                className="p-2.5 rounded-lg"
                style={{ backgroundColor: `${accentColor}10`, color: accentColor }}
            >
                <Icon size={20} />
            </div>
            {subValue && (
                <span
                    className="text-[10px] font-semibold px-2 py-1 rounded-md uppercase tracking-wider"
                    style={{ color: '#A1A1AA', backgroundColor: '#2D2D30' }}
                >
                    {subValue}
                </span>
            )}
        </div>
        <div>
            <h3
                className="text-3xl font-bold tracking-tight"
                style={{ color: '#FFFFFF', fontFamily: "'Inter', sans-serif" }}
            >
                {value}
            </h3>
            <p
                className="text-sm font-medium mt-1"
                style={{ color: '#71717A', fontFamily: "'Inter', sans-serif" }}
            >
                {title}
            </p>
        </div>
    </div>
);

const DashboardStyles = () => (
    <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(139, 92, 246, 0.2); border-radius: 10px; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
    `}</style>
);

export const SharedDashboard: React.FC = () => {
    const { userId } = useParams();
    const navigate = useNavigate();

    const [allGeneralRows, setAllGeneralRows] = useState<any[]>([]);
    const [allPlayerRows, setAllPlayerRows] = useState<any[]>([]);
    const [data, setData] = useState<DashboardData | null>(null);
    const [isDashboardLoading, setIsDashboardLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [filters, setFilters] = useState({ date: 'Todos', championship: 'Todos' });
    const [nomeCoach, setNomeCoach] = useState<string>('');

    const filterOptions = useMemo(() => {
        const dates = new Set<string>();
        const championships = new Set<string>();
        allGeneralRows.forEach(row => {
            if (row.Data) dates.add(String(row.Data));
            if (row.Campeonato) championships.add(String(row.Campeonato));
        });
        return { dates: Array.from(dates).sort(), championships: Array.from(championships).sort() };
    }, [allGeneralRows]);

    useEffect(() => {
        if (!userId) return;

        const fetchDashboardData = async () => {
            setIsDashboardLoading(true);
            setFetchError(null);
            try {
                // Fetch profiles to get coach name
                const { data: profile } = await supabase.from('perfis').select('nome').eq('id', userId).single();
                if (profile) setNomeCoach(profile.nome);

                const [generalRes, playersRes] = await Promise.all([
                    supabase.from('partidas_geral').select('*').eq('user_id', userId).order('rodada', { ascending: true }),
                    supabase.from('performance_jogadores').select('*').eq('user_id', userId)
                ]);

                if (generalRes.error) throw generalRes.error;
                if (playersRes.error) throw playersRes.error;

                const mappedGeneral = (generalRes.data || []).map(row => ({
                    Data: row.data,
                    Campeonato: row.campeonato,
                    Rodada: row.rodada,
                    Mapa: row.mapa,
                    Equipe: row.equipe,
                    Colocacao: row.colocacao,
                    Kill: row.kill,
                    "Pontos/Posicao": row.pontos_posicao,
                    Pontos_Total: row.pontos_total,
                    Booyah: row.booyah ? 'SIM' : 'NAO',
                }));
                setAllGeneralRows(mappedGeneral);

                const mappedPlayers = (playersRes.data || []).map(row => ({
                    Data: row.data,
                    Equipe: row.equipe,
                    Modo: row.modo,
                    Mapa: row.mapa,
                    Posicao: row.posicao,
                    Player: row.player,
                    Kill: row.kill,
                    Morte: row.morte,
                    Assistencia: row.assistencia,
                    Queda: row.queda,
                    "Dano causado": row.dano_causado,
                    "Derrubados": row.derrubados,
                    "Ressurgimento": row.ressurgimento
                }));
                setAllPlayerRows(mappedPlayers);

            } catch (error: any) {
                console.error('Erro ao buscar dados:', error);
                setFetchError('Não foi possível carregar o dashboard público.');
            } finally {
                setIsDashboardLoading(false);
            }
        };

        fetchDashboardData();
    }, [userId]);

    useEffect(() => {
        if (allGeneralRows.length === 0) {
            setData(null);
            return;
        }
        const filteredGeneral = allGeneralRows.filter(row => {
            const matchDate = filters.date === 'Todos' || String(row.Data) === filters.date;
            const matchChamp = filters.championship === 'Todos' || String(row.Campeonato) === filters.championship;
            return matchDate && matchChamp;
        });
        const filteredPlayers = allPlayerRows.filter(row =>
            filters.date === 'Todos' || String(row.Data) === filters.date
        );
        setData(processData(filteredGeneral, filteredPlayers));
    }, [filters, allGeneralRows, allPlayerRows]);

    const filteredPlayerRows = useMemo(() =>
        allPlayerRows.filter(row =>
            filters.date === 'Todos' || String(row.Data) === filters.date
        ),
        [allPlayerRows, filters.date]);


    const playerChartData = useMemo(() => {
        if (filteredPlayerRows.length === 0) return [];
        interface PlayerAgg { name: string; kills: number; damage: number; assists: number; deaths: number; games: number; }
        const agg: Record<string, PlayerAgg> = {};
        const rows = filteredPlayerRows;
        rows.forEach((p: any) => {
            if (!p.Player) return;
            if (!agg[p.Player]) agg[p.Player] = { name: p.Player, kills: 0, damage: 0, assists: 0, deaths: 0, games: 0 };
            agg[p.Player].kills += Number(p.Kill) || 0;
            agg[p.Player].damage += Number(p['Dano causado']) || 0;
            agg[p.Player].assists += Number(p.Assistencia) || 0;
            agg[p.Player].deaths += Number(p.Morte) || 0;
            agg[p.Player].games += 1;
        });
        return Object.values(agg)
            .map((p: PlayerAgg) => ({
                name: p.name,
                avgKills: p.games > 0 ? parseFloat((p.kills / p.games).toFixed(2)) : 0,
                avgDamage: p.games > 0 ? Math.round(p.damage / p.games) : 0,
                avgAssists: p.games > 0 ? parseFloat((p.assists / p.games).toFixed(2)) : 0,
                totalKills: p.kills,
                totalDamage: p.damage,
                kd: parseFloat((p.kills / (p.deaths || 1)).toFixed(2)),
            }))
            .sort((a, b) => b.avgKills - a.avgKills)
            .slice(0, 10);
    }, [filteredPlayerRows]);
    const totalKillsFromPlayers = useMemo(() =>
        filteredPlayerRows.reduce((sum, p) => sum + (Number(p.Kill) || 0), 0),
        [filteredPlayerRows]);

    // Total de Kills somado de todos os jogadores (performance_jogadores)

    const trendChartData = useMemo(() => {
        if (filteredPlayerRows.length === 0) return [];
        const byDate: Record<string, number> = {};
        filteredPlayerRows.forEach(p => {
            const d = String(p.Data || '');
            if (d) byDate[d] = (byDate[d] || 0) + (Number(p.Kill) || 0);
        });
        return Object.entries(byDate)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([data, kills]) => ({ Data: data, Kill: kills }));
    }, [filteredPlayerRows]);

    return (
        <div className="min-h-screen flex flex-col" style={{ ...S.bgMain, fontFamily: "'Inter', sans-serif", color: '#FFFFFF' }}>
            <DashboardStyles />

            {/* CTA Header */}
            <div className="py-2.5 px-6 bg-[#A855F7] text-white flex items-center justify-between shadow-lg z-50">
                <div className="flex items-center gap-3">
                    <TrendingUp size={16} className="animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Celo Tracker - Visualização de Squad</span>
                </div>
                <button
                    onClick={() => navigate('/register')}
                    className="flex items-center gap-2 bg-white text-[#A855F7] px-4 py-1.5 rounded-full font-black text-[9px] uppercase tracking-widest hover:bg-zinc-100 transition-all shadow-md active:scale-95"
                >
                    <UserPlus size={12} /> Criar meu próprio Dashboard
                </button>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* ── Content ── */}
                <div className="flex-1 flex flex-col h-full bg-[#0B0B0C]">
                    {/* Header / Top Bar */}
                    <header
                        className="h-20 flex items-center justify-between px-8 z-40 backdrop-blur-md sticky top-0"
                        style={{ backgroundColor: '#0B0B0CEE', borderBottom: '1px solid #2D2D30' }}
                    >
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-4">
                                <img src="/image_10.png" alt="Logo" className="h-10 w-auto" />
                                <div className="h-8 w-[1px] bg-[#2D2D30]" />
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-[#A855F7] uppercase tracking-widest">Analytics Público</span>
                                    <span className="text-xs font-black text-white uppercase tracking-tighter">Coach: {nomeCoach || 'Elite'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="hidden lg:flex items-center gap-2">
                            <div
                                className="flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest"
                                style={{ backgroundColor: '#161618', border: '1px solid #2D2D30', color: '#A1A1AA' }}
                            >
                                <Calendar size={13} style={{ color: '#A855F7' }} />
                                <select
                                    value={filters.date}
                                    onChange={e => setFilters(prev => ({ ...prev, date: e.target.value }))}
                                    className="outline-none cursor-pointer bg-transparent"
                                >
                                    <option value="Todos">Todas as Datas</option>
                                    {filterOptions.dates.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                            <div
                                className="flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest"
                                style={{ backgroundColor: '#161618', border: '1px solid #2D2D30', color: '#A1A1AA' }}
                            >
                                <Trophy size={13} style={{ color: '#A855F7' }} />
                                <select
                                    value={filters.championship}
                                    onChange={e => setFilters(prev => ({ ...prev, championship: e.target.value }))}
                                    className="outline-none cursor-pointer bg-transparent"
                                >
                                    <option value="Todos">Todos Campeonatos</option>
                                    {filterOptions.championships.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>
                    </header>

                    {/* Scrollable Content */}
                    <main className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                        {isDashboardLoading ? (
                            <div className="h-full w-full flex flex-col items-center justify-center space-y-6">
                                <div className="w-12 h-12 rounded-lg border-2 border-[#A855F7]/20 border-t-[#A855F7] animate-spin" />
                                <p className="text-[10px] font-bold tracking-[0.3em] text-[#71717A] uppercase">Carregando Dados do Squad</p>
                            </div>
                        ) : fetchError ? (
                            <div className="h-full flex flex-col items-center justify-center p-12 text-center bg-[#161618] rounded-xl border border-[#2D2D30]">
                                <AlertCircle size={40} className="text-[#EF4444] mb-4" />
                                <h3 className="text-xl font-bold text-white mb-2">Erro de Sincronia</h3>
                                <p className="max-w-xs text-sm text-[#71717A]">{fetchError}</p>
                            </div>
                        ) : data ? (
                            <div className="animate-fade-in space-y-8">
                                {/* Navigation Tabs (Read-only version) */}
                                <div className="flex items-center gap-1 p-1 bg-[#161618] border border-[#2D2D30] rounded-xl w-fit">
                                    {[
                                        { id: 'overview', label: 'Estatísticas', icon: LayoutDashboard },
                                        { id: 'players', label: 'Jogadores', icon: Users },
                                    ].map(tab => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-[#A855F7] text-white' : 'text-[#71717A] hover:text-white'}`}
                                        >
                                            <tab.icon size={14} /> {tab.label}
                                        </button>
                                    ))}
                                </div>

                                {activeTab === 'overview' ? (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                                            <MetricCard title="Total Kills" value={totalKillsFromPlayers} icon={Sword} accentColor="#A855F7" />
                                            <MetricCard title="Pontos" value={data.general.totalPontos} icon={Target} accentColor="#A855F7" />
                                            <MetricCard title="Booyahs" value={data.general.totalBooyahs} icon={Trophy} accentColor="#A855F7" />
                                            <MetricCard title="Draft Success" value={`${data.general.percentSucessoCall}%`} icon={Zap} accentColor="#BEF264" />
                                        </div>

                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                                            <Card className="lg:col-span-2">
                                                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-8 text-[#A1A1AA]">Tendência de Abates</h4>
                                                <div className="h-[300px]">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <AreaChart data={trendChartData}>
                                                            <defs>
                                                                <linearGradient id="colorKill" x1="0" y1="0" x2="0" y2="1">
                                                                    <stop offset="5%" stopColor="#A855F7" stopOpacity={0.3} />
                                                                    <stop offset="95%" stopColor="#A855F7" stopOpacity={0} />
                                                                </linearGradient>
                                                            </defs>
                                                            <XAxis dataKey="Data" axisLine={false} tickLine={false} tick={{ fill: '#71717A', fontSize: 10 }} />
                                                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#71717A', fontSize: 10 }} />
                                                            <Tooltip contentStyle={{ backgroundColor: '#161618', border: '1px solid #2D2D30', borderRadius: '8px' }} />
                                                            <Area type="monotone" dataKey="Kill" stroke="#A855F7" strokeWidth={3} fillOpacity={1} fill="url(#colorKill)" />
                                                        </AreaChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </Card>

                                            <Card>
                                                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-8 text-[#A1A1AA]">Eficiência por Mapa</h4>
                                                <div className="h-[300px]">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <PieChart>
                                                            <Pie data={data.byMap.map(m => ({ name: m.mapa, value: m.totalPontos }))} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                                                {data.byMap.map((_, index) => (
                                                                    <Cell key={`cell-${index}`} fill={['#A855F7', '#BEF264', '#EF4444', '#F59E0B', '#10B981'][index % 5]} />
                                                                ))}
                                                            </Pie>
                                                            <Tooltip />
                                                            <Legend wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold' }} />
                                                        </PieChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </Card>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <Card className="overflow-hidden !p-0">
                                            <table className="w-full text-xs text-left" style={{ color: '#A1A1AA' }}>
                                                <thead>
                                                    <tr style={{ borderBottom: '1px solid #2D2D30' }}>
                                                        {['Jogador', 'Kills', 'Dano', 'Score'].map((h, i) => (
                                                            <th key={i} className={`px-6 py-4 font-bold uppercase tracking-widest text-[9px] ${i > 0 ? 'text-right' : ''}`} style={{ color: '#71717A' }}>{h}</th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {playerChartData.map((p, idx) => (
                                                        <tr key={idx} className="hover:bg-white/[0.02] transition-colors" style={{ borderBottom: '1px solid #2D2D30' }}>
                                                            <td className="px-6 py-4 font-bold text-white uppercase tracking-tighter">{p.name}</td>
                                                            <td className="px-6 py-4 text-right font-mono text-[#A855F7]">{p.totalKills}</td>
                                                            <td className="px-6 py-4 text-right font-mono">{p.totalDamage.toLocaleString()}</td>
                                                            <td className="px-6 py-4 text-right">
                                                                <span className="px-2 py-1 rounded bg-[#BEF26410] text-[#BEF264] text-[10px] font-black">{p.kd} KD</span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </Card>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <FileSpreadsheet size={40} className="text-[#2D2D30] mb-4" />
                                <h3 className="text-xl font-bold text-white mb-2">Sem Dados Disponíveis</h3>
                                <p className="text-sm text-[#71717A]">Este squad ainda não registrou partidas públicas.</p>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
};
