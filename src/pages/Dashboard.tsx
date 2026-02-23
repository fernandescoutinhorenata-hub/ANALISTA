import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import {
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import {
    Trophy, Target, Zap, FileSpreadsheet, RefreshCcw,
    Users, Sword, ShieldAlert,
    LayoutDashboard, Menu, ChevronRight, PlusCircle,
    CheckCircle, XCircle, AlertCircle, Wallet, LogOut
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { DashboardData } from '../types';
import { processData } from '../utils/data-processing';
import { useAuth } from '../contexts/AuthContext';

// ─── Estilos Globais do Dashboard ──────────────────────────────────────────
const DashboardStyles = () => (
    <style>{`
        .custom-scrollbar::-webkit-scrollbar {
            width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(168, 85, 247, 0.2);
            border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(168, 85, 247, 0.5);
        }
        @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
            100% { transform: translateY(0px); }
        }
        .animate-float {
            animation: float 6s ease-in-out infinite;
        }
    `}</style>
);
// ─── Celo Tracker Pro – Design Tokens ──────────────────────────────────────
const COLORS = {
    bgMain: '#0D0D0D',         // Grafite quase preto
    bgSidebar: '#000000',      // Preto total para sidebar
    bgCard: 'rgba(22, 27, 40, 0.4)', // Translúcido (glass)
    border: 'rgba(255, 255, 255, 0.05)',
    textPri: '#FFFFFF',
    textSec: '#B0B8C3',
    textTer: '#7A8291',
    purple: '#A855F7',         // Roxo Neon
    lime: '#BEF264',           // Verde Limão
    cyan: '#22D3EE',           // Ciano
    rose: '#F43F5E',           // Rosa para variações negativas
    gray: '#2A3042'
};

const S = {
    bgMain: { background: `radial-gradient(circle at 50% 50%, #1A1A1A 0%, ${COLORS.bgMain} 100%)` },
    glass: {
        backgroundColor: COLORS.bgCard,
        backdropFilter: 'blur(12px)',
        border: `1px solid ${COLORS.border}`,
        borderRadius: '20px'
    }
};

const Card: React.FC<{ children: React.ReactNode; className?: string; style?: React.CSSProperties }> = ({ children, className = '', style }) => (
    <div
        className={`backdrop-blur-xl ${className}`}
        style={{ ...S.glass, ...style }}
    >
        {children}
    </div>
);

// ─── Metric Card ─────────────────────────────────────────────────────────────
const MetricCard: React.FC<{
    title: string;
    value: string | number;
    variation?: number;
    icon: any;
}> = ({ title, value, variation, icon: Icon }) => (
    <Card className="p-6 flex flex-col gap-2 transition-all duration-300 hover:scale-[1.02]">
        <div className="flex justify-between items-center mb-1">
            <h4 className="text-[13px] font-bold uppercase tracking-wider text-[#7A8291]">{title}</h4>
            <div className="p-2 rounded-lg bg-white/5 text-white/50">
                <Icon size={16} />
            </div>
        </div>
        <div className="flex items-end gap-3">
            <h3 className="text-2xl font-black text-white">{value}</h3>
            {variation !== undefined && (
                <div
                    className="flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full mb-1"
                    style={{
                        backgroundColor: variation >= 0 ? `${COLORS.lime}15` : `${COLORS.rose}15`,
                        color: variation >= 0 ? COLORS.lime : COLORS.rose
                    }}
                >
                    {variation >= 0 ? '+' : ''}{variation}%
                </div>
            )}
        </div>
    </Card>
);


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

    const filterOptions = useMemo(() => {
        const dates = new Set<string>();
        const championships = new Set<string>();
        allGeneralRows.forEach(row => {
            if (row.Data) dates.add(String(row.Data));
            if (row.Campeonato) championships.add(String(row.Campeonato));
        });
        return { dates: Array.from(dates).sort(), championships: Array.from(championships).sort() };
    }, [allGeneralRows]);

    // ─── showToast declarado aqui para evitar uso antes da declaração ───────────
    const showToast = (message: string, type: 'success' | 'error' | 'warning') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };


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


    // ── Layout ───────────────────────────────────────────────────────────────
    return (
        <div className="flex h-screen overflow-hidden text-white" style={S.bgMain}>
            <DashboardStyles />
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

            {/* Overlay Mobile */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/80 z-[60] md:hidden backdrop-blur-sm"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}


            {/* ── Sidebar ── */}
            <aside
                className={`fixed inset-y-0 left-0 z-[70] w-64 flex flex-col transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0`}
                style={{ backgroundColor: COLORS.bgSidebar, borderRight: `1px solid ${COLORS.border}` }}
            >
                {/* Logo Section */}
                <div className="p-8 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#BEF264]/10">
                        {/* Wolf Icon (Using Sword or Zap as placeholder for minimal wolf-like icon if no SVG is available, but let's use Lucide's Shield or similar) */}
                        <Zap size={20} style={{ color: COLORS.lime }} />
                    </div>
                    <span className="font-extrabold text-lg tracking-tight">Celo Tracker</span>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-4 space-y-2">
                    {[
                        { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
                        { id: 'players', label: 'Accounts', icon: Users },
                        { id: 'history', label: 'Analytics', icon: FileSpreadsheet },
                    ].map(item => {
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }}
                                className="w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all font-medium text-[14px] group relative"
                                style={{
                                    backgroundColor: isActive ? 'rgba(168, 85, 247, 0.2)' : 'transparent',
                                    color: isActive ? '#FFFFFF' : '#7A8291',
                                }}
                            >
                                {isActive && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 rounded-full" style={{ backgroundColor: COLORS.purple }} />
                                )}
                                <item.icon size={20} className={`transition-colors ${isActive ? 'text-[#A855F7]' : 'group-hover:text-white'}`} />
                                {item.label}
                                {item.id === 'history' && <ChevronRight size={14} className="ml-auto opacity-50" />}
                            </button>
                        );
                    })}
                </nav>

                {/* Footer Nav */}
                <div className="p-4 px-6 mb-8 space-y-6">
                    <div className="space-y-4">
                        <button className="flex items-center gap-4 text-[#7A8291] hover:text-white transition-colors text-sm font-medium">
                            <PlusCircle size={20} /> Settings
                        </button>
                    </div>

                    <div className="pt-8 flex flex-col gap-2">
                        <h4 className="text-white font-bold text-sm">Need Help?</h4>
                        <p className="text-[#7A8291] text-xs leading-relaxed">Our support team is ready to assist you with any questions.</p>
                        <button
                            onClick={() => window.open('https://wa.me/YOURNUMBER', '_blank')}
                            className="mt-2 w-full py-2.5 rounded-xl border border-white/10 text-xs font-bold hover:bg-white/5 transition-all"
                        >
                            Contact Us
                        </button>
                    </div>
                </div>
            </aside>

            {/* ── Content Area ── */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Header Area */}
                <header className="h-24 flex items-center justify-between px-8 z-40 bg-black/20 backdrop-blur-md border-b border-white/5">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:hidden p-2 rounded-lg bg-white/5 border border-white/10">
                            <Menu size={20} />
                        </button>
                        <div className="hidden md:flex items-center text-sm font-medium text-white/50">
                            <LayoutDashboard size={14} className="mr-2" />
                            <span>Dashboard</span>
                            <ChevronRight size={14} className="mx-2" />
                            <span className="text-white font-bold uppercase tracking-wider text-[11px]" style={{ color: COLORS.purple }}>
                                {activeTab === 'overview' ? 'Visão Geral' : activeTab === 'players' ? 'Jogadores' : 'Histórico'}
                            </span>
                        </div>
                    </div>

                    {/* Filters Area */}
                    <div className="flex-1 flex justify-center px-4">
                        <div className="flex items-center gap-4 bg-white/[0.03] border border-white/10 px-6 py-2 rounded-2xl backdrop-blur-3xl shadow-2xl">
                            <div className="flex items-center gap-3 pr-4 border-r border-white/10">
                                <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Data</span>
                                <select
                                    value={filters.date}
                                    onChange={e => setFilters(prev => ({ ...prev, date: e.target.value }))}
                                    className="bg-transparent text-[11px] font-bold text-white outline-none cursor-pointer hover:text-purple-400 transition-colors"
                                >
                                    <option value="Todos" className="bg-[#0D0D0D]">Todas as Datas</option>
                                    {filterOptions.dates.map(d => <option key={d} value={d} className="bg-[#0D0D0D]">{d}</option>)}
                                </select>
                            </div>
                            <div className="flex items-center gap-3 ml-2">
                                <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Torneio</span>
                                <select
                                    value={filters.championship}
                                    onChange={e => setFilters(prev => ({ ...prev, championship: e.target.value }))}
                                    className="bg-transparent text-[11px] font-bold text-white outline-none cursor-pointer hover:text-purple-400 transition-colors"
                                >
                                    <option value="Todos" className="bg-[#0D0D0D]">Todos Campeonatos</option>
                                    {filterOptions.championships.map(c => <option key={c} value={c} className="bg-[#0D0D0D]">{c}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Profile & Controls */}
                    <div className="flex items-center gap-6">
                        <div className="hidden sm:flex items-center gap-2.5 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                            <Wallet size={16} className="text-[#BEF264]" />
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black text-white/30 uppercase tracking-widest leading-none">Saldo</span>
                                <span className="text-[13px] font-black mt-0.5 text-white">{creditos ?? '...'}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 pl-6 border-l border-white/10">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-bold text-white capitalize">{nomeUsuario || 'Analista'}</p>
                            </div>
                            <button
                                onClick={() => signOut().then(() => navigate('/login'))}
                                className="group relative p-1 rounded-full border-2 border-[#BEF264] hover:border-rose-500 transition-all duration-300"
                            >
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center font-black text-sm text-white group-hover:opacity-20 transition-opacity">
                                    {(nomeUsuario || 'A')[0].toUpperCase()}
                                </div>
                                <LogOut size={16} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">


                    {isDashboardLoading ? (
                        <div className="h-full w-full flex flex-col items-center justify-center space-y-6">
                            <div className="relative">
                                <div className="w-16 h-16 rounded-full border-4 border-purple-500/10 border-t-purple-500 animate-spin" />
                                <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-purple-400 animate-pulse" />
                            </div>
                            <p className="text-sm font-bold tracking-[3px] text-white/20 uppercase animate-pulse">Sincronizando Sistema</p>
                        </div>
                    ) : fetchError ? (
                        <div className="h-full flex flex-col items-center justify-center p-12 text-center bg-white/[0.02] rounded-[40px] border border-white/5 backdrop-blur-3xl">
                            <div className="p-6 rounded-full bg-rose-500/10 border border-rose-500/20 mb-8">
                                <AlertCircle size={48} className="text-rose-500" />
                            </div>
                            <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">Falha na Sincronização</h3>
                            <p className="max-w-md text-white/40 font-medium mb-8 leading-relaxed">{fetchError}</p>
                            <button onClick={() => window.location.reload()} className="px-8 py-3.5 rounded-2xl bg-white text-black font-black text-sm hover:scale-105 transition-transform">
                                Tentar Novamente
                            </button>
                        </div>
                    ) : (
                        <>
                            {activeTab === 'overview' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                        <MetricCard title="Abates Totais" value={totalKillsFromPlayers} variation={12} icon={Sword} />
                                        <MetricCard title="Mortes Totais" value={filteredPlayerRows.reduce((sum, p) => sum + (Number(p.Morte) || 0), 0)} variation={-5} icon={ShieldAlert} />
                                        <MetricCard title="Assists Totais" value={filteredPlayerRows.reduce((sum, p) => sum + (Number(p.Assistencia) || 0), 0)} variation={8} icon={Users} />
                                        <MetricCard title="Pontos Ganhos" value={data?.general?.totalPontos || 0} variation={24} icon={Target} />
                                    </div>

                                    {/* Charts */}
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                        <Card className="lg:col-span-2 p-8">
                                            <div className="flex items-center justify-between mb-10">
                                                <div>
                                                    <h4 className="text-lg font-bold text-white tracking-tight">Evolução Competitiva</h4>
                                                    <p className="text-sm text-white/30 mt-1">Abates consolidados por data</p>
                                                </div>
                                            </div>
                                            <div className="h-80">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={trendChartData}>
                                                        <defs>
                                                            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="0%" stopColor={COLORS.purple} stopOpacity={1} />
                                                                <stop offset="100%" stopColor={COLORS.purple} stopOpacity={0.2} />
                                                            </linearGradient>
                                                        </defs>
                                                        <CartesianGrid strokeDasharray="0" stroke="transparent" vertical={false} />
                                                        <XAxis dataKey="Data" stroke="#4A5568" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#7A8291', fontWeight: 600 }} />
                                                        <YAxis stroke="#4A5568" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#7A8291', fontWeight: 600 }} />
                                                        <Tooltip
                                                            cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                                                            content={({ active, payload }) => {
                                                                if (active && payload?.length) {
                                                                    return (
                                                                        <div className="bg-[#121212] border border-white/10 p-4 rounded-2xl shadow-2xl backdrop-blur-3xl">
                                                                            <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">{payload[0].payload.Data}</p>
                                                                            <p className="text-sm font-black text-white">{payload[0].value} Abates</p>
                                                                        </div>
                                                                    );
                                                                }
                                                                return null;
                                                            }}
                                                        />
                                                        <Bar dataKey="Kill" fill="url(#barGradient)" radius={[6, 6, 6, 6]} barSize={24} />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </Card>

                                        <Card className="p-8">
                                            <h4 className="text-lg font-bold text-white mb-1 tracking-tight">Performance por Mapa</h4>
                                            <p className="text-sm text-white/30 mb-10">Distribuição de pontos</p>
                                            <div className="h-64 relative">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie
                                                            data={data?.byMap || [{ mapa: 'N/A', totalPontos: 1 }]}
                                                            innerRadius={75}
                                                            outerRadius={100}
                                                            paddingAngle={8}
                                                            dataKey="totalPontos"
                                                            nameKey="mapa"
                                                            stroke="none"
                                                        >
                                                            <Cell fill={COLORS.purple} />
                                                            <Cell fill={COLORS.lime} />
                                                            <Cell fill={COLORS.cyan} />
                                                            <Cell fill="#1A1A1A" />
                                                        </Pie>
                                                        <Tooltip
                                                            content={({ active, payload }) => {
                                                                if (active && payload?.length) {
                                                                    return (
                                                                        <div className="bg-[#121212] border border-white/10 p-2.5 px-4 rounded-xl shadow-2xl">
                                                                            <p className="text-[10px] font-black text-white/40 uppercase tracking-tighter mb-0.5">{payload[0].name}</p>
                                                                            <p className="text-xs font-black text-white">{payload[0].value} pts</p>
                                                                        </div>
                                                                    );
                                                                }
                                                                return null;
                                                            }}
                                                        />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                                    <span className="text-3xl font-black text-white leading-none">{data?.general?.totalBooyahs || 0}</span>
                                                    <span className="text-[10px] font-black text-white/20 uppercase tracking-[2px] mt-1">BOOYAH!</span>
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap justify-center gap-5 mt-10">
                                                {(data?.byMap || []).map((m: any, i: number) => (
                                                    <div key={m.mapa} className="flex items-center gap-2.5">
                                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: [COLORS.purple, COLORS.lime, COLORS.cyan, '#1A1A1A'][i % 4] }} />
                                                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{m.mapa}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </Card>
                                    </div>

                                    {/* Top Performers Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {[
                                            { label: 'Matador do Dia', name: mvpFromPlayers.player, stat: `${mvpFromPlayers.kills} Kills`, icon: Trophy, color: COLORS.purple },
                                            { label: 'Bruto no Dano', name: topDanoFromPlayers.player, stat: `${topDanoFromPlayers.damage.toLocaleString()} Dano`, icon: Sword, color: COLORS.lime },
                                            { label: 'Mestre Assistência', name: topAssistsFromPlayers.player, stat: `${topAssistsFromPlayers.assists} Assists`, icon: Users, color: COLORS.cyan }
                                        ].map((item, i) => (
                                            <Card key={i} className="p-6 flex items-center gap-6 border-dashed border-white/10 hover:border-white/20 transition-all">
                                                <div className="p-5 rounded-3xl" style={{ backgroundColor: `${item.color}10`, color: item.color }}>
                                                    <item.icon size={28} />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-[10px] font-black text-white/20 uppercase tracking-[3px] mb-1.5">{item.label}</p>
                                                    <h5 className="text-xl font-bold text-white tracking-tight leading-none">{item.name}</h5>
                                                    <p className="text-xs font-bold mt-2.5 flex items-center gap-2" style={{ color: item.color }}>
                                                        <Zap size={10} fill={item.color} /> {item.stat}
                                                    </p>
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            )}


                            {/* ══════════ PLAYERS TAB ══════════ */}
                            {activeTab === 'players' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                    {/* Player Filter & Stats */}
                                    <div className="flex flex-wrap items-center justify-between gap-6">
                                        <div className="flex items-center gap-4">
                                            <div className="px-6 py-3 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center gap-4 focus-within:border-purple-500/50 transition-all shadow-2xl">
                                                <Users size={18} className="text-purple-400" />
                                                <select
                                                    value={selectedPlayer}
                                                    onChange={e => setSelectedPlayer(e.target.value)}
                                                    className="bg-transparent text-sm outline-none cursor-pointer font-bold text-white/80 min-w-[200px]"
                                                >
                                                    <option value="Todos" className="bg-[#0D0D0D]">Acompanhar Todos</option>
                                                    {playerList.map((p: any) => (
                                                        <option key={p} value={p} className="bg-[#0D0D0D]">{p}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            {selectedPlayer !== 'Todos' && (
                                                <button onClick={() => setSelectedPlayer('Todos')} className="text-[10px] font-black uppercase tracking-widest text-purple-400 hover:text-white transition-colors">
                                                    Resetar ✕
                                                </button>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-8">
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-white/20 uppercase tracking-[2px]">Ativos no Squad</p>
                                                <p className="text-xl font-black text-white">{playerList.length} <span className="text-xs text-white/30 font-bold ml-1">Elite</span></p>
                                            </div>
                                        </div>
                                    </div>

                                    {filteredPlayerRows.length > 0 ? (
                                        <div className="space-y-8">
                                            {/* Player Comparison Grid */}
                                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                                <Card className="p-8">
                                                    <div className="flex items-center justify-between mb-8">
                                                        <h4 className="font-bold text-white tracking-tight">Abates Médios</h4>
                                                        <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500"><Sword size={16} /></div>
                                                    </div>
                                                    <div className="h-64">
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <BarChart data={playerChartData} layout="vertical" margin={{ left: -20 }}>
                                                                <XAxis type="number" hide />
                                                                <YAxis type="category" dataKey="name" stroke="none" fontSize={11} width={80} tick={{ fill: '#FFFFFF', fontWeight: 600 }} />
                                                                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: '#121212', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }} />
                                                                <Bar dataKey="avgKills" fill={COLORS.rose} radius={[0, 4, 4, 0]} barSize={12} />
                                                            </BarChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                </Card>

                                                <Card className="p-8">
                                                    <div className="flex items-center justify-between mb-8">
                                                        <h4 className="font-bold text-white tracking-tight">Dano Explosivo</h4>
                                                        <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400"><Zap size={16} /></div>
                                                    </div>
                                                    <div className="h-64">
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <BarChart data={playerChartData} layout="vertical" margin={{ left: -20 }}>
                                                                <XAxis type="number" hide />
                                                                <YAxis type="category" dataKey="name" stroke="none" fontSize={11} width={80} tick={{ fill: '#FFFFFF', fontWeight: 600 }} />
                                                                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: '#121212', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }} />
                                                                <Bar dataKey="avgDamage" fill={COLORS.purple} radius={[0, 4, 4, 0]} barSize={12} />
                                                            </BarChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                </Card>

                                                <Card className="p-8">
                                                    <div className="flex items-center justify-between mb-8">
                                                        <h4 className="font-bold text-white tracking-tight">Suporte Tático</h4>
                                                        <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400"><ShieldAlert size={16} /></div>
                                                    </div>
                                                    <div className="h-64">
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <BarChart data={playerChartData} layout="vertical" margin={{ left: -20 }}>
                                                                <XAxis type="number" hide />
                                                                <YAxis type="category" dataKey="name" stroke="none" fontSize={11} width={80} tick={{ fill: '#FFFFFF', fontWeight: 600 }} />
                                                                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: '#121212', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }} />
                                                                <Bar dataKey="avgAssists" fill={COLORS.cyan} radius={[0, 4, 4, 0]} barSize={12} />
                                                            </BarChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                </Card>
                                            </div>

                                            {/* Ranking Table */}
                                            <Card className="overflow-hidden p-0 border-white/5">
                                                <div className="p-8 border-b border-white/5 flex items-center justify-between">
                                                    <h4 className="text-lg font-bold text-white tracking-tight uppercase tracking-widest text-xs opacity-40">Classificação de Elite</h4>
                                                </div>
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-sm text-left">
                                                        <thead>
                                                            <tr className="bg-white/[0.01]">
                                                                {['Pos', 'Guerreiro', 'Abates', 'Dano', 'Assist.', 'K/D', 'Impacto'].map((h, i) => (
                                                                    <th key={i} className="px-8 py-5 text-[10px] font-black text-white/30 uppercase tracking-[2px]">{h}</th>
                                                                ))}
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-white/5">
                                                            {(selectedPlayer === 'Todos' ? filteredPlayerRows : filteredPlayerRows.filter((p: any) => p.Player === selectedPlayer))
                                                                .sort((a: any, b: any) => b.Kill - a.Kill)
                                                                .map((p: any, idx: number) => (
                                                                    <tr key={idx} className="hover:bg-white/[0.02] transition-colors group">
                                                                        <td className="px-8 py-6">
                                                                            <span className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[11px] font-black text-white group-hover:border-purple-500/30">
                                                                                #{idx + 1}
                                                                            </span>
                                                                        </td>
                                                                        <td className="px-8 py-6 font-black text-white text-[15px]">{p.Player}</td>
                                                                        <td className="px-8 py-6 font-bold text-white">{p.Kill}</td>
                                                                        <td className="px-8 py-6 text-white/40">{p['Dano causado']?.toLocaleString()}</td>
                                                                        <td className="px-8 py-6 text-white/40">{p.Assistencia}</td>
                                                                        <td className="px-8 py-6 text-rose-400 font-bold">{(p.Kill / (p.Morte || 1)).toFixed(2)}</td>
                                                                        <td className="px-8 py-6">
                                                                            <div className="w-24 h-1.5 rounded-full bg-white/5 overflow-hidden">
                                                                                <div className="h-full bg-gradient-to-r from-purple-500 to-lime-400" style={{ width: `${Math.min(p.Kill * 8, 100)}%` }} />
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </Card>
                                        </div>
                                    ) : (
                                        <div className="h-96 flex flex-col items-center justify-center bg-white/[0.02] rounded-[40px] border border-dashed border-white/10">
                                            <Users size={48} className="text-white/10 mb-6" />
                                            <p className="text-sm font-black text-white/20 uppercase tracking-[4px]">Aguardando Dados do Esquadrão</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ══════════ HISTORY TAB ══════════ */}
                            {activeTab === 'history' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                    <Card className="overflow-hidden p-0 border-white/5 shadow-2xl">
                                        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                                            <div>
                                                <h4 className="text-lg font-bold text-white tracking-tight">Registro de Partidas</h4>
                                                <p className="text-xs text-white/30 mt-1 uppercase tracking-widest font-black">Timeline Competitiva</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="px-3 py-1.5 rounded-lg bg-lime-500/10 text-lime-400 text-[10px] font-black uppercase">Sincronizado</span>
                                            </div>
                                        </div>
                                        <div className="overflow-x-auto">
                                            {!data || data.rawData.length === 0 ? (
                                                <div className="p-20 flex flex-col items-center gap-4">
                                                    <FileSpreadsheet size={40} className="text-white/5" />
                                                    <p className="text-xs font-black text-white/20 uppercase tracking-[3px]">Sem registros no histórico</p>
                                                </div>
                                            ) : (
                                                <table className="w-full text-sm text-left">
                                                    <thead>
                                                        <tr className="bg-black/20">
                                                            {['Rod.', 'Campo de Batalha', 'Equipe', 'Resultado', 'Abates', 'Total Pts', 'Elite'].map((h, i) => (
                                                                <th key={i} className="px-8 py-5 text-[10px] font-black text-white/20 uppercase tracking-[3px]">{h}</th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-white/5">
                                                        {data.rawData.map((row: any, index: number) => (
                                                            <tr key={index} className="hover:bg-white/[0.02] transition-colors group">
                                                                <td className="px-8 py-6">
                                                                    <div className="text-[12px] font-black text-white/40">#{row.Rodada}</div>
                                                                </td>
                                                                <td className="px-8 py-6 font-bold text-white/90">{row.Mapa}</td>
                                                                <td className="px-8 py-6 text-white/50">{row.Equipe}</td>
                                                                <td className="px-8 py-6">
                                                                    <span className={`px-3 py-1 rounded-lg text-[11px] font-black uppercase tracking-widest ${row.Colocacao === 1 ? 'bg-amber-500/10 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'bg-white/5 text-white/40'}`}>
                                                                        {row.Colocacao}º Lugar
                                                                    </span>
                                                                </td>
                                                                <td className="px-8 py-6 font-black text-white">{row.Kill}</td>
                                                                <td className="px-8 py-6 text-purple-400 font-black">{row.Pontos_Total}</td>
                                                                <td className="px-8 py-6">
                                                                    {row.Booyah === 'SIM' ? (
                                                                        <div className="flex items-center gap-2 text-amber-500">
                                                                            <Trophy size={14} className="fill-amber-500" />
                                                                            <span className="text-[10px] font-black uppercase tracking-tighter">Victory</span>
                                                                        </div>
                                                                    ) : (
                                                                        <span className="text-white/5 text-lg">-</span>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            )}
                                        </div>
                                    </Card>
                                </div>
                            )}
                        </>
                    )}
                </main>
            </div>
        </div >
    );
};
