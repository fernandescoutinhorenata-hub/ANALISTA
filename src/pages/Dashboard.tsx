import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import {
    XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart, Bar,
    AreaChart, Area, Legend, RadarChart, PolarGrid,
    Radar, PolarAngleAxis
} from 'recharts';
import {
    Trophy, Target, Map, Zap, FileSpreadsheet, RefreshCcw,
    TrendingUp, LogOut, Users, Sword, ShieldAlert,
    Calendar, LayoutDashboard, Menu, ChevronRight, UserCircle2, PlusCircle,
    CheckCircle, XCircle, AlertCircle, Wallet, Link
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { DashboardData } from '../types';
import { processData } from '../utils/data-processing';
import { useAuth } from '../contexts/AuthContext';

// ─── SaaS Premium – Design Tokens ──────────────────────────────────────────
// BG_MAIN:   #0B0B0C  | BG_CARD:   #161618  | BORDER:    #2D2D30
// TEXT_PRI:  #FFFFFF  | TEXT_SEC:  #A1A1AA  | TEXT_TER:  #71717A
// PURPLE:    #A855F7  | GREEN:     #10B981  | GOLD:      #F59E0B
// RED:       #EF4444  | CYAN:      #A855F7
// ────────────────────────────────────────────────────────────────────────────

const S = {
    bgMain: { backgroundColor: '#0B0B0C' },
    bgCard: { backgroundColor: '#161618' },
    border: { border: '1px solid #2D2D30' },
    cardBox: { backgroundColor: '#161618', border: '1px solid #2D2D30', borderRadius: '12px', padding: '24px' },
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
        className="rounded-xl p-6 flex flex-col gap-4 transition-all duration-200 hover:border-[#A855F7]/50"
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

// ─── Tooltip customizado ──────────────────────────────────────────────────────
const neonTooltipStyle = {
    backgroundColor: '#1A1A1A',
    border: '1px solid #333333',
    borderRadius: '8px',
    color: '#FFFFFF',
    fontFamily: "'Inter', sans-serif",
    fontSize: '12px',
    padding: '12px',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
};

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
            background: rgba(139, 92, 246, 0.2);
            border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(139, 92, 246, 0.4);
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(5px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
            animation: fadeIn 0.4s ease-out forwards;
        }
        @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-3px); }
            100% { transform: translateY(0px); }
        }
        .antigravity {
            animation: float 2.5s ease-in-out infinite;
        }
    `}</style>
);

// ─── Toast Component ─────────────────────────────────────────────────────────
const Toast: React.FC<{ message: string; type: 'success' | 'error' | 'warning' }> = ({ message, type }) => {
    const config = {
        success: { bg: '#10B98110', border: '#10B98130', color: '#10B981', icon: CheckCircle },
        error: { bg: '#EF444410', border: '#EF444430', color: '#EF4444', icon: XCircle },
        warning: { bg: '#F59E0B10', border: '#F59E0B30', color: '#F59E0B', icon: AlertCircle },
    }[type];
    const Icon = config.icon;
    return (
        <div style={{
            position: 'fixed', top: '24px', right: '24px', zIndex: 9999,
            backgroundColor: '#161618', border: `1px solid ${config.border}`,
            borderRadius: '12px', padding: '14px 20px',
            display: 'flex', alignItems: 'center', gap: '10px',
            fontFamily: "'Inter', sans-serif", backdropFilter: 'blur(10px)',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
        }}>
            <Icon size={18} color={config.color} />
            <span style={{ color: '#FFFFFF', fontWeight: 600, fontSize: '13px' }}>{message}</span>
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#000000E0] backdrop-blur-md">
            <div
                className="w-full max-w-sm rounded-2xl p-8 relative animate-fade-in"
                style={{ backgroundColor: '#161618', border: '1px solid #2D2D30', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8)' }}
            >
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 rounded-lg hover:bg-[#2D2D30] transition-colors"
                >
                    <XCircle size={18} className="text-[#71717A]" />
                </button>

                <div className="text-center mb-8">
                    <div className="inline-flex p-4 rounded-2xl mb-4" style={{ backgroundColor: '#A855F710', color: '#A855F7' }}>
                        <FileSpreadsheet size={28} />
                    </div>
                    <h3 className="text-xl font-bold text-white">Importar Dados</h3>
                    <p className="text-[11px] mt-2" style={{ color: '#71717A' }}>Selecione o arquivo consolidado (.xlsx)</p>
                </div>

                <div className="space-y-5">
                    <div className="p-4 rounded-xl flex items-center justify-between" style={{ backgroundColor: '#0B0B0C', border: '1px solid #2D2D30' }}>
                        <div className="flex items-center gap-2">
                            <Wallet size={14} style={{ color: '#F59E0B' }} />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#71717A]">Custo fixo</span>
                        </div>
                        <span className="text-[10px] font-black text-[#EF4444]">1 CRÉDITO</span>
                    </div>

                    <label
                        className={`group flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        style={{ borderColor: '#2D2D30', backgroundColor: '#0B0B0C' }}
                    >
                        <FileSpreadsheet className="w-8 h-8 mb-2 text-[#2D2D30] group-hover:text-[#A855F7] transition-colors" />
                        <p className="text-[10px] text-[#71717A]">
                            <span className="font-bold text-[#A855F7]">Upload</span> ou arraste
                        </p>
                        <input type="file" className="hidden" accept=".xlsx" onChange={onUpload} disabled={loading} />
                    </label>

                    <button
                        onClick={onDownloadTemplate}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-[#2D2D30] text-white hover:bg-[#3D3D40] transition-all font-bold text-[10px] uppercase tracking-widest"
                    >
                        <FileSpreadsheet size={14} /> Baixar Modelo
                    </button>

                    {loading && (
                        <div className="flex flex-col items-center gap-2 animate-pulse text-[#A855F7] pt-2">
                            <RefreshCcw size={16} className="animate-spin" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Calculando...</span>
                        </div>
                    )}

                    <div className="pt-4 border-t border-[#2D2D30] text-center">
                        <p className="text-[9px] uppercase tracking-[0.2em] font-bold" style={{ color: '#71717A' }}>
                            Saldo: <span style={{ color: (creditos ?? 0) > 0 ? '#10B981' : '#EF4444' }}>{creditos ?? '0'} CRÉDITOS</span>
                        </p>
                    </div>
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
    const [timeFilter, setTimeFilter] = useState<'7d' | '30d' | 'all'>('all');
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

        const now = new Date();
        const timeLimit = timeFilter === '7d'
            ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            : timeFilter === '30d'
                ? new Date(now.getFullYear(), now.getMonth(), 1)
                : null;

        const isInTimeRange = (dateStr: string) => {
            if (!timeLimit || !dateStr) return true;
            const parts = dateStr.split('/');
            const parsed = parts.length === 3
                ? new Date(`${parts[2]}-${parts[1]}-${parts[0]}`)
                : new Date(dateStr);
            return !isNaN(parsed.getTime()) && parsed >= timeLimit;
        };

        const filteredGeneral = allGeneralRows.filter(row => {
            const matchDate = filters.date === 'Todos' || String(row.Data) === filters.date;
            const matchChamp = filters.championship === 'Todos' || String(row.Campeonato) === filters.championship;
            const matchTime = isInTimeRange(String(row.Data || ''));
            return matchDate && matchChamp && matchTime;
        });
        const filteredPlayers = allPlayerRows.filter(row => {
            const matchDate = filters.date === 'Todos' || String(row.Data) === filters.date;
            const matchTime = isInTimeRange(String(row.Data || ''));
            return matchDate && matchTime;
        });
        setData(processData(filteredGeneral, filteredPlayers));
    }, [filters, timeFilter, allGeneralRows, allPlayerRows]);

    // ─── Métricas derivadas de performance_jogadores ───────────────────────────
    const filteredPlayerRows = useMemo(() => {
        const now = new Date();
        const timeLimit = timeFilter === '7d'
            ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            : timeFilter === '30d'
                ? new Date(now.getFullYear(), now.getMonth(), 1)
                : null;

        return allPlayerRows.filter(row => {
            const matchDate = filters.date === 'Todos' || String(row.Data) === filters.date;
            if (!matchDate) return false;
            if (!timeLimit) return true;
            const dateStr = String(row.Data || '');
            const parts = dateStr.split('/');
            const parsed = parts.length === 3
                ? new Date(`${parts[2]}-${parts[1]}-${parts[0]}`)
                : new Date(dateStr);
            return !isNaN(parsed.getTime()) && parsed >= timeLimit;
        });
    }, [allPlayerRows, filters.date, timeFilter]);

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

    // Radar com 3 eixos semânticos: Agressividade, Sobrevivência, Suporte
    const radarData = useMemo(() => {
        if (!data || selectedPlayer === 'Todos' || playerChartData.length === 0) return [];
        const p = playerChartData[0];
        if (!p) return [];

        // Agressividade = kill/dano normalizado (0-10)
        const agressividade = Math.min(10,
            ((p.avgKills / 5) * 5) + ((p.avgDamage / 1500) * 5)
        ).toFixed(1);
        // Sobrevivência = inverso do KD (mortes) → alto KD = alta sobrevivência
        const sobrevivencia = Math.min(10, p.kd * 2.5).toFixed(1);
        // Suporte = assistências por jogo (0-10)
        const suporte = Math.min(10, p.avgAssists * 2.5).toFixed(1);

        return [
            { metric: 'Agressividade', value: parseFloat(agressividade), fullMark: 10 },
            { metric: 'Sobrevivência', value: parseFloat(sobrevivencia), fullMark: 10 },
            { metric: 'Suporte', value: parseFloat(suporte), fullMark: 10 },
        ];
    }, [playerChartData, selectedPlayer]);

    // Total de Kills somado de todos os jogadores (performance_jogadores)
    const totalKillsFromPlayers = useMemo(() =>
        filteredPlayerRows.reduce((sum, p) => sum + (Number(p.Kill) || 0), 0),
        [filteredPlayerRows]);

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

    const handleShareDashboard = () => {
        if (!user) return;
        const shareUrl = `${window.location.origin}/share/${user.id}`;
        navigator.clipboard.writeText(shareUrl).then(() => {
            showToast('✅ Link copiado! Envie para o seu squad.', 'success');
        }).catch(() => {
            showToast('Erro ao copiar link.', 'error');
        });
    };

    // ── Layout ───────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen flex" style={{ ...S.bgMain, fontFamily: "'Inter', sans-serif", color: '#FFFFFF' }}>
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

            {/* Overlay para Mobile quando a sidebar estiver aberta */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* ── Sidebar ── */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-64 flex flex-col transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0`}
                style={{ backgroundColor: '#0B0B0C', borderRight: '1px solid #2D2D30' }}
            >
                <div
                    className="flex justify-center cursor-pointer transition-all duration-300 group px-6 py-10"
                    onClick={() => navigate('/')}
                >
                    <div className="relative">
                        <img
                            src="/image_10.png"
                            alt="Logo Celo Tracker"
                            className="w-auto object-contain h-24 md:h-32 relative z-10 transition-all duration-500 group-hover:scale-105"
                            style={{ imageRendering: 'high-quality' as any }}
                        />
                        <div className="absolute inset-0 bg-[#A855F7] blur-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 rounded-full" />
                    </div>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-4 space-y-2">
                    {[
                        { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
                        { id: 'players', label: 'Contas', icon: Users },
                        { id: 'history', label: 'Análise', icon: FileSpreadsheet },
                    ].map(item => {
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-semibold text-sm group"
                                style={{
                                    backgroundColor: isActive ? '#A855F7' : 'transparent',
                                    color: isActive ? '#FFFFFF' : '#71717A',
                                }}
                            >
                                <item.icon size={18} className={`transition-colors ${isActive ? 'text-white' : 'group-hover:text-white'}`} />
                                {item.label}
                            </button>
                        );
                    })}

                    <div className="pt-4 mt-4 border-t border-[#2D2D30]">
                        <button
                            onClick={() => navigate('/input')}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all font-bold text-sm"
                            style={{ backgroundColor: '#A855F7', color: '#FFFFFF', boxShadow: '0 4px 14px 0 rgba(139, 92, 246, 0.3)' }}
                        >
                            <PlusCircle size={18} />
                            Inserir Dados
                        </button>
                    </div>
                </nav>

                {/* Sidebar Footer */}
                <div className="p-4 space-y-1 border-t border-[#2D2D30]">
                    <a
                        href="https://wa.me/13981630304"
                        target="_blank"
                        rel="noreferrer"
                        className="w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all font-semibold text-xs antigravity"
                        style={{ color: '#A855F7', backgroundColor: '#161618', border: '1px solid #2D2D30' }}
                        onMouseEnter={e => {
                            e.currentTarget.style.backgroundColor = '#A855F710';
                            e.currentTarget.style.borderColor = '#A855F740';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.backgroundColor = '#161618';
                            e.currentTarget.style.borderColor = '#2D2D30';
                        }}
                    >
                        <span className="flex items-center gap-2">
                            <AlertCircle size={16} /> Suporte Técnico
                        </span>
                        <ChevronRight size={12} />
                    </a>
                    <button
                        onClick={() => signOut()}
                        className="w-full flex items-center gap-2 px-4 py-3 rounded-lg transition-all font-semibold text-xs hover:bg-[#EF444410]"
                        style={{ color: '#EF4444' }}
                    >
                        <LogOut size={16} /> Sair da Conta
                    </button>
                    <div className="pt-4 text-center">
                        <p className="text-[10px] font-medium tracking-widest uppercase" style={{ color: '#71717A' }}>
                            Created by <span style={{ color: '#A855F7' }}>@CeloCoach</span>
                        </p>
                    </div>
                </div>
            </aside>

            {/* ── Content ── */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#0B0B0C]">

                {/* 🚀 Beta Banner */}
                <div className="py-2 px-4 text-center text-[10px] font-bold tracking-[0.1em] uppercase border-b border-[#2D2D30]" style={{ backgroundColor: '#161618', color: '#FFFFFF' }}>
                    <span className="opacity-50 mr-2">Status:</span>
                    <span className="text-[#A855F7] mr-4">v2.0 Beta Protocol</span>
                    <span className="opacity-50 mr-2">Feedback:</span>
                    <a href="https://instagram.com/celocoach" target="_blank" rel="noreferrer" className="text-[#A855F7] hover:text-white transition-colors">
                        @CeloCoach
                    </a>
                </div>

                {/* Header / Top Bar */}
                <header
                    className="h-20 flex items-center justify-between px-8 z-40 backdrop-blur-md sticky top-0"
                    style={{ backgroundColor: '#0B0B0CEE', borderBottom: '1px solid #2D2D30' }}
                >
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:hidden p-2 rounded-lg bg-[#161618] border border-[#2D2D30] text-[#71717A]">
                            <Menu size={20} />
                        </button>
                        <div className="hidden md:flex items-center text-xs font-bold uppercase tracking-wider text-[#71717A]">
                            <LayoutDashboard size={14} className="mr-2" />
                            <span>Controle</span>
                            <ChevronRight size={14} className="mx-2 opacity-50" />
                            <span style={{ color: '#A855F7' }}>
                                {activeTab === 'overview' ? 'Visão Geral' : activeTab === 'players' ? 'Jogadores' : 'Histórico'}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* ── Filtros de Tempo Rápido (Tabs) ── */}
                        <div className="hidden lg:flex items-center gap-1 p-1 rounded-lg" style={{ backgroundColor: '#161618', border: '1px solid #2D2D30' }}>
                            {([{ id: '7d', label: '7 dias' }, { id: '30d', label: 'Este Mês' }, { id: 'all', label: 'Todos' }] as const).map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => setTimeFilter(t.id)}
                                    className="px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all"
                                    style={{
                                        backgroundColor: timeFilter === t.id ? '#A855F7' : 'transparent',
                                        color: timeFilter === t.id ? '#FFFFFF' : '#71717A',
                                    }}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>

                        {/* Filtros por Data / Campeonato */}
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

                        {/* Profile & Wallet */}
                        <div className="flex items-center gap-4 pl-4 border-l border-[#2D2D30]">
                            <div className="hidden sm:flex flex-col text-right">
                                <span className="text-[10px] font-bold text-[#71717A] uppercase tracking-widest">{nomeUsuario || 'Analista'}</span>
                                <span className="text-xs font-bold text-white leading-none mt-0.5">Créditos: {creditos ?? '...'}</span>
                            </div>
                            <button
                                onClick={handleShareDashboard}
                                className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg bg-[#161618] border border-[#2D2D30] text-[#A1A1AA] hover:text-[#A855F7] transition-all font-bold text-[10px] uppercase tracking-widest"
                                title="Compartilhar Dashboard"
                            >
                                <Link size={14} />
                                Link para Players
                            </button>
                            {/* Mobile version simple icon */}
                            <button
                                onClick={handleShareDashboard}
                                className="md:hidden p-2.5 rounded-lg bg-[#161618] border border-[#2D2D30] text-[#A1A1AA] hover:text-[#A855F7] transition-colors"
                            >
                                <Link size={18} />
                            </button>
                            <button
                                onClick={() => setIsImportModalOpen(true)}
                                className="p-2.5 rounded-lg bg-[#161618] border border-[#2D2D30] text-[#A1A1AA] hover:text-white transition-colors"
                            >
                                <FileSpreadsheet size={18} />
                            </button>
                            <div
                                className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs shadow-sm"
                                style={{ backgroundColor: '#A855F7', color: '#FFFFFF' }}
                            >
                                {(nomeUsuario || user?.email || 'A')[0].toUpperCase()}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Scrollable Content */}
                <main className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">

                    {isDashboardLoading ? (
                        <div className="h-full w-full flex flex-col items-center justify-center space-y-6">
                            <div className="w-12 h-12 rounded-lg border-2 border-[#A855F7]/20 border-t-[#A855F7] animate-spin" />
                            <p className="text-[10px] font-bold tracking-[0.3em] text-[#71717A] uppercase">Initializing Data</p>
                        </div>
                    ) : fetchError ? (
                        <div className="h-full flex flex-col items-center justify-center p-12 text-center bg-[#161618] rounded-xl border border-[#2D2D30]">
                            <div className="p-5 rounded-xl bg-[#EF444408] border border-[#EF444420] mb-6">
                                <AlertCircle size={40} className="text-[#EF4444]" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Sync Failure</h3>
                            <p className="max-w-xs text-sm text-[#71717A] mb-8">{fetchError}</p>
                            <button
                                onClick={() => window.location.reload()}
                                className="px-6 py-3 rounded-lg bg-white text-black font-bold text-xs hover:bg-[#A1A1AA] transition-colors"
                            >
                                Reconnect System
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* ══════════ OVERVIEW TAB ══════════ */}
                            {activeTab === 'overview' && (
                                <div className="space-y-6">
                                    {/* ── Empty State ── */}
                                    {!data && (
                                        <div className="flex flex-col items-center justify-center py-20 text-center bg-[#161618] rounded-xl border border-[#2D2D30] border-dashed">
                                            <div className="p-6 rounded-2xl mb-6" style={{ backgroundColor: '#A855F708', border: '1px solid #A855F715' }}>
                                                <FileSpreadsheet size={40} style={{ color: '#A855F7' }} />
                                            </div>
                                            <h3 className="text-xl font-bold text-white mb-2">Protocolo de Dados Inativo</h3>
                                            <p className="max-w-xs text-xs px-4" style={{ color: '#71717A', lineHeight: '1.6' }}>
                                                Nenhum dado detectado no sistema. Por favor, inicialize o banco de dados via importação (.xlsx) ou registro manual.
                                            </p>
                                            <button
                                                onClick={() => setIsImportModalOpen(true)}
                                                className="mt-8 flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-xs transition-all hover:scale-105"
                                                style={{ backgroundColor: '#A855F7', color: '#FFFFFF' }}
                                            >
                                                <PlusCircle size={16} /> Inicializar Sistema
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
                                    {data && (
                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                                            {/* Area Chart – Tendência de Performance */}
                                            <Card className="lg:col-span-2">
                                                <div className="flex items-center justify-between mb-8">
                                                    <div>
                                                        <h4 className="text-sm font-bold uppercase tracking-widest" style={{ color: '#FFFFFF' }}>Fluxo de Performance</h4>
                                                        <p className="text-[11px] mt-1" style={{ color: '#71717A' }}>Consolidado de Kills / Partida</p>
                                                    </div>
                                                    <div className="p-2.5 rounded-lg" style={{ backgroundColor: '#A855F710', color: '#A855F7' }}>
                                                        <TrendingUp size={16} />
                                                    </div>
                                                </div>
                                                <div className="h-72">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <AreaChart data={trendChartData}>
                                                            <defs>
                                                                <linearGradient id="colorKillsNeon" x1="0" y1="0" x2="0" y2="1">
                                                                    <stop offset="5%" stopColor="#A855F7" stopOpacity={0.15} />
                                                                    <stop offset="95%" stopColor="#A855F7" stopOpacity={0} />
                                                                </linearGradient>
                                                            </defs>
                                                            <XAxis
                                                                dataKey="Data"
                                                                stroke="#2D2D30"
                                                                tickLine={false}
                                                                axisLine={false}
                                                                tick={{ fontSize: 10, fill: '#71717A', fontWeight: 500 }}
                                                                dy={10}
                                                            />
                                                            <YAxis
                                                                stroke="#2D2D30"
                                                                tickLine={false}
                                                                axisLine={false}
                                                                tick={{ fontSize: 10, fill: '#71717A', fontWeight: 500 }}
                                                            />
                                                            <Tooltip contentStyle={neonTooltipStyle} itemStyle={{ color: '#FFFFFF' }} cursor={{ stroke: '#2D2D30', strokeWidth: 1 }} />
                                                            <Area
                                                                type="monotone"
                                                                dataKey="Kill"
                                                                stroke="#A855F7"
                                                                strokeWidth={2}
                                                                fillOpacity={1}
                                                                fill="url(#colorKillsNeon)"
                                                            />
                                                        </AreaChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </Card>

                                            {/* Pie Chart */}
                                            <Card>
                                                <div className="flex items-center justify-between mb-8">
                                                    <div>
                                                        <h4 className="text-sm font-bold uppercase tracking-widest" style={{ color: '#FFFFFF' }}>Domínio de Terreno</h4>
                                                        <p className="text-[11px] mt-1" style={{ color: '#71717A' }}>Distribuição de Pontos</p>
                                                    </div>
                                                    <div className="p-2.5 rounded-lg" style={{ backgroundColor: '#A855F710', color: '#A855F7' }}>
                                                        <Map size={16} />
                                                    </div>
                                                </div>
                                                <div className="h-72">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <PieChart>
                                                            <Pie
                                                                data={data?.byMap || []}
                                                                cx="50%" cy="45%"
                                                                innerRadius={60} outerRadius={85}
                                                                startAngle={90} endAngle={-270}
                                                                dataKey="totalPontos" nameKey="mapa" paddingAngle={4}
                                                                stroke="none"
                                                            >
                                                                {(data?.byMap || []).map((_: any, index: number) => (
                                                                    <Cell key={`cell-${index}`} fill={['#A855F7', '#A855F7', '#10B981', '#F59E0B', '#EF4444'][index % 5]} />
                                                                ))}
                                                            </Pie>
                                                            <Tooltip contentStyle={neonTooltipStyle} itemStyle={{ color: '#FFFFFF' }} />
                                                            <Legend
                                                                verticalAlign="bottom"
                                                                height={40}
                                                                iconType="circle"
                                                                iconSize={6}
                                                                formatter={(value) => (
                                                                    <span style={{ color: '#71717A', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{value}</span>
                                                                )}
                                                            />
                                                        </PieChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </Card>
                                        </div>
                                    )}

                                    {/* MVP Cards — exibidos quando há dados em performance_jogadores */}
                                    {filteredPlayerRows.length > 0 && data && (
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                            {/* MVP da Última Partida */}
                                            <div
                                                className="rounded-2xl p-6 transition-all hover:scale-[1.02] duration-300 relative overflow-hidden"
                                                style={{
                                                    background: 'linear-gradient(135deg, #BEF26415 0%, #161B28 75%)',
                                                    border: '1px solid #BEF26430',
                                                }}
                                            >
                                                <div className="absolute -right-4 -top-4 opacity-10">
                                                    <Trophy size={100} color="#BEF264" />
                                                </div>
                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 text-[#BEF264]">
                                                    Destaque da Última Partida
                                                </p>
                                                <h4 className="text-2xl font-black text-white uppercase tracking-tighter">
                                                    {data.playerMetrics.lastMatchMVP?.player || 'Aguardando...'}
                                                </h4>
                                                <div className="mt-6 flex flex-col gap-1">
                                                    <span className="text-[9px] font-bold text-[#71717A] uppercase tracking-widest">Score de Combate</span>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-4xl font-black text-[#BEF264]">
                                                            {data.playerMetrics.lastMatchMVP?.score || 0}
                                                        </span>
                                                        <div className="px-2 py-1 rounded bg-[#BEF26410] border border-[#BEF26420]">
                                                            <span className="text-[10px] font-black text-[#BEF264]">MVP</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Performance de Squad (Média) */}
                                            <Card className="md:col-span-2">
                                                <div className="flex items-center justify-between mb-8">
                                                    <div>
                                                        <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white">Médias do Squad (Time)</h4>
                                                        <p className="text-[11px] mt-1 text-[#71717A]">Análise consolidada por queda</p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#A855F710] border border-[#A855F720]">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-[#A855F7]" />
                                                            <span className="text-[9px] font-bold text-white uppercase">Dano</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#BEF26410] border border-[#BEF26420]">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-[#BEF264]" />
                                                            <span className="text-[9px] font-bold text-white uppercase">Abates</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-3 gap-6">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-[9px] font-bold text-[#71717A] uppercase tracking-widest">Dano Médio</span>
                                                        <span className="text-2xl font-black text-[#A855F7]">{data.squadMetrics.avgDamage}</span>
                                                        <div className="w-full h-1 bg-[#2D2D30] rounded-full overflow-hidden mt-1">
                                                            <div className="h-full bg-[#A855F7]" style={{ width: `${Math.min(100, (data.squadMetrics.avgDamage / 2500) * 100)}%` }} />
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-[9px] font-bold text-[#71717A] uppercase tracking-widest">Kills Squad</span>
                                                        <span className="text-2xl font-black text-[#BEF264]">{data.squadMetrics.totalKills}</span>
                                                        <div className="w-full h-1 bg-[#2D2D30] rounded-full overflow-hidden mt-1">
                                                            <div className="h-full bg-[#BEF264]" style={{ width: `${Math.min(100, (data.squadMetrics.totalKills / 40) * 100)}%` }} />
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-[9px] font-bold text-[#71717A] uppercase tracking-widest">Sobrevivência</span>
                                                        <span className="text-2xl font-black text-white">{data.squadMetrics.survivalRate}<span className="text-[10px] text-[#71717A] ml-1">mortes/jogo</span></span>
                                                        <div className="w-full h-1 bg-[#2D2D30] rounded-full overflow-hidden mt-1">
                                                            <div className="h-full bg-blue-500" style={{ width: `${Math.max(10, 100 - (data.squadMetrics.survivalRate * 20))}%` }} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </Card>
                                        </div>
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
                                                <Card>
                                                    <div className="flex items-center justify-between mb-8">
                                                        <div>
                                                            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: '#FFFFFF' }}>Média de Abates</h4>
                                                            <p className="text-[11px] mt-1" style={{ color: '#71717A' }}>Performance Consolidada</p>
                                                        </div>
                                                        <div className="p-2.5 rounded-lg" style={{ backgroundColor: '#EF444410', color: '#EF4444' }}>
                                                            <Sword size={16} />
                                                        </div>
                                                    </div>
                                                    <div className="h-56">
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <BarChart data={playerChartData} layout="vertical" margin={{ left: -20 }}>
                                                                <XAxis type="number" hide />
                                                                <YAxis type="category" dataKey="name" stroke="#71717A" tickLine={false} axisLine={false} fontSize={10} width={80} tick={{ fill: '#A1A1AA', fontWeight: 600 }} />
                                                                <Tooltip contentStyle={neonTooltipStyle} itemStyle={{ color: '#FFFFFF' }} cursor={false} />
                                                                <Bar dataKey="avgKills" fill="#EF4444" radius={[0, 4, 4, 0]} barSize={12} />
                                                            </BarChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                </Card>

                                                <Card>
                                                    <div className="flex items-center justify-between mb-8">
                                                        <div>
                                                            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: '#FFFFFF' }}>Média de Dano</h4>
                                                            <p className="text-[11px] mt-1" style={{ color: '#71717A' }}>Impacto em Combate</p>
                                                        </div>
                                                        <div className="p-2.5 rounded-lg" style={{ backgroundColor: '#A855F710', color: '#A855F7' }}>
                                                            <ShieldAlert size={16} />
                                                        </div>
                                                    </div>
                                                    <div className="h-56">
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <BarChart data={playerChartData} layout="vertical" margin={{ left: -20 }}>
                                                                <XAxis type="number" hide />
                                                                <YAxis type="category" dataKey="name" stroke="#71717A" tickLine={false} axisLine={false} fontSize={10} width={80} tick={{ fill: '#A1A1AA', fontWeight: 600 }} />
                                                                <Tooltip contentStyle={neonTooltipStyle} itemStyle={{ color: '#FFFFFF' }} cursor={false} />
                                                                <Bar dataKey="avgDamage" fill="#A855F7" radius={[0, 4, 4, 0]} barSize={12} />
                                                            </BarChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                </Card>

                                                <Card>
                                                    <div className="flex items-center justify-between mb-8">
                                                        <div>
                                                            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: '#FFFFFF' }}>Média de Apoio</h4>
                                                            <p className="text-[11px] mt-1" style={{ color: '#71717A' }}>Assistências por Jogo</p>
                                                        </div>
                                                        <div className="p-2.5 rounded-lg" style={{ backgroundColor: '#A855F710', color: '#A855F7' }}>
                                                            <Target size={16} />
                                                        </div>
                                                    </div>
                                                    <div className="h-56">
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <BarChart data={playerChartData} layout="vertical" margin={{ left: -20 }}>
                                                                <XAxis type="number" hide />
                                                                <YAxis type="category" dataKey="name" stroke="#71717A" tickLine={false} axisLine={false} fontSize={10} width={80} tick={{ fill: '#A1A1AA', fontWeight: 600 }} />
                                                                <Tooltip contentStyle={neonTooltipStyle} itemStyle={{ color: '#FFFFFF' }} cursor={false} />
                                                                <Bar dataKey="avgAssists" fill="#A855F7" radius={[0, 4, 4, 0]} barSize={12} />
                                                            </BarChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                </Card>
                                            </div>

                                            {selectedPlayer !== 'Todos' && radarData.length > 0 && (
                                                <Card>
                                                    <div className="flex items-center gap-3 mb-6">
                                                        <div
                                                            className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-base shadow-lg"
                                                            style={{ background: 'linear-gradient(135deg, #A855F7, #10B981)', color: '#FFFFFF' }}
                                                        >
                                                            {selectedPlayer[0]}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-lg" style={{ color: '#FFFFFF' }}>{selectedPlayer} — Perfil de Combate</h4>
                                                            <p className="text-[11px]" style={{ color: '#71717A' }}>Análise por eixos: Agressividade · Sobrevivência · Suporte</p>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                                                        {/* Radar Chart com 3 eixos semânticos */}
                                                        <div className="h-64">
                                                            <ResponsiveContainer width="100%" height="100%">
                                                                <RadarChart data={radarData}>
                                                                    <PolarGrid stroke="#2D2D30" strokeDasharray="3 3" />
                                                                    <PolarAngleAxis
                                                                        dataKey="metric"
                                                                        tick={{ fontSize: 11, fill: '#A1A1AA', fontFamily: 'Inter, sans-serif', fontWeight: 700 }}
                                                                    />
                                                                    <Radar
                                                                        name={selectedPlayer}
                                                                        dataKey="value"
                                                                        stroke="#A855F7"
                                                                        fill="#A855F7"
                                                                        fillOpacity={0.25}
                                                                        strokeWidth={2}
                                                                        dot={{ fill: '#A855F7', r: 4, strokeWidth: 0 }}
                                                                    />
                                                                    <Tooltip contentStyle={neonTooltipStyle} itemStyle={{ color: '#FFFFFF' }} formatter={(v: any) => [`${v} / 10`, 'Score']} />
                                                                </RadarChart>
                                                            </ResponsiveContainer>
                                                        </div>
                                                        <div className="grid grid-cols-1 gap-3">
                                                            {radarData.map((stat, i) => {
                                                                const colors = ['#EF4444', '#10B981', '#A855F7'];
                                                                const color = colors[i % 3];
                                                                const pct = Math.min(100, (stat.value / 10) * 100);
                                                                return (
                                                                    <div key={i} className="p-4 rounded-xl" style={{ backgroundColor: `${color}0D`, border: `1px solid ${color}25` }}>
                                                                        <div className="flex items-center justify-between mb-2">
                                                                            <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#A1A1AA' }}>{stat.metric}</span>
                                                                            <span className="text-lg font-black" style={{ color }}>{stat.value}<span className="text-[10px] ml-0.5 opacity-60">/10</span></span>
                                                                        </div>
                                                                        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#2D2D30' }}>
                                                                            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                            {playerChartData[0] && (
                                                                <div className="grid grid-cols-2 gap-2 mt-1">
                                                                    {[
                                                                        { label: 'Avg Kills', val: playerChartData[0].avgKills, color: '#EF4444' },
                                                                        { label: 'Avg Dano', val: playerChartData[0].avgDamage.toLocaleString(), color: '#A855F7' },
                                                                        { label: 'Avg Assists', val: playerChartData[0].avgAssists, color: '#10B981' },
                                                                        { label: 'K/D', val: playerChartData[0].kd, color: '#F59E0B' },
                                                                    ].map((s, i) => (
                                                                        <div key={i} className="p-3 rounded-lg" style={{ backgroundColor: '#161618', border: '1px solid #2D2D30' }}>
                                                                            <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: '#71717A' }}>{s.label}</p>
                                                                            <p className="text-base font-black mt-0.5" style={{ color: s.color }}>{s.val}</p>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </Card>
                                            )}

                                            <Card className="overflow-hidden !p-0">
                                                <div className="flex items-center justify-between p-6 pb-2">
                                                    <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2" style={{ color: '#FFFFFF' }}>
                                                        <Users size={14} style={{ color: '#A855F7' }} /> Classificação de Elite
                                                    </h4>
                                                </div>
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-xs text-left" style={{ color: '#A1A1AA' }}>
                                                        <thead>
                                                            <tr style={{ borderBottom: '1px solid #2D2D30' }}>
                                                                {['Jogador', 'Kills', 'Dano', 'Score'].map((h, i) => (
                                                                    <th key={i} className={`px-6 py-4 font-bold uppercase tracking-widest text-[9px] ${i > 0 ? 'text-right' : ''}`} style={{ color: '#71717A' }}>{h}</th>
                                                                ))}
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {(selectedPlayer === 'Todos'
                                                                ? filteredPlayerRows
                                                                : filteredPlayerRows.filter((p: any) => p.Player === selectedPlayer))
                                                                .sort((a: any, b: any) => b.Kill - a.Kill)
                                                                .slice(0, 10)
                                                                .map((p: any, idx: number) => (
                                                                    <tr
                                                                        key={idx}
                                                                        className="hover:bg-white/[0.02] transition-colors"
                                                                        style={{ borderBottom: '1px solid #2D2D30' }}
                                                                    >
                                                                        <td className="px-6 py-4 font-bold text-white uppercase tracking-tighter">
                                                                            {p.Player}
                                                                        </td>
                                                                        <td className="px-6 py-4 text-right font-mono text-[#EF4444]">
                                                                            {p.Kill}
                                                                        </td>
                                                                        <td className="px-6 py-4 text-right font-mono text-[#A855F7]">
                                                                            {p.Dano?.toLocaleString()}
                                                                        </td>
                                                                        <td className="px-6 py-4 text-right">
                                                                            <span className="px-2 py-1 rounded bg-[#F59E0B10] text-[#F59E0B] text-[10px] font-bold">
                                                                                {(p.Kill * 10).toFixed(0)}
                                                                            </span>
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
                                <Card className="overflow-hidden !p-0">
                                    <div className="flex items-center justify-between p-6 pb-2">
                                        <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2" style={{ color: '#FFFFFF' }}>
                                            <FileSpreadsheet size={14} style={{ color: '#A855F7' }} /> Cronologia de Missões
                                        </h4>
                                    </div>
                                    <div className="overflow-x-auto relative">
                                        {!data || data.rawData.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center p-16 text-[#71717A]">
                                                <AlertCircle size={32} className="mb-4 opacity-10" />
                                                <p className="text-[10px] font-bold uppercase tracking-[0.2em]">Data stream empty</p>
                                            </div>
                                        ) : (
                                            <table className="w-full text-xs text-left" style={{ color: '#A1A1AA' }}>
                                                <thead>
                                                    <tr style={{ borderBottom: '1px solid #2D2D30' }}>
                                                        {['Rodada', 'Mapa', 'Rank', 'Abates', 'Total', 'Booyah'].map((h, i) => (
                                                            <th key={i} className={`px-6 py-4 font-bold uppercase tracking-widest text-[9px] ${i > 2 ? 'text-right' : ''}`} style={{ color: '#71717A' }}>{h}</th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {data.rawData.map((row: any, index: number) => (
                                                        <tr
                                                            key={index}
                                                            className="hover:bg-white/[0.02] transition-colors"
                                                            style={{ borderBottom: '1px solid #2D2D30' }}
                                                        >
                                                            <td className="px-6 py-4 font-bold text-[#71717A]">
                                                                #{String(row.Rodada).padStart(2, '0')}
                                                            </td>
                                                            <td className="px-6 py-4 font-bold text-white uppercase tracking-wider">
                                                                {row.Mapa}
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span
                                                                    className="px-2 py-1 rounded-md text-[10px] font-bold"
                                                                    style={row.Colocacao === 1
                                                                        ? { backgroundColor: '#F59E0B15', color: '#F59E0B' }
                                                                        : { backgroundColor: '#2D2D30', color: '#71717A' }
                                                                    }
                                                                >
                                                                    P{row.Colocacao}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 text-right font-mono text-[#EF4444]">
                                                                {row.Kill}
                                                            </td>
                                                            <td className="px-6 py-4 text-right font-mono text-white">
                                                                {row.Pontos_Total}
                                                            </td>
                                                            <td className="px-6 py-4 text-right">
                                                                {row.Booyah === 'SIM' ? (
                                                                    <div className="flex justify-end">
                                                                        <div className="w-5 h-5 rounded-md bg-[#F59E0B] flex items-center justify-center shadow-[0_0_10px_rgba(245,158,11,0.3)]">
                                                                            <Trophy size={10} className="text-white" />
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-[#2D2D30]">--</span>
                                                                )}
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
        </div>
    );
};
