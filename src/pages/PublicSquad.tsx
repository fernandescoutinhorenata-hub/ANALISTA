
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    XAxis, YAxis, Tooltip, ResponsiveContainer,
    AreaChart, Area, BarChart, Bar, Cell, CartesianGrid
} from 'recharts';
import {
    Trophy, Target, Zap, 
    TrendingUp, Users, Sword,
    LayoutDashboard,
    AlertCircle, Map, Activity
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { supabase } from '../lib/supabase';
import type { DashboardData } from '../types';
import { processData } from '../utils/data-processing';
import logo from '../assets/logo.png';

// ─── Design Tokens ────────────────────────────────────────────────────────
const S = {
    bgMain: '#0B0B0C',
    bgCard: '#161618',
    accent: '#A855F7',
    border: '#2D2D30',
};

const Card: React.FC<{ children: React.ReactNode; className?: string; id?: string }> = ({ children, className = '', id }) => (
    <div id={id} className={`bg-[#161618] border border-[#2D2D30] rounded-2xl p-6 relative overflow-hidden shadow-xl ${className}`}>
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

const neonTooltipStyle = {
    backgroundColor: '#161618',
    border: '1px solid #2D2D30',
    borderRadius: '12px',
    color: '#E4E4E7',
    fontFamily: 'Inter, sans-serif',
    fontSize: '12px',
    padding: '12px 16px',
};

export const PublicSquad: React.FC = () => {
    const { token } = useParams();
    const navigate = useNavigate();

    const [coachProfile, setCoachProfile] = useState<any>(null);
    const [data, setData] = useState<DashboardData | null>(null);
    const [allGeneralRows, setAllGeneralRows] = useState<any[]>([]);
    const [allPlayerRows, setAllPlayerRows] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'players' | 'coletivo'>('overview');
    const [filters, setFilters] = useState({ date: 'Todos', championship: 'Todos', timeFilter: 'all' as '7d' | '30d' | 'all' });

    const searchParams = new URLSearchParams(window.location.search);
    const campsParam = searchParams.get('camps');
    const allowedCamps = useMemo(() => campsParam ? campsParam.split(',').map(c => decodeURIComponent(c)) : null, [campsParam]);

    const exportRef = useRef<HTMLDivElement>(null);

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
            } catch (err) {
                setError('Ocorreu um erro ao validar o token.');
            }
        };

        fetchData();
    }, [token]);

    // ─── BUSCA DE OPÇÕES DE FILTROS (1 ÚNICA VEZ) ───────────────────────
    const [availableOptions, setAvailableOptions] = useState({ dates: [] as string[], championships: [] as string[] });

    useEffect(() => {
        if (!coachProfile?.id) return;
        
        supabase
            .from('partidas_geral')
            .select('data, campeonato')
            .eq('user_id', coachProfile.id)
            .then(({ data }) => {
                if (data) {
                    const dates = new Set(data.map((r: any) => r.data).filter(Boolean));
                    const champs = new Set(data.map((r: any) => r.campeonato?.trim()).filter(Boolean));
                    setAvailableOptions({
                        dates: Array.from(dates).sort() as string[],
                        championships: Array.from(champs).sort() as string[]
                    });
                }
            });
    }, [coachProfile?.id]);

    // ─── BUSCA DE DADOS COM FILTROS NA QUERY ─────────────────────────────────────
    useEffect(() => {
        if (!coachProfile?.id) return;

        const fetchData = async () => {
            setIsLoading(true);
            try {
                let genQuery = supabase.from('partidas_geral').select('*').eq('user_id', coachProfile.id).order('data', { ascending: false });
                let playQuery = supabase.from('performance_jogadores').select('*').eq('user_id', coachProfile.id);

                if (allowedCamps && allowedCamps.length > 0) {
                    genQuery = genQuery.in('campeonato', allowedCamps);
                    playQuery = playQuery.in('campeonato', allowedCamps);
                }

                // Aplica filtros direto na query para reexecutar com os novos parâmetros
                if (filters.championship !== 'Todos') {
                    const champVal = filters.championship.trim();
                    genQuery = genQuery.ilike('campeonato', champVal);
                    playQuery = playQuery.ilike('campeonato', champVal);
                }
                
                if (filters.date !== 'Todos') {
                    genQuery = genQuery.eq('data', filters.date);
                    playQuery = playQuery.eq('data', filters.date);
                } else if (filters.timeFilter !== 'all') {
                    const days = filters.timeFilter === '7d' ? 7 : 30;
                    const cutoff = new Date();
                    cutoff.setDate(cutoff.getDate() - days);
                    genQuery = genQuery.gte('created_at', cutoff.toISOString());
                    playQuery = playQuery.gte('created_at', cutoff.toISOString());
                }

                const [generalRes, playersRes] = await Promise.all([genQuery, playQuery]);

                if (generalRes.error) throw new Error('Erro ao carregar partidas.');

                const mappedGen = (generalRes.data || []).map((r: any) => ({
                    Data: r.data,
                    Campeonato: r.campeonato,
                    Rodada: r.rodada,
                    Mapa: r.mapa,
                    Equipe: r.equipe,
                    Colocacao: r.colocacao,
                    Kill: r.kill,
                    "Pontos/Posicao": r.pontos_posicao,
                    Pontos_Total: r.pontos_total,
                    Booyah: (r.booyah || r.colocacao === 1) ? 'SIM' : 'NAO',
                }));

                const mappedPlay = (playersRes.data || []).map((r: any) => ({
                    Data: r.data,
                    Campeonato: r.campeonato,
                    Rodada: r.rodada,
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
    }, [coachProfile?.id, filters, allowedCamps]);

    // ─── PROCESSAMENTO EM MEMÓRIA ──────────────────────────────────────────
    // Observação: Como agora as queries puxam direto do banco com base nos filtros, 
    // allGeneralRows e allPlayerRows já são as listas perfeitamente recortadas!

    useEffect(() => {
        if (allGeneralRows.length > 0) {
            setData(processData(allGeneralRows, allPlayerRows));
        } else {
            setData(null);
        }
    }, [allGeneralRows, allPlayerRows]);

    const playerTableData = useMemo(() => {
        if (allPlayerRows.length === 0) return [];
        const agg: Record<string, any> = {};
        const playerMatches: Record<string, Set<string>> = {};

        allPlayerRows.forEach((p: any) => {
            if (!p.Player) return;
            const playerName = p.Player;
            if (!agg[playerName]) agg[playerName] = { name: playerName, kills: 0, deaths: 0, assists: 0, damage: 0, knocks: 0 };
            if (!playerMatches[playerName]) playerMatches[playerName] = new Set();
            
            agg[playerName].kills += p.Kill || 0;
            agg[playerName].deaths += p.Morte || 0;
            agg[playerName].assists += p.Assistencia || 0;
            agg[playerName].damage += p["Dano causado"] || 0;
            agg[playerName].knocks += p.Derrubados || 0;
            
            // Chave única para identificar a partida do jogador
            playerMatches[playerName].add(`${p.Data}|${p.Mapa}|${p.Campeonato}|${p.Rodada}`);
        });

        return Object.values(agg).map((a: any) => ({
            ...a,
             kd: parseFloat((a.kills / Math.max(1, a.deaths)).toFixed(2)),
             quedas: playerMatches[a.name]?.size || 0
        })).sort((a: any, b: any) => b.kills - a.kills);
    }, [allPlayerRows]);

    const collectiveData = useMemo(() => {
        const playersMap: Record<string, any> = {};
        allPlayerRows.forEach(row => {
            const p = row.Player;
            if (!p) return;
            if (!playersMap[p]) playersMap[p] = { name: p, kills: 0, assists: 0, dano: 0, mortes: 0, derrubados: 0, revividos: 0 };
            playersMap[p].kills += row.Kill || 0;
            playersMap[p].assists += row.Assistencia || 0;
            playersMap[p].dano += row["Dano causado"] || 0;
            playersMap[p].mortes += row.Morte || 0;
            playersMap[p].derrubados += row.Derrubados || 0;
            playersMap[p].revividos += row.Ressurgimento || 0;
        });
        const list = Object.values(playersMap);
        return {
            kills: [...list].sort((a, b) => b.kills - a.kills),
            assists: [...list].sort((a, b) => b.assists - a.assists),
            dano: [...list].sort((a, b) => b.dano - a.dano),
            mortes: [...list].sort((a, b) => b.mortes - a.mortes),
            derrubados: [...list].sort((a, b) => b.derrubados - a.derrubados),
            revividos: [...list].sort((a, b) => b.revividos - a.revividos),
        };
    }, [allPlayerRows]);

    const handleExportPDF = async () => {
        const coachName = coachProfile?.nome || 'Analista';
        const pdf = new jsPDF('p', 'mm', 'a4');
        const element = document.getElementById('public-squad-content');
        if (!element) return;
        
        const canvas = await html2canvas(element, { 
            scale: 1,
            useCORS: true,
            backgroundColor: '#0a0a0f'
        });
        
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 210;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
        pdf.save(`CeloTracker_${coachName}_${new Date().toLocaleDateString('pt-BR')}.pdf`);
    };

    const HorizontalBarChart = ({ data, dataKey, title, color }: any) => (
        <Card className="h-full flex flex-col">
            <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-6">{title}</h4>
            <div className="flex-1 min-h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#2D2D30" />
                        <XAxis type="number" hide />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#71717A', fontWeight: 600 }} axisLine={false} tickLine={false} />
                        <Tooltip cursor={{ fill: 'rgba(255,255,255,0.03)' }} contentStyle={neonTooltipStyle} />
                        <Bar dataKey={dataKey} fill={color} radius={[0, 4, 4, 0]} barSize={18} label={{ position: 'right', fill: '#fff', fontSize: 10, fontWeight: 'bold' }}>
                            {data.map((_: any, index: number) => (
                                <Cell key={`cell-${index}`} fillOpacity={1 - (index * 0.1)} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );

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
            <div id="public-squad-content">
                {/* ─── HEADER ─── */}
                <header id="public-header" className="h-20 bg-[#0B0B0C]/80 backdrop-blur-xl border-b border-[#2D2D30] sticky top-0 z-50 px-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <img src={logo} alt="CTracker" style={{ height: '180px', width: 'auto' }} />
                        <div className="h-8 w-px bg-[#2D2D30]" />
                        <div>
                            <span className="block text-[9px] font-black text-[#A855F7] uppercase tracking-[0.2em] mb-0.5">Analytics Público</span>
                            <span className="block text-xs font-black uppercase">Coach: {coachProfile?.nome || 'Analista'}</span>
                            {allowedCamps && (
                                <span className="block text-[10px] font-bold text-zinc-500 mt-1 uppercase">
                                    Exibindo: <span className="text-zinc-300">{allowedCamps.join(', ')}</span>
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="hidden lg:flex items-center gap-2 bg-[#161618] border border-[#2D2D30] p-1.5 rounded-xl">
                            <select className="bg-transparent text-[10px] font-bold uppercase tracking-widest text-[#A1A1AA] outline-none px-3 border-r border-[#2D2D30]" 
                                    value={filters.date} onChange={e => setFilters(prev => ({...prev, date: e.target.value}))}>
                                <option value="Todos">Todas as Datas</option>
                                {availableOptions.dates.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                            <select className="bg-transparent text-[10px] font-bold uppercase tracking-widest text-[#A1A1AA] outline-none px-3"
                                    value={filters.championship} onChange={e => setFilters(prev => ({...prev, championship: e.target.value}))}>
                                <option value="Todos">Todos Eventos</option>
                                {availableOptions.championships.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <button onClick={() => navigate('/register')} className="bg-white text-black px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-zinc-200 transition-colors shadow-lg shadow-white/5">
                            Começar
                        </button>
                    </div>
                </header>

                <main className="w-full p-6 lg:p-10 space-y-8">
                    {/* ─── TABS ─── */}
                    <div className="flex gap-2 p-1 bg-[#161618] border border-[#2D2D30] rounded-2xl w-fit">
                        {[
                            { id: 'overview', label: 'Estatísticas', icon: LayoutDashboard },
                            { id: 'players', label: 'Jogadores', icon: Users },
                            { id: 'coletivo', label: 'Coletivo', icon: Activity },
                        ].map(tab => (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-[#A855F7] text-white shadow-lg shadow-[#A855F7]/20' : 'text-zinc-500 hover:text-white'}`}>
                                <tab.icon size={14} /> {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* ─── FILTERS ROW ─── */}
                    <div className="flex flex-wrap items-center gap-6 bg-[#161618] border border-[#2D2D30] p-6 rounded-2xl">
                        <div className="space-y-2">
                            <span className="block text-[9px] font-black text-zinc-500 uppercase tracking-widest">Período</span>
                            <div className="flex bg-[#0B0B0C] p-1 rounded-xl border border-[#2D2D30]">
                                {(['7d', '30d', 'all'] as const).map((t) => (
                                    <button key={t} onClick={() => setFilters(prev => ({ ...prev, timeFilter: t, date: 'Todos' }))}
                                        className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${filters.timeFilter === t && filters.date === 'Todos' ? 'bg-[#7C3AED] text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
                                        {t === '7d' ? '7 Dias' : t === '30d' ? '30 Dias' : 'Tudo'}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="h-10 w-px bg-[#2D2D30] hidden md:block" />
                        <div className="space-y-2">
                            <span className="block text-[9px] font-black text-zinc-500 uppercase tracking-widest">Data Específica</span>
                            <select className="bg-[#0B0B0C] border border-[#2D2D30] text-[10px] font-bold uppercase tracking-widest text-[#A1A1AA] outline-none px-4 py-2.5 rounded-xl min-w-[180px]"
                                value={filters.date} onChange={e => setFilters(prev => ({ ...prev, date: e.target.value, timeFilter: 'all' }))}>
                                <option value="Todos">Todas as Datas</option>
                                {availableOptions.dates.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                        <div className="h-10 w-px bg-[#2D2D30] hidden md:block" />
                        <div className="space-y-2">
                            <span className="block text-[9px] font-black text-zinc-500 uppercase tracking-widest">Equipe / Campeonato</span>
                            <select className="bg-[#0B0B0C] border border-[#2D2D30] text-[10px] font-bold uppercase tracking-widest text-[#A1A1AA] outline-none px-4 py-2.5 rounded-xl min-w-[200px]"
                                value={filters.championship} onChange={e => setFilters(prev => ({ ...prev, championship: e.target.value }))}>
                                <option value="Todos">Todos os Campeonatos</option>
                                {availableOptions.championships.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* ─── SEÇÕES ─── */}
                    <div ref={exportRef}>
                        {activeTab === 'overview' && data && (
                            <div id="overview-section" className="space-y-8 animate-fade-in">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                                    <MetricCard title="Total Kills" value={data.playerMetrics.totalKills || 0} icon={Sword} glow />
                                    <MetricCard title="Pontuação Total" value={data.general.totalPontos || 0} icon={Trophy} />
                                    <MetricCard title="Booyahs" value={data.general.totalBooyahs || 0} icon={TrendingUp} color="#9D5FF5" />
                                    <MetricCard title="Dano Médio / Queda" value={(data.squadMetrics.avgDamage || 0).toLocaleString()} icon={Target} color="#B47FFB" />
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    <Card className="lg:col-span-2 min-h-[400px]">
                                        <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-10">Evolução Diária (Kills)</h4>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <AreaChart data={[...allGeneralRows].reverse().map(r => ({ data: r.Data, kill: r.Kill }))}>
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
                            <div id="players-section" className="animate-fade-in">
                                <Card className="!p-0 overflow-hidden">
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
                                                <tr key={idx} className="border-b border-[#2D2D30]/50 hover:bg-[#A855F7]/5 transition-colors">
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
                            </div>
                        )}

                        {activeTab === 'coletivo' && (
                            <div id="coletivo-section" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-reveal">
                                <HorizontalBarChart title="Kills" data={collectiveData.kills} dataKey="kills" color="#A855F7" />
                                <HorizontalBarChart title="Assists" data={collectiveData.assists} dataKey="assists" color="#A855F7" />
                                <HorizontalBarChart title="Dano Causado" data={collectiveData.dano} dataKey="dano" color="#A855F7" />
                                <HorizontalBarChart title="Mortes" data={collectiveData.mortes} dataKey="mortes" color="#A855F7" />
                                <HorizontalBarChart title="Derrubados" data={collectiveData.derrubados} dataKey="derrubados" color="#A855F7" />
                                <HorizontalBarChart title="Revividos" data={collectiveData.revividos} dataKey="revividos" color="#A855F7" />
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* ─── BOTÃO FLUTUANTE PDF ─── */}
            <button
                onClick={handleExportPDF}
                style={{
                    position: 'fixed',
                    bottom: '24px',
                    right: '24px',
                    zIndex: 9999,
                    background: '#7C3AED',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px 20px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    boxShadow: '0 4px 12px rgba(124,58,237,0.4)'
                }}
            >
                📥 Salvar PDF
            </button>
        </div>
    );
};

