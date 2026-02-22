import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import {
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, AreaChart, Area, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis
} from 'recharts';
import {
    Trophy, Target, Map, Zap, FileSpreadsheet, RefreshCcw,
    TrendingUp, LogOut, Users, Sword, ShieldAlert,
    Calendar, LayoutDashboard, Menu, ChevronRight, UserCircle2, PlusCircle,
    CheckCircle, XCircle, AlertCircle, Wallet
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { DashboardData } from '../types';
import { processData } from '../utils/data-processing';
import { useAuth } from '../contexts/AuthContext';

// ─── Cosmic Neon Refined – Design Tokens ───────────────────────────────────
// BG_MAIN:   #0A0E17  | BG_CARD:   #161B28  | BORDER:    #2A3042
// TEXT_PRI:  #FFFFFF  | TEXT_SEC:  #B0B8C3  | TEXT_TER:  #7A8291
// PURPLE:    #8A2BE2  | GREEN:     #00FF7F  | GOLD:      #FFD700
// RED:       #FF0055  | CYAN:      #00BFFF
// ────────────────────────────────────────────────────────────────────────────

// Inline style helpers (used where Tailwind arbitrary values would be verbose)
const S = {
    bgMain: { backgroundColor: '#0A0E17' },
    bgCard: { backgroundColor: '#161B28' },
    border: { border: '1px solid #2A3042' },
    cardBox: { backgroundColor: '#161B28', border: '1px solid #2A3042', borderRadius: '16px', padding: '24px' },
};

// ─── Shared Card ─────────────────────────────────────────────────────────────
const Card: React.FC<{ children: React.ReactNode; className?: string; style?: React.CSSProperties }> = ({ children, className = '', style }) => (
    <div
        className={`rounded-2xl p-6 ${className}`}
        style={{ backgroundColor: '#161B28', border: '1px solid #2A3042', ...style }}
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
        className="rounded-2xl p-6 flex flex-col gap-3 transition-all duration-300 hover:scale-[1.02]"
        style={{ backgroundColor: '#161B28', border: '1px solid #2A3042' }}
    >
        <div className="flex justify-between items-start">
            <div
                className="p-2.5 rounded-xl"
                style={{ backgroundColor: `${accentColor}18`, color: accentColor }}
            >
                <Icon size={20} />
            </div>
            {subValue && (
                <span
                    className="text-xs font-semibold px-2 py-1 rounded-full"
                    style={{ color: '#B0B8C3', backgroundColor: '#2A3042' }}
                >
                    {subValue}
                </span>
            )}
        </div>
        <div>
            <h3
                className="text-4xl font-black tracking-tight"
                style={{ color: '#FFFFFF', fontFamily: 'Inter, sans-serif' }}
            >
                {value}
            </h3>
            <p
                className="text-sm font-semibold mt-1"
                style={{ color: '#B0B8C3', fontFamily: 'Inter, sans-serif' }}
            >
                {title}
            </p>
        </div>
    </div>
);

// ─── Tooltip customizado ──────────────────────────────────────────────────────
const neonTooltipStyle = {
    backgroundColor: '#161B28',
    border: '1px solid #2A3042',
    borderRadius: '10px',
    color: '#FFFFFF',
    fontFamily: 'Inter, sans-serif',
    fontSize: '13px',
};

// ─── Toast Component ─────────────────────────────────────────────────────────
const Toast: React.FC<{ message: string; type: 'success' | 'error' | 'warning' }> = ({ message, type }) => {
    const config = {
        success: { bg: '#00FF7F15', border: '#00FF7F50', color: '#00FF7F', icon: CheckCircle },
        error: { bg: '#FF005515', border: '#FF005550', color: '#FF0055', icon: XCircle },
        warning: { bg: '#FFD70015', border: '#FFD70050', color: '#FFD700', icon: AlertCircle },
    }[type];
    const Icon = config.icon;
    return (
        <div style={{
            position: 'fixed', top: '24px', right: '24px', zIndex: 9999,
            backgroundColor: config.bg, border: `1px solid ${config.border}`,
            borderRadius: '12px', padding: '14px 20px',
            display: 'flex', alignItems: 'center', gap: '10px',
            fontFamily: 'Inter, sans-serif', backdropFilter: 'blur(10px)',
        }}>
            <Icon size={20} color={config.color} />
            <span style={{ color: config.color, fontWeight: 600, fontSize: '14px' }}>{message}</span>
        </div>
    );
};

// ─── Import Modal Component ──────────────────────────────────────────────────
const ImportModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onDownloadTemplate: () => void;
    loading: boolean;
    creditos: number | null;
}> = ({ isOpen, onClose, onUpload, onDownloadTemplate, loading, creditos }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#000000CC] backdrop-blur-sm">
            <div
                className="w-full max-w-md rounded-3xl p-8 relative animate-in fade-in zoom-in duration-200"
                style={{ backgroundColor: '#161B28', border: '1px solid #2A3042', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}
            >
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 rounded-xl transition-colors hover:bg-[#2A3042]"
                    style={{ color: '#7A8291' }}
                >
                    <XCircle size={20} />
                </button>

                <div className="text-center mb-8">
                    <div className="inline-flex p-4 rounded-2xl mb-4" style={{ backgroundColor: '#8A2BE218', color: '#8A2BE2' }}>
                        <FileSpreadsheet size={32} />
                    </div>
                    <h3 className="text-2xl font-black text-white">Importar Planilha</h3>
                    <p className="text-sm mt-2" style={{ color: '#B0B8C3' }}>Suba o arquivo .xlsx com os dados da partida.</p>
                </div>

                <div className="space-y-6">
                    <div className="p-4 rounded-xl flex items-center justify-between" style={{ backgroundColor: '#0D1117', border: '1px solid #2A3042' }}>
                        <div className="flex items-center gap-2">
                            <Wallet size={16} style={{ color: '#FFD700' }} />
                            <span className="text-xs font-semibold uppercase tracking-wider text-[#7A8291]">Custo por upload</span>
                        </div>
                        <span className="text-sm font-black text-[#FF0055]">1 CRÉDITO</span>
                    </div>

                    <label
                        className={`group flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        style={{ borderColor: '#2A3042', backgroundColor: '#0D1117' }}
                        onMouseEnter={e => !loading && (e.currentTarget.style.borderColor = '#8A2BE2')}
                        onMouseLeave={e => !loading && (e.currentTarget.style.borderColor = '#2A3042')}
                    >
                        <FileSpreadsheet className="w-10 h-10 mb-3" style={{ color: '#7A8291' }} />
                        <p className="text-xs text-[#B0B8C3]">
                            <span className="font-bold text-[#8A2BE2]">Selecionar arquivo</span> ou arraste
                        </p>
                        <input type="file" className="hidden" accept=".xlsx" onChange={onUpload} disabled={loading} />
                    </label>

                    <div className="flex gap-3">
                        <button
                            onClick={onDownloadTemplate}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all font-bold text-xs"
                            style={{ backgroundColor: '#161B28', border: '1px solid #2A3042', color: '#B0B8C3' }}
                        >
                            <FileSpreadsheet size={16} /> Modelo v2.0
                        </button>
                    </div>

                    {loading && (
                        <div className="flex flex-col items-center gap-2 animate-pulse text-[#8A2BE2]">
                            <RefreshCcw size={20} className="animate-spin" />
                            <span className="text-xs font-bold">Processando dados...</span>
                        </div>
                    )}

                    <p className="text-[10px] text-center uppercase tracking-widest font-bold" style={{ color: '#7A8291' }}>
                        Saldo Atual: <span style={{ color: (creditos ?? 0) > 0 ? '#00FF7F' : '#FF0055' }}>{creditos ?? '...'} CRÉDITOS</span>
                    </p>
                </div>
            </div>
        </div>
    );
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export const Dashboard: React.FC = () => {
    const [allGeneralRows, setAllGeneralRows] = useState<any[]>([]);
    const [allPlayerRows, setAllPlayerRows] = useState<any[]>([]);
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(false);
    const [isDashboardLoading, setIsDashboardLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [selectedPlayer, setSelectedPlayer] = useState<string>('Todos');
    const [filters, setFilters] = useState({ date: 'Todos', championship: 'Todos' });
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [creditos, setCreditos] = useState<number | null>(null);
    const [nomeUsuario, setNomeUsuario] = useState<string>('');
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);

    const { signOut, user } = useAuth();
    const navigate = useNavigate();

    // ─── showToast declarado aqui para evitar uso antes da declaração ───────────
    const showToast = (message: string, type: 'success' | 'error' | 'warning') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

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
        if (!user) return;

        const fetchPerfil = async () => {
            const { data } = await supabase
                .from('perfis')
                .select('usos_restantes, nome, email')
                .eq('id', user.id)
                .single();
            if (data) {
                setCreditos(data.usos_restantes);
                setNomeUsuario(data.nome || data.email || user.email || '');
            }
        };

        const fetchDashboardData = async () => {
            if (!user) return;
            setIsDashboardLoading(true);
            setFetchError(null);
            try {
                const [generalRes, playersRes] = await Promise.all([
                    supabase.from('partidas_geral').select('*').eq('user_id', user.id).order('rodada', { ascending: true }),
                    supabase.from('performance_jogadores').select('*').eq('user_id', user.id)
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
                    "Quebra de Call": row.quebra_de_call ? 'SIM' : 'NAO',
                    "Resultado quebra": row.resultado_quebra
                }));
                setAllGeneralRows(mappedGeneral);

                // Mapeia exatamente as colunas reais de performance_jogadores
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
                console.error('Erro ao buscar dados do Supabase:', error);
                setFetchError('Não foi possível carregar os dados. Verifique sua conexão.');
                showToast('Erro de conexão com o banco.', 'error');
            } finally {
                setIsDashboardLoading(false);
            }
        };

        fetchPerfil();
        fetchDashboardData();

        const channelPerfil = supabase.channel('perfil-changes-dash')
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'perfis', filter: `id=eq.${user.id}` },
                payload => setCreditos((payload.new as any).usos_restantes))
            .subscribe();

        const channelData = supabase.channel('dashboard-data-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'partidas_geral', filter: `user_id=eq.${user.id}` }, () => fetchDashboardData())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'performance_jogadores', filter: `user_id=eq.${user.id}` }, () => fetchDashboardData())
            .subscribe();

        return () => {
            supabase.removeChannel(channelPerfil);
            supabase.removeChannel(channelData);
        };
    }, [user]);


    const checkCreditos = async (): Promise<boolean> => {
        const { data: pData } = await supabase.from('perfis').select('usos_restantes').eq('id', user!.id).single();
        if (!pData || pData.usos_restantes === 0) {
            showToast('Saldo Insuficiente! Recarregue seus usos.', 'warning');
            return false;
        }
        return true;
    };

    const decrementarCredito = async () => {
        if (!user) return;
        const current = creditos ?? 1;
        await supabase.from('perfis').update({ usos_restantes: Math.max(0, current - 1) }).eq('id', user.id);
    };

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

    // ─── Métricas derivadas de performance_jogadores ───────────────────────────
    const filteredPlayerRows = useMemo(() =>
        allPlayerRows.filter(row =>
            filters.date === 'Todos' || String(row.Data) === filters.date
        ),
        [allPlayerRows, filters.date]);

    const playerList = useMemo(() => {
        return Array.from(new Set(filteredPlayerRows.map((p: any) => p.Player).filter(Boolean))).sort() as string[];
    }, [filteredPlayerRows]);

    const playerChartData = useMemo(() => {
        if (filteredPlayerRows.length === 0) return [];
        interface PlayerAgg { name: string; kills: number; damage: number; assists: number; deaths: number; games: number; }
        const agg: Record<string, PlayerAgg> = {};
        const rows = selectedPlayer === 'Todos'
            ? filteredPlayerRows
            : filteredPlayerRows.filter((p: any) => p.Player === selectedPlayer);
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
    }, [filteredPlayerRows, selectedPlayer]);

    const radarData = useMemo(() => {
        if (!data || selectedPlayer === 'Todos' || playerChartData.length === 0) return [];
        const p = playerChartData[0];
        if (!p) return [];
        return [
            { metric: 'Média de Abates', value: p.avgKills, fullMark: 10 },
            { metric: 'Média de Dano', value: Math.min(p.avgDamage / 300, 10), fullMark: 10 },
            { metric: 'Média de Assistências', value: Math.min(p.avgAssists, 10), fullMark: 10 },
            { metric: 'Relação K/D', value: Math.min(p.kd, 10), fullMark: 10 },
        ];
    }, [playerChartData, selectedPlayer]);

    // Total de Kills somado de todos os jogadores (performance_jogadores)
    const totalKillsFromPlayers = useMemo(() =>
        filteredPlayerRows.reduce((sum, p) => sum + (Number(p.Kill) || 0), 0),
        [filteredPlayerRows]);

    // MVP: jogador com maior total de kills
    const mvpFromPlayers = useMemo(() => {
        if (filteredPlayerRows.length === 0) return { player: 'N/A', kills: 0 };
        const agg: Record<string, number> = {};
        filteredPlayerRows.forEach(p => {
            if (!p.Player) return;
            agg[p.Player] = (agg[p.Player] || 0) + (Number(p.Kill) || 0);
        });
        const best = Object.entries(agg).sort((a, b) => b[1] - a[1])[0];
        return best ? { player: best[0], kills: best[1] } : { player: 'N/A', kills: 0 };
    }, [filteredPlayerRows]);

    // Top Dano: jogador com maior dano_causado total
    const topDanoFromPlayers = useMemo(() => {
        if (filteredPlayerRows.length === 0) return { player: 'N/A', damage: 0 };
        const agg: Record<string, number> = {};
        filteredPlayerRows.forEach(p => {
            if (!p.Player) return;
            agg[p.Player] = (agg[p.Player] || 0) + (Number(p['Dano causado']) || 0);
        });
        const best = Object.entries(agg).sort((a, b) => b[1] - a[1])[0];
        return best ? { player: best[0], damage: best[1] } : { player: 'N/A', damage: 0 };
    }, [filteredPlayerRows]);

    // Top Suporte: jogador com maior total de assistências
    const topAssistsFromPlayers = useMemo(() => {
        if (filteredPlayerRows.length === 0) return { player: 'N/A', assists: 0 };
        const agg: Record<string, number> = {};
        filteredPlayerRows.forEach(p => {
            if (!p.Player) return;
            agg[p.Player] = (agg[p.Player] || 0) + (Number(p.Assistencia) || 0);
        });
        const best = Object.entries(agg).sort((a, b) => b[1] - a[1])[0];
        return best ? { player: best[0], assists: best[1] } : { player: 'N/A', assists: 0 };
    }, [filteredPlayerRows]);

    // Gráfico de Tendência: kills totais de todos os jogadores agrupadas por data
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

    const handleTemplateDownload = () => {
        const wb = XLSX.utils.book_new();
        const wsGeneral = XLSX.utils.aoa_to_sheet([
            ['Data', 'Campeonato', 'Rodada', 'Mapa', 'Equipe', 'Colocacao', 'Kill', 'Pontos/Posicao', 'Pontos_Total', 'Booyah', 'Quebra de Call', 'Resultado quebra'],
            ['01/01/2024', 'LBFF', 1, 'Bermuda', 'LOUD', 1, 10, 12, 22, 'SIM', 'NAO', '-'],
        ]);
        XLSX.utils.book_append_sheet(wb, wsGeneral, 'Geral');
        const wsPlayers = XLSX.utils.aoa_to_sheet([
            ['Data', 'Equipe', 'Modo', 'Mapa', 'Posicao', 'Player', 'Kill', 'Morte', 'Assistencia', 'Queda', 'Dano causado', 'Derrubados', 'Ressurgimento'],
            ['01/01/2024', 'LOUD', 'Camp', 'Bermuda', 1, 'Cauan7', 5, 1, 2, 0, 1500, 3, 0],
        ]);
        XLSX.utils.book_append_sheet(wb, wsPlayers, 'Performance_Jogadores');
        XLSX.writeFile(wb, 'modelo_analise_ff_v2.xlsx');
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        if (!(await checkCreditos())) return;

        setLoading(true);
        const reader = new FileReader();
        reader.onload = async evt => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const ws1 = wb.Sheets[wb.SheetNames[0]];
                const rawJsonGlobal = XLSX.utils.sheet_to_json(ws1);
                let rawJsonPlayers: any[] = [];
                if (wb.SheetNames.length > 1) rawJsonPlayers = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[1]]);

                await decrementarCredito();
                setAllGeneralRows(rawJsonGlobal);
                setAllPlayerRows(rawJsonPlayers);
                setIsImportModalOpen(false);
                showToast('Planilha importada com sucesso! 🚀', 'success');
            } catch {
                showToast('Erro ao processar arquivo.', 'error');
            }
            finally { setLoading(false); }
        };
        reader.readAsBinaryString(file);
    };

    // Neon pie colors
    const COLORS = ['#8A2BE2', '#00BFFF', '#FF0055', '#00FF7F', '#FFD700', '#a855f7'];

    // ── Layout ───────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen flex" style={{ ...S.bgMain, fontFamily: 'Inter, sans-serif', color: '#FFFFFF' }}>

            {/* Toast Feedback */}
            {toast && <Toast message={toast.message} type={toast.type} />}

            {/* Modal de Importação */}
            <ImportModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onUpload={handleFileUpload}
                onDownloadTemplate={handleTemplateDownload}
                loading={loading}
                creditos={creditos}
            />

            {/* Overlay para Mobile quando a sidebar estiver aberta */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* ── Sidebar ── */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-60 flex flex-col transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0`}
                style={{ backgroundColor: '#0A0E17', borderRight: '1px solid #2A3042' }}
            >
                <div
                    className="flex justify-center cursor-pointer transition-transform hover:scale-105"
                    style={{ borderBottom: '1px solid #2A3042', margin: '16px 0', paddingBottom: '16px' }}
                    onClick={() => navigate('/')}
                >
                    <img
                        src="/image_10.png"
                        alt="Logo Celo Tracker"
                        className="w-auto object-contain h-20 md:h-[120px]"
                        style={{ imageRendering: 'high-quality' as any }}
                    />
                </div>

                {/* Nav */}
                <nav className="flex-1 p-4 space-y-1">
                    {[
                        { id: 'overview', label: 'Visão Geral', icon: LayoutDashboard },
                        { id: 'players', label: 'Jogadores', icon: Users },
                        { id: 'history', label: 'Histórico', icon: FileSpreadsheet },
                    ].map(item => {
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }}
                                className="w-full flex items-center gap-3 px-4 py-3 md:py-4 md:px-5 rounded-xl transition-all font-semibold text-sm"
                                style={{
                                    backgroundColor: isActive ? '#8A2BE2' : 'transparent',
                                    color: isActive ? '#FFFFFF' : '#7A8291',
                                }}
                                onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = '#FFFFFF'; }}
                                onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = '#7A8291'; }}
                            >
                                <item.icon size={18} />
                                {item.label}
                            </button>
                        );
                    })}

                    {/* Botão Inserir Dados */}
                    <div style={{ paddingTop: '12px', marginTop: '4px', borderTop: '1px solid #2A3042' }}>
                        <button
                            onClick={() => navigate('/input')}
                            className="w-full flex items-center justify-center gap-3 px-4 py-4 md:py-3 rounded-xl transition-all font-bold text-sm"
                            style={{ backgroundColor: '#00FF7F18', color: '#00FF7F', border: '1px solid #00FF7F30' }}
                            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#00FF7F30'; }}
                            onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#00FF7F18'; }}
                        >
                            <PlusCircle size={18} />
                            Novo Registro
                        </button>
                    </div>
                </nav>

                {/* Sidebar Footer */}
                <div className="p-4 space-y-1" style={{ borderTop: '1px solid #2A3042' }}>
                    <a
                        href="https://wa.me/YOURNUMBER" // Replace with actual number if needed
                        target="_blank"
                        rel="noreferrer"
                        className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all font-semibold text-sm"
                        style={{ color: '#00BFFF', backgroundColor: '#00BFFF10' }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#00BFFF25')}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#00BFFF10')}
                    >
                        <span className="flex items-center gap-3">
                            <LogOut size={18} style={{ transform: 'rotate(180deg)' }} /> Reportar Bug
                        </span>
                    </a>
                    <button
                        onClick={() => signOut()}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold text-sm"
                        style={{ color: '#FF0055' }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#FF005510')}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                        <LogOut size={18} /> Sair
                    </button>
                    <div className="pt-2 text-center">
                        <p className="text-[11px] font-bold" style={{ color: '#7A8291' }}>Feito por <span style={{ color: '#8A2BE2' }}>@CeloCoach</span></p>
                    </div>
                </div>
            </aside>

            {/* ── Content ── */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden">

                {/* 🚀 Beta Banner */}
                <div style={{ backgroundColor: '#8A2BE2', color: '#FFFFFF', padding: '8px', textAlign: 'center', fontSize: '12px', fontWeight: 600, letterSpacing: '0.5px' }}>
                    🚀 ESTAMOS EM BETA! Use 5 análises gratuitas e envie seu feedback para @CeloCoach no botão ao lado.
                </div>

                {/* Header / Top Bar */}
                <header
                    className="h-20 flex items-center justify-between px-8 z-40 backdrop-blur-md sticky top-0"
                    style={{ backgroundColor: '#0A0E17CC', borderBottom: '1px solid #2A3042' }}
                >
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:hidden p-2.5 rounded-xl transition-all" style={{ backgroundColor: '#161B28', border: '1px solid #2A3042', color: '#B0B8C3' }}>
                            <Menu size={20} />
                        </button>
                        <div className="hidden md:flex items-center text-sm" style={{ color: '#7A8291' }}>
                            <LayoutDashboard size={14} className="mr-2" />
                            <span>Dashboard</span>
                            <ChevronRight size={14} className="mx-2" />
                            <span className="font-bold uppercase tracking-wider text-[11px]" style={{ color: '#8A2BE2' }}>
                                {activeTab === 'overview' ? 'Visão Geral' : activeTab === 'players' ? 'Jogadores' : 'Histórico'}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 md:gap-5">
                        {/* Filtros */}
                        <div className="hidden xl:flex items-center gap-3">
                            <div
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider"
                                style={{ backgroundColor: '#161B28', border: '1px solid #2A3042', color: '#B0B8C3' }}
                            >
                                <Calendar size={13} style={{ color: '#8A2BE2' }} />
                                <select
                                    value={filters.date}
                                    onChange={e => setFilters(prev => ({ ...prev, date: e.target.value }))}
                                    className="outline-none cursor-pointer bg-transparent"
                                    style={{ color: '#B0B8C3' }}
                                >
                                    <option value="Todos">Todas as Datas</option>
                                    {filterOptions.dates.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                            <div
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider"
                                style={{ backgroundColor: '#161B28', border: '1px solid #2A3042', color: '#B0B8C3' }}
                            >
                                <Trophy size={13} style={{ color: '#8A2BE2' }} />
                                <select
                                    value={filters.championship}
                                    onChange={e => setFilters(prev => ({ ...prev, championship: e.target.value }))}
                                    className="outline-none cursor-pointer bg-transparent"
                                    style={{ color: '#B0B8C3' }}
                                >
                                    <option value="Todos">Todos Campeonatos</option>
                                    {filterOptions.championships.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Créditos Badge */}
                        <div className="hidden sm:flex items-center gap-2.5 px-4 py-2 rounded-xl" style={{ backgroundColor: '#161B28', border: '1px solid #2A3042' }}>
                            <Wallet size={16} style={{ color: '#FFD700' }} />
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black text-[#7A8291] uppercase tracking-widest leading-none">Saldo</span>
                                <span className="text-[13px] font-black mt-0.5" style={{ color: (creditos ?? 0) <= 10 ? '#FF0055' : '#00FF7F' }}>
                                    {creditos ?? '...'}
                                </span>
                            </div>
                        </div>

                        {/* Import Button */}
                        <button
                            onClick={() => setIsImportModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all font-bold text-[13px]"
                            style={{ backgroundColor: '#161B28', border: '1px solid #2A3042', color: '#B0B8C3' }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = '#8A2BE2'; e.currentTarget.style.color = '#FFFFFF'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = '#2A3042'; e.currentTarget.style.color = '#B0B8C3'; }}
                        >
                            <FileSpreadsheet size={16} />
                            <span className="hidden lg:inline">Importar Planilha</span>
                        </button>

                        {/* Profile Info */}
                        <div className="flex items-center gap-3 pl-5 md:ml-2" style={{ borderLeft: '1px solid #2A3042' }}>
                            <div className="hidden md:block text-right">
                                <p className="text-[12px] font-black leading-tight text-white">{nomeUsuario || user?.email?.split('@')[0]}</p>
                                <p className="text-[9px] font-black text-[#7A8291] uppercase tracking-widest mt-0.5">Analista Pro</p>
                            </div>
                            <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm transition-transform hover:scale-105"
                                style={{ background: 'linear-gradient(135deg, #8A2BE2, #00BFFF)', color: '#FFFFFF', boxShadow: '0 0 15px rgba(138, 43, 226, 0.3)' }}
                            >
                                {(nomeUsuario || user?.email || 'A')[0].toUpperCase()}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Scrollable Content */}
                <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">

                    {isDashboardLoading ? (
                        <div className="h-full w-full flex flex-col items-center justify-center space-y-4">
                            <RefreshCcw size={48} className="animate-spin" style={{ color: '#8A2BE2' }} />
                            <p className="text-sm font-bold animate-pulse" style={{ color: '#7A8291' }}>SINCRONIZANDO DADOS DO SUPABASE...</p>
                        </div>
                    ) : fetchError ? (
                        <div className="h-full w-full flex flex-col items-center justify-center space-y-6 p-12 text-center">
                            <div className="p-6 rounded-3xl bg-[#FF005510] border border-[#FF005530]">
                                <AlertCircle size={48} style={{ color: '#FF0055' }} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-white mb-2">Ops! Algo deu errado</h3>
                                <p style={{ color: '#7A8291' }}>{fetchError}</p>
                            </div>
                            <button
                                onClick={() => window.location.reload()}
                                className="px-6 py-3 rounded-xl font-bold transition-all"
                                style={{ backgroundColor: '#8A2BE2', color: '#FFFFFF' }}
                            >
                                Tentar Novamente
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* ══════════ OVERVIEW TAB ══════════ */}
                            {activeTab === 'overview' && (
                                <div className="space-y-6">
                                    {/* ── Empty State quando não há dados ── */}
                                    {!data && (
                                        <div className="flex flex-col items-center justify-center py-16 text-center">
                                            <div className="p-6 rounded-3xl mb-6" style={{ backgroundColor: '#8A2BE215', border: '1px solid #8A2BE230' }}>
                                                <FileSpreadsheet size={48} style={{ color: '#8A2BE2' }} />
                                            </div>
                                            <h3 className="text-2xl font-black text-white mb-2">Aguardando novos dados</h3>
                                            <p className="max-w-sm text-sm" style={{ color: '#7A8291' }}>
                                                Importe uma planilha ou insira dados via formulário para visualizar as análises.
                                            </p>
                                            <button
                                                onClick={() => setIsImportModalOpen(true)}
                                                className="mt-6 flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all"
                                                style={{ backgroundColor: '#8A2BE2', color: '#FFFFFF' }}
                                            >
                                                <FileSpreadsheet size={16} /> Importar Planilha
                                            </button>
                                        </div>
                                    )}

                                    {/* Top Metric Cards — só renderiza se houver dados */}
                                    {data && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                                            <MetricCard
                                                title="Total de Kills"
                                                value={totalKillsFromPlayers}
                                                subValue={filteredPlayerRows.length > 0 ? `${filteredPlayerRows.length} registros` : data ? `${data.general.mediaKills}/queda` : '-'}
                                                icon={Sword}
                                                accentColor="#8A2BE2"
                                            />
                                            <MetricCard
                                                title="Pontuação Total"
                                                value={data.general.totalPontos}
                                                subValue={`Avg: ${data.general.mediaPontos}`}
                                                icon={Target}
                                                accentColor="#8A2BE2"
                                            />
                                            <MetricCard
                                                title="Booyahs"
                                                value={data.general.totalBooyahs}
                                                subValue={`${data.general.percentBooyah}% Win Rate`}
                                                icon={Trophy}
                                                accentColor="#8A2BE2"
                                            />
                                            <MetricCard
                                                title="Call Success"
                                                value={`${data.general.percentSucessoCall}%`}
                                                subValue={`${data.general.callsGanhas}W / ${data.general.callsPerdidas}L`}
                                                icon={Zap}
                                                accentColor="#00FF7F"
                                            />
                                        </div>
                                    )}

                                    {/* Charts Row — só renderiza se houver dados */}
                                    {data && (<div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                                        {/* Area Chart – Tendência de Performance */}
                                        <Card className="lg:col-span-2">
                                            <div className="flex items-center justify-between mb-5">
                                                <div>
                                                    <h4 className="text-base font-bold" style={{ color: '#FFFFFF' }}>Tendência de Performance</h4>
                                                    <p className="text-xs mt-0.5" style={{ color: '#7A8291' }}>Kills ao longo das rodadas</p>
                                                </div>
                                                <div className="p-2 rounded-lg" style={{ backgroundColor: '#8A2BE218', color: '#8A2BE2' }}>
                                                    <TrendingUp size={18} />
                                                </div>
                                            </div>
                                            <div className="h-72 relative">
                                                {trendChartData.length === 0 ? (
                                                    <div className="absolute inset-0 flex items-center justify-center z-10 bg-[#161B28CC] backdrop-blur-[2px] rounded-xl">
                                                        <span className="text-sm font-bold tracking-widest text-[#7A8291] uppercase">Aguardando novos dados...</span>
                                                    </div>
                                                ) : null}
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <AreaChart data={trendChartData}>
                                                        <defs>
                                                            <linearGradient id="colorKillsNeon" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="5%" stopColor="#8A2BE2" stopOpacity={0.25} />
                                                                <stop offset="95%" stopColor="#8A2BE2" stopOpacity={0} />
                                                            </linearGradient>
                                                        </defs>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="#2A3042" vertical={false} />
                                                        <XAxis dataKey="Data" stroke="#7A8291" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#7A8291', fontFamily: 'Inter, sans-serif' }} />
                                                        <YAxis stroke="#7A8291" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#7A8291', fontFamily: 'Inter, sans-serif' }} />
                                                        <Tooltip contentStyle={neonTooltipStyle} />
                                                        <Area type="monotone" dataKey="Kill" stroke="#8A2BE2" strokeWidth={2.5} fillOpacity={1} fill="url(#colorKillsNeon)"
                                                            style={{ filter: 'drop-shadow(0 0 6px #8A2BE2)' }}
                                                        />
                                                    </AreaChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </Card>

                                        {/* Pie Chart */}
                                        <Card>
                                            <div className="flex items-center justify-between mb-5">
                                                <div>
                                                    <h4 className="text-base font-bold" style={{ color: '#FFFFFF' }}>Pontos por Mapa</h4>
                                                    <p className="text-xs mt-0.5" style={{ color: '#7A8291' }}>Distribuição total</p>
                                                </div>
                                                <div className="p-2 rounded-lg" style={{ backgroundColor: '#00BFFF18', color: '#00BFFF' }}>
                                                    <Map size={18} />
                                                </div>
                                            </div>
                                            <div className="h-72">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie
                                                            data={data?.byMap || []}
                                                            cx="50%" cy="45%"
                                                            innerRadius={55} outerRadius={78}
                                                            startAngle={90} endAngle={-270}
                                                            dataKey="totalPontos" nameKey="mapa" paddingAngle={4}
                                                        >
                                                            {(data?.byMap || []).map((_: any, index: number) => (
                                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="transparent" />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip contentStyle={neonTooltipStyle} />
                                                        <Legend
                                                            verticalAlign="bottom"
                                                            height={36}
                                                            iconType="circle"
                                                            iconSize={8}
                                                            formatter={(value) => (
                                                                <span style={{ color: '#B0B8C3', fontSize: '12px', fontFamily: 'Inter, sans-serif' }}>{value}</span>
                                                            )}
                                                        />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </Card>
                                    </div>)}

                                    {/* MVP Cards — exibidos quando há dados em performance_jogadores */}
                                    {filteredPlayerRows.length > 0 && (<>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                            {/* MVP */}
                                            <div
                                                className="rounded-2xl p-6 transition-all hover:scale-[1.02] duration-300"
                                                style={{
                                                    background: 'linear-gradient(135deg, #FFD70012 0%, #161B28 60%)',
                                                    border: '1px solid #FFD70030',
                                                }}
                                            >
                                                <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#FFD700' }}>
                                                    MVP da Temporada
                                                </p>
                                                <h3 className="text-2xl font-black" style={{ color: '#FFFFFF' }}>
                                                    {mvpFromPlayers.player}
                                                </h3>
                                                <div className="mt-4 flex items-baseline gap-2">
                                                    <span className="text-4xl font-black" style={{ color: '#FFD700' }}>
                                                        {mvpFromPlayers.kills}
                                                    </span>
                                                    <span className="text-sm font-medium" style={{ color: '#B0B8C3' }}>Kills</span>
                                                </div>
                                            </div>

                                            {/* Top Dano */}
                                            <div
                                                className="rounded-2xl p-6 transition-all hover:scale-[1.02] duration-300"
                                                style={{
                                                    background: 'linear-gradient(135deg, #FF005512 0%, #161B28 60%)',
                                                    border: '1px solid #FF005530',
                                                }}
                                            >
                                                <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#FF0055' }}>
                                                    Top Dano
                                                </p>
                                                <h3 className="text-2xl font-black" style={{ color: '#FFFFFF' }}>
                                                    {topDanoFromPlayers.player}
                                                </h3>
                                                <div className="mt-4 flex items-baseline gap-2">
                                                    <span className="text-4xl font-black" style={{ color: '#FF0055' }}>
                                                        {topDanoFromPlayers.damage.toLocaleString()}
                                                    </span>
                                                    <span className="text-sm font-medium" style={{ color: '#B0B8C3' }}>Dano</span>
                                                </div>
                                            </div>

                                            {/* Top Suporte */}
                                            <div
                                                className="rounded-2xl p-6 transition-all hover:scale-[1.02] duration-300"
                                                style={{
                                                    background: 'linear-gradient(135deg, #00BFFF12 0%, #161B28 60%)',
                                                    border: '1px solid #00BFFF30',
                                                }}
                                            >
                                                <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#00BFFF' }}>
                                                    Melhor Suporte
                                                </p>
                                                <h3 className="text-2xl font-black" style={{ color: '#FFFFFF' }}>
                                                    {topAssistsFromPlayers.player}
                                                </h3>
                                                <div className="mt-4 flex items-baseline gap-2">
                                                    <span className="text-4xl font-black" style={{ color: '#00BFFF' }}>
                                                        {topAssistsFromPlayers.assists}
                                                    </span>
                                                    <span className="text-sm font-medium" style={{ color: '#B0B8C3' }}>Assists</span>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                    )}
                                </div>
                            )}

                            {/* ══════════ PLAYERS TAB ══════════ */}
                            {activeTab === 'players' && allPlayerRows.length > 0 && (
                                <div className="space-y-6">
                                    {/* Player Filter */}
                                    <div className="flex flex-wrap items-center gap-4">
                                        <div
                                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
                                            style={{ backgroundColor: '#161B28', border: '1px solid #2A3042' }}
                                        >
                                            <UserCircle2 size={16} style={{ color: '#8A2BE2' }} />
                                            <select
                                                value={selectedPlayer}
                                                onChange={e => setSelectedPlayer(e.target.value)}
                                                className="bg-transparent text-sm outline-none cursor-pointer font-medium min-w-[160px]"
                                                style={{ color: '#B0B8C3' }}
                                            >
                                                <option value="Todos">Todos os Jogadores</option>
                                                {playerList.map((p: any) => (
                                                    <option key={p} value={p}>{p}</option>
                                                ))}
                                            </select>
                                        </div>
                                        {selectedPlayer !== 'Todos' && (
                                            <button
                                                onClick={() => setSelectedPlayer('Todos')}
                                                className="text-xs px-3 py-2 rounded-lg font-medium transition-all"
                                                style={{ color: '#8A2BE2', backgroundColor: '#8A2BE218', border: '1px solid #8A2BE230' }}
                                            >
                                                Limpar filtro ✕
                                            </button>
                                        )}
                                        <span className="text-sm ml-auto" style={{ color: '#7A8291' }}>
                                            {playerChartData.length} jogador(es) exibido(s)
                                        </span>
                                    </div>

                                    {filteredPlayerRows.length > 0 ? (
                                        <>
                                            {/* Player Charts */}
                                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                                                {/* Avg Kills */}
                                                <Card>
                                                    <div className="flex items-center justify-between mb-5">
                                                        <div>
                                                            <h4 className="font-bold text-sm" style={{ color: '#FFFFFF' }}>Média de Kills</h4>
                                                            <p className="text-xs mt-0.5" style={{ color: '#7A8291' }}>Por partida</p>
                                                        </div>
                                                        <div className="p-2 rounded-lg" style={{ backgroundColor: '#FF005518', color: '#FF0055' }}>
                                                            <Sword size={16} />
                                                        </div>
                                                    </div>
                                                    <div className="h-56">
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <BarChart data={playerChartData} layout="vertical" margin={{ left: 0 }}>
                                                                <CartesianGrid strokeDasharray="3 3" stroke="#2A3042" horizontal={false} />
                                                                <XAxis type="number" stroke="#7A8291" tickLine={false} axisLine={false} fontSize={11} tick={{ fill: '#7A8291' }} />
                                                                <YAxis type="category" dataKey="name" stroke="#7A8291" tickLine={false} axisLine={false} fontSize={11} width={70} tick={{ fill: '#B0B8C3' }} />
                                                                <Tooltip contentStyle={neonTooltipStyle} />
                                                                <Bar dataKey="avgKills" fill="#FF0055" radius={[0, 6, 6, 0]} name="Média de Abates" />
                                                            </BarChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                </Card>

                                                {/* Avg Damage */}
                                                <Card>
                                                    <div className="flex items-center justify-between mb-5">
                                                        <div>
                                                            <h4 className="font-bold text-sm" style={{ color: '#FFFFFF' }}>Média de Dano</h4>
                                                            <p className="text-xs mt-0.5" style={{ color: '#7A8291' }}>Por partida</p>
                                                        </div>
                                                        <div className="p-2 rounded-lg" style={{ backgroundColor: '#8A2BE218', color: '#8A2BE2' }}>
                                                            <ShieldAlert size={16} />
                                                        </div>
                                                    </div>
                                                    <div className="h-56">
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <BarChart data={playerChartData} layout="vertical" margin={{ left: 0 }}>
                                                                <CartesianGrid strokeDasharray="3 3" stroke="#2A3042" horizontal={false} />
                                                                <XAxis type="number" stroke="#7A8291" tickLine={false} axisLine={false} fontSize={11} tick={{ fill: '#7A8291' }} />
                                                                <YAxis type="category" dataKey="name" stroke="#7A8291" tickLine={false} axisLine={false} fontSize={11} width={70} tick={{ fill: '#B0B8C3' }} />
                                                                <Tooltip contentStyle={neonTooltipStyle} />
                                                                <Bar dataKey="avgDamage" fill="#8A2BE2" radius={[0, 6, 6, 0]} name="Média de Dano" />
                                                            </BarChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                </Card>

                                                {/* Avg Assists */}
                                                <Card>
                                                    <div className="flex items-center justify-between mb-5">
                                                        <div>
                                                            <h4 className="font-bold text-sm" style={{ color: '#FFFFFF' }}>Média de Assistências</h4>
                                                            <p className="text-xs mt-0.5" style={{ color: '#7A8291' }}>Por partida</p>
                                                        </div>
                                                        <div className="p-2 rounded-lg" style={{ backgroundColor: '#00BFFF18', color: '#00BFFF' }}>
                                                            <Target size={16} />
                                                        </div>
                                                    </div>
                                                    <div className="h-56">
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <BarChart data={playerChartData} layout="vertical" margin={{ left: 0 }}>
                                                                <CartesianGrid strokeDasharray="3 3" stroke="#2A3042" horizontal={false} />
                                                                <XAxis type="number" stroke="#7A8291" tickLine={false} axisLine={false} fontSize={11} tick={{ fill: '#7A8291' }} />
                                                                <YAxis type="category" dataKey="name" stroke="#7A8291" tickLine={false} axisLine={false} fontSize={11} width={70} tick={{ fill: '#B0B8C3' }} />
                                                                <Tooltip contentStyle={neonTooltipStyle} />
                                                                <Bar dataKey="avgAssists" fill="#00BFFF" radius={[0, 6, 6, 0]} name="Média de Assistências" />
                                                            </BarChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                </Card>
                                            </div>

                                            {/* Radar (single player) */}
                                            {selectedPlayer !== 'Todos' && radarData.length > 0 && (
                                                <Card>
                                                    <div className="flex items-center gap-3 mb-6">
                                                        <div
                                                            className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-base shadow-lg"
                                                            style={{ background: 'linear-gradient(135deg, #8A2BE2, #00BFFF)', color: '#FFFFFF' }}
                                                        >
                                                            {selectedPlayer[0]}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-lg" style={{ color: '#FFFFFF' }}>{selectedPlayer} — Perfil Completo</h4>
                                                            <p className="text-sm" style={{ color: '#7A8291' }}>Desempenho individual detalhado</p>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                                                        <div className="h-64">
                                                            <ResponsiveContainer width="100%" height="100%">
                                                                <RadarChart data={radarData}>
                                                                    <PolarGrid stroke="#2A3042" />
                                                                    <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12, fill: '#B0B8C3', fontFamily: 'Inter, sans-serif' }} />
                                                                    <Radar name={selectedPlayer} dataKey="value" stroke="#8A2BE2" fill="#8A2BE2" fillOpacity={0.2} strokeWidth={2} />
                                                                    <Tooltip contentStyle={neonTooltipStyle} />
                                                                </RadarChart>
                                                            </ResponsiveContainer>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            {playerChartData[0] && [
                                                                { label: 'Média de Abates', val: playerChartData[0].avgKills, color: '#FF0055' },
                                                                { label: 'Média de Dano', val: playerChartData[0].avgDamage.toLocaleString(), color: '#8A2BE2' },
                                                                { label: 'Média de Assistências', val: playerChartData[0].avgAssists, color: '#00BFFF' },
                                                                { label: 'Relação K/D', val: playerChartData[0].kd, color: '#00FF7F' },
                                                            ].map((stat, i) => (
                                                                <div key={i} className="rounded-xl p-4" style={{ backgroundColor: `${stat.color}10`, border: `1px solid ${stat.color}30` }}>
                                                                    <p className="text-xs mb-1" style={{ color: '#7A8291' }}>{stat.label}</p>
                                                                    <p className="text-2xl font-black" style={{ color: stat.color }}>{stat.val}</p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </Card>
                                            )}

                                            {/* Players Table */}
                                            <Card className="overflow-hidden">
                                                <div className="flex items-center justify-between mb-6">
                                                    <h4 className="text-base font-bold flex items-center gap-2" style={{ color: '#FFFFFF' }}>
                                                        <Users size={18} style={{ color: '#8A2BE2' }} /> Ranking de Jogadores
                                                    </h4>
                                                </div>
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-sm text-left" style={{ color: '#B0B8C3' }}>
                                                        <thead>
                                                            <tr style={{ borderBottom: '1px solid #2A3042' }}>
                                                                {['Jogador', 'Equipe', 'Kills', 'Dano', 'Assis.', 'KD', 'Score'].map((h, i) => (
                                                                    <th key={i} className={`px-5 py-3 text-xs font-semibold uppercase tracking-wider ${i > 1 ? 'text-center' : ''}`} style={{ color: '#7A8291' }}>{h}</th>
                                                                ))}
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {(selectedPlayer === 'Todos'
                                                                ? filteredPlayerRows
                                                                : filteredPlayerRows.filter((p: any) => p.Player === selectedPlayer))
                                                                .sort((a: any, b: any) => b.Kill - a.Kill)
                                                                .map((p: any, idx: number) => (
                                                                    <tr
                                                                        key={idx}
                                                                        className="transition-colors"
                                                                        style={{ borderBottom: '1px solid #2A304280' }}
                                                                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#8A2BE208')}
                                                                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                                                                    >
                                                                        <td className="px-5 py-4 font-bold flex items-center gap-3" style={{ color: '#FFFFFF' }}>
                                                                            <span
                                                                                className="w-6 h-6 rounded flex items-center justify-center text-xs font-mono"
                                                                                style={{ backgroundColor: '#2A3042', color: '#7A8291' }}
                                                                            >
                                                                                {idx + 1}
                                                                            </span>
                                                                            {p.Player}
                                                                        </td>
                                                                        <td className="px-5 py-4" style={{ color: '#B0B8C3' }}>{p.Equipe}</td>
                                                                        <td className="px-5 py-4 text-center font-bold" style={{ color: '#FFFFFF' }}>{p.Kill}</td>
                                                                        <td className="px-5 py-4 text-center">{p['Dano causado']}</td>
                                                                        <td className="px-5 py-4 text-center">{p.Assistencia}</td>
                                                                        <td className="px-5 py-4 text-center" style={{ color: '#7A8291' }}>{(p.Kill / (p.Morte || 1)).toFixed(2)}</td>
                                                                        <td className="px-5 py-4 text-center">
                                                                            <div className="w-16 h-1.5 rounded-full mx-auto overflow-hidden" style={{ backgroundColor: '#2A3042' }}>
                                                                                <div className="h-full rounded-full" style={{ width: `${Math.min(p.Kill * 5, 100)}%`, backgroundColor: '#8A2BE2' }} />
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </Card>
                                        </>
                                    ) : (
                                        <Card className="border-dashed border-2 p-12 text-center flex flex-col items-center" style={{ borderColor: '#2A3042' }}>
                                            <Users size={48} className="mb-4" style={{ color: '#2A3042' }} />
                                            <h3 className="text-lg font-bold" style={{ color: '#7A8291' }}>Aguardando novos dados...</h3>
                                            <p className="max-w-sm mt-2" style={{ color: '#7A8291' }}>
                                                Registre dados no formulário de Performance Jogadores para ver as análises.
                                            </p>
                                        </Card>
                                    )}
                                </div>
                            )}

                            {/* ══════════ HISTORY TAB ══════════ */}
                            {activeTab === 'history' && (
                                <Card className="overflow-hidden">
                                    <h4 className="text-base font-bold mb-6 flex items-center gap-2" style={{ color: '#FFFFFF' }}>
                                        <FileSpreadsheet size={18} style={{ color: '#00BFFF' }} /> Histórico de Partidas
                                    </h4>
                                    <div className="overflow-x-auto relative min-h-[200px]">
                                        {!data || data.rawData.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center p-12 text-[#7A8291]">
                                                <AlertCircle size={32} className="mb-3 opacity-20" />
                                                <p className="text-sm font-bold uppercase tracking-widest">Aguardando novos dados...</p>
                                            </div>
                                        ) : (
                                            <table className="w-full text-sm text-left" style={{ color: '#B0B8C3' }}>
                                                <thead>
                                                    <tr style={{ borderBottom: '1px solid #2A3042' }}>
                                                        {['Rodada', 'Mapa', 'Equipe', 'Colocação', 'Kills', 'Pontos', 'Booyah'].map((h, i) => (
                                                            <th key={i} className={`px-5 py-3 text-xs font-semibold uppercase tracking-wider ${i > 2 ? 'text-center' : ''}`} style={{ color: '#7A8291' }}>{h}</th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {data.rawData.map((row: any, index: number) => (
                                                        <tr
                                                            key={index}
                                                            className="transition-colors"
                                                            style={{ borderBottom: '1px solid #2A304280' }}
                                                            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#8A2BE208')}
                                                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                                                        >
                                                            <td className="px-5 py-4 font-medium" style={{ color: '#FFFFFF' }}>#{row.Rodada}</td>
                                                            <td className="px-5 py-4" style={{ color: '#B0B8C3' }}>{row.Mapa}</td>
                                                            <td className="px-5 py-4" style={{ color: '#B0B8C3' }}>{row.Equipe}</td>
                                                            <td className="px-5 py-4 text-center">
                                                                <span
                                                                    className="px-2 py-1 rounded text-xs font-bold"
                                                                    style={row.Colocacao === 1
                                                                        ? { backgroundColor: '#FFD70015', color: '#FFD700' }
                                                                        : { backgroundColor: '#2A3042', color: '#7A8291' }
                                                                    }
                                                                >
                                                                    {row.Colocacao}º
                                                                </span>
                                                            </td>
                                                            <td className="px-5 py-4 text-center font-bold" style={{ color: '#FFFFFF' }}>{row.Kill}</td>
                                                            <td className="px-5 py-4 text-center font-bold" style={{ color: '#8A2BE2' }}>{row.Pontos_Total}</td>
                                                            <td className="px-5 py-4 text-center">
                                                                {row.Booyah === 'SIM'
                                                                    ? <span style={{ color: '#FFD700', fontSize: '18px' }}>★</span>
                                                                    : <span style={{ color: '#2A3042' }}>-</span>
                                                                }
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                </Card>
                            )}
                        </>
                    )}
                </main>
            </div>
        </div >
    );
};
