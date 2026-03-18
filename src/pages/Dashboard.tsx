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
import { PainelDeConquistas } from '../components/PainelDeConquistas';

// ─── Componentes de UI (Design System) ──────────────────────────────────────────
const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <div className={`card p-6 relative overflow-hidden ${className}`}>
        {children}
    </div>
);

const MetricCard: React.FC<{
    title: string;
    value: string | number;
    subValue?: string;
    icon: any;
    accentColor?: string; // Mantido para compatibilidade, mas o estilo vem do CSS
}> = ({ title, value, subValue, icon: Icon }) => (
    <div className="card-metric flex flex-col gap-4">
        <div className="flex justify-between items-start">
            <div className="p-2.5 rounded-xl bg-[var(--accent-muted)] text-[var(--accent)]">
                <Icon size={20} />
            </div>
            {subValue && (
                <span className="badge badge-purple">
                    {subValue}
                </span>
            )}
        </div>
        <div>
            <h3 className="text-metric">
                {value}
            </h3>
            <p className="text-label mt-2">
                {title}
            </p>
        </div>
    </div>
);

const neonTooltipStyle = {
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-primary)',
    fontFamily: 'Inter, sans-serif',
    fontSize: '12px',
    padding: '12px 16px',
    boxShadow: 'var(--shadow-elevated)',
};


// ─── Toast Component ─────────────────────────────────────────────────────────
const Toast: React.FC<{ message: string; type: 'success' | 'error' | 'warning' }> = ({ message, type }) => {
    const config = {
        success: { badge: 'badge-green', icon: CheckCircle },
        error: { badge: 'badge-red', icon: XCircle },
        warning: { badge: 'badge-amber', icon: AlertCircle },
    }[type];
    const Icon = config.icon;
    return (
        <div className={`fixed top-6 right-6 z-[9999] card p-4 flex items-center gap-3 animate-fade-in`}>
            <div className={`badge ${config.badge}`}>
                <Icon size={14} />
            </div>
            <span className="text-heading">{message}</span>
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="card w-full max-w-sm p-8 relative animate-reveal">
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 rounded-lg hover:bg-[var(--bg-hover)] transition-colors text-[var(--text-tertiary)]"
                >
                    <XCircle size={18} />
                </button>

                <div className="text-center mb-8">
                    <div className="inline-flex p-4 rounded-2xl mb-4 bg-[var(--accent-muted)] text-[var(--accent)]">
                        <FileSpreadsheet size={28} />
                    </div>
                    <h3 className="text-heading text-lg">Importar Dados</h3>
                    <p className="text-label mt-2">Selecione o arquivo consolidado (.xlsx)</p>
                </div>

                <div className="space-y-5">
                    <div className="p-4 rounded-xl flex items-center justify-between bg-[var(--bg-surface)] border border-[var(--border-default)]">
                        <div className="flex items-center gap-2">
                            <Wallet size={14} className="text-[var(--accent-amber)]" />
                            <span className="text-label">Custo fixo</span>
                        </div>
                        <span className="badge badge-red">1 CRÉDITO</span>
                    </div>

                    <label
                        className={`group flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300 bg-[var(--bg-surface)] border-[var(--border-default)] hover:border-[var(--accent)] ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <FileSpreadsheet className="w-8 h-8 mb-2 text-[var(--text-tertiary)] group-hover:text-[var(--accent)] transition-colors" />
                        <p className="text-label">
                            <span className="text-[var(--accent)]">Upload</span> ou arraste
                        </p>
                        <input type="file" className="hidden" accept=".xlsx" onChange={onUpload} disabled={loading} />
                    </label>

                    <button
                        onClick={onDownloadTemplate}
                        className="btn-ghost w-full flex items-center justify-center gap-2"
                    >
                        <FileSpreadsheet size={14} /> Baixar Modelo
                    </button>

                    {loading && (
                        <div className="flex flex-col items-center gap-2 animate-pulse text-[var(--accent)] pt-2">
                            <RefreshCcw size={16} className="animate-spin" />
                            <span className="text-label">Calculando...</span>
                        </div>
                    )}

                    <div className="pt-4 border-t border-[var(--border-subtle)] text-center">
                        <p className="text-label">
                            Saldo: <span className={(creditos ?? 0) > 0 ? 'text-[var(--accent-green)]' : 'text-[var(--accent-red)]'}>{creditos ?? '0'} CRÉDITOS</span>
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
        if (allGeneralRows.length === 0 && allPlayerRows.length === 0) {
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
        interface PlayerAgg { name: string; kills: number; damage: number; assists: number; deaths: number; derrubados: number; ressurgimentos: number; games: number; }
        const agg: Record<string, PlayerAgg> = {};
        const rows = selectedPlayer === 'Todos'
            ? filteredPlayerRows
            : filteredPlayerRows.filter((p: any) => p.Player === selectedPlayer);
        rows.forEach((p: any) => {
            if (!p.Player) return;
            if (!agg[p.Player]) agg[p.Player] = { name: p.Player, kills: 0, damage: 0, assists: 0, deaths: 0, derrubados: 0, ressurgimentos: 0, games: 0 };
            agg[p.Player].kills += Number(p.Kill) || 0;
            agg[p.Player].damage += Number(p['Dano causado']) || 0;
            agg[p.Player].assists += Number(p.Assistencia) || 0;
            agg[p.Player].deaths += Number(p.Morte) || 0;
            agg[p.Player].derrubados += Number(p['Derrubados']) || 0;
            agg[p.Player].ressurgimentos += Number(p['Ressurgimento']) || 0;
            agg[p.Player].games += 1;
        });
        return Object.values(agg)
            .map((p: PlayerAgg) => ({
                name: p.name,
                avgKills: p.games > 0 ? parseFloat((p.kills / p.games).toFixed(1)) : 0,
                avgDamage: p.games > 0 ? parseFloat((p.damage / p.games).toFixed(1)) : 0,
                avgAssists: p.games > 0 ? parseFloat((p.assists / p.games).toFixed(1)) : 0,
                avgDerrubados: p.games > 0 ? parseFloat((p.derrubados / p.games).toFixed(1)) : 0,
                avgDeaths: p.games > 0 ? parseFloat((p.deaths / p.games).toFixed(1)) : 0,
                avgRessurgimentos: p.games > 0 ? parseFloat((p.ressurgimentos / p.games).toFixed(1)) : 0,
                totalKills: p.kills,
                totalDamage: p.damage,
                totalDerrubados: p.derrubados,
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

        return [
            { subject: 'Abates', value: p.avgKills },
            { subject: 'Dano', value: parseFloat((p.avgDamage / 1000).toFixed(1)) },
            { subject: 'Assistências', value: p.avgAssists },
            { subject: 'Sobrevivência', value: Math.max(0, parseFloat((10 - (p.avgDeaths || 0)).toFixed(1))) },
            { subject: 'Suporte', value: p.avgRessurgimentos },
            { subject: 'Derrubadas', value: p.avgDerrubados },
        ];
    }, [playerChartData, selectedPlayer, data]);

    // Total de Kills somado de todos os jogadores (performance_jogadores)
    const totalKillsFromPlayers = useMemo(() =>
        filteredPlayerRows.reduce((sum, p) => sum + (Number(p.Kill) || 0), 0),
        [filteredPlayerRows]);

    // Métricas de Derrubados
    const totalDerrubados = useMemo(() =>
        filteredPlayerRows.reduce((sum, p) => sum + (Number(p['Derrubados']) || 0), 0),
        [filteredPlayerRows]);

    const mediaDerrubados = useMemo(() => {
        const rows = selectedPlayer === 'Todos'
            ? filteredPlayerRows
            : filteredPlayerRows.filter((p: any) => p.Player === selectedPlayer);
        const partidas = new Set(rows.map((p: any) => `${p.Data}-${p.Mapa}`)).size || 1;
        const total = rows.reduce((sum, p) => sum + (Number(p['Derrubados']) || 0), 0);
        return parseFloat((total / partidas).toFixed(2));
    }, [filteredPlayerRows, selectedPlayer]);

    // Gráfico de Tendência: kills totais de todos os jogadores agrupadas por data
    const trendChartData = useMemo(() => {
        if (filteredPlayerRows.length === 0) return [];
        const byDate: Record<string, number> = {};
        filteredPlayerRows.forEach(p => {
            const d = String(p.Data || '');
            if (d) byDate[d] = (byDate[d] || 0) + (Number(p.Kill) || 0);
        });
        return Object.entries(byDate)
            .sort(([a], [b]) => {
                const [dayA, monthA, yearA] = a.split('/').map(Number);
                const [dayB, monthB, yearB] = b.split('/').map(Number);
                return new Date(yearA, monthA - 1, dayA).getTime() - new Date(yearB, monthB - 1, dayB).getTime();
            })
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

    return (
        <div className="min-h-screen flex bg-[var(--bg-main)]">


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
                className={`fixed inset-y-0 left-0 z-50 w-64 flex flex-col transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 bg-[var(--bg-surface)] border-r border-[var(--border-default)]`}
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
                        />
                    </div>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-4 space-y-2">
                    {[
                        { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
                        { id: 'players', label: 'Jogadores', icon: Users },
                        { id: 'history', label: 'Análise', icon: FileSpreadsheet },
                    ].map(item => {
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }}
                                className={`nav-item w-full ${isActive ? 'active' : ''}`}
                            >
                                <item.icon size={18} />
                                {item.label}
                            </button>
                        );
                    })}

                    <div className="pt-4 mt-4 border-t border-[var(--border-subtle)]">
                        <button
                            onClick={() => navigate('/input')}
                            className="btn-primary w-full flex items-center justify-center gap-2"
                        >
                            <PlusCircle size={18} />
                            Inserir Dados
                        </button>
                    </div>
                </nav>


                {/* Sidebar Footer */}
                <div className="p-4 space-y-2 border-t border-[var(--border-subtle)]">
                    <a
                        href="https://wa.me/13981630304"
                        target="_blank"
                        rel="noreferrer"
                        className="btn-ghost w-full flex items-center justify-between"
                    >
                        <span className="flex items-center gap-2">
                            <AlertCircle size={16} /> Suporte Técnico
                        </span>
                        <ChevronRight size={12} />
                    </a>
                    <button
                        onClick={() => signOut()}
                        className="btn-ghost w-full flex items-center gap-2 text-[var(--accent-red)] hover:bg-[var(--accent-red)]/10 border-transparent hover:border-[var(--accent-red)]/20"
                    >
                        <LogOut size={16} /> Sair da Conta
                    </button>
                    <div className="pt-4 text-center">
                        <p className="text-label">
                            Criado por <span className="text-[var(--accent)] font-bold">@CeloCoach</span>
                        </p>
                    </div>
                </div>
            </aside>


            {/* ── Content ── */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[var(--bg-main)]">

                {/* 🚀 Beta Banner */}
                <div className="py-2 px-4 text-center border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]">
                    <span className="text-label opacity-50 mr-2">Status:</span>
                    <span className="text-label text-[var(--accent)] mr-4">v2.0 Beta Protocol</span>
                    <span className="text-label opacity-50 mr-2">Feedback:</span>
                    <a href="https://instagram.com/celocoach" target="_blank" rel="noreferrer" className="text-label text-[var(--accent)] hover:text-[var(--text-primary)] transition-colors">
                        @CeloCoach
                    </a>
                </div>


                {/* Header / Top Bar */}
                <header
                    className="h-20 flex items-center justify-between px-8 z-40 backdrop-blur-md sticky top-0 bg-[var(--bg-main)]/80 border-b border-[var(--border-default)]"
                >
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:hidden btn-ghost p-2">
                            <Menu size={20} />
                        </button>
                        <div className="hidden md:flex items-center text-label">
                            <LayoutDashboard size={14} className="mr-2" />
                            <span>Controle</span>
                            <ChevronRight size={14} className="mx-2 opacity-50" />
                            <span className="text-[var(--accent)]">
                                {activeTab === 'overview' ? 'Visão Geral' : activeTab === 'players' ? 'Jogadores' : 'Histórico'}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* ── Filtros de Tempo Rápido (Tabs) ── */}
                        <div className="hidden lg:flex items-center gap-1 p-1 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-default)]">
                            {([{ id: '7d', label: '7 dias' }, { id: '30d', label: 'Este Mês' }, { id: 'all', label: 'Todos' }] as const).map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => setTimeFilter(t.id)}
                                    className={`px-3 py-1.5 rounded-md text-label transition-all ${timeFilter === t.id ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'}`}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>

                        {/* Filtros por Data / Campeonato */}
                        <div className="hidden lg:flex items-center gap-2">
                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-default)] text-label">
                                <Calendar size={13} className="text-[var(--accent)]" />
                                <select
                                    value={filters.date}
                                    onChange={e => setFilters(prev => ({ ...prev, date: e.target.value }))}
                                    className="outline-none cursor-pointer bg-transparent"
                                >
                                    <option value="Todos">Todas as Datas</option>
                                    {filterOptions.dates.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-default)] text-label">
                                <Trophy size={13} className="text-[var(--accent)]" />
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
                        <div className="flex items-center gap-4 pl-4 border-l border-[var(--border-subtle)]">
                            <div className="hidden sm:flex flex-col text-right">
                                <span className="text-label">{nomeUsuario || 'Analista'}</span>
                                <span className="text-heading text-xs mt-0.5">Créditos: {creditos ?? '...'}</span>
                            </div>
                            <button
                                onClick={handleShareDashboard}
                                className="hidden md:flex items-center gap-2 btn-ghost"
                                title="Compartilhar Dashboard"
                            >
                                <Link size={14} />
                                Link para Players
                            </button>
                            {/* Mobile version simple icon */}
                            <button
                                onClick={handleShareDashboard}
                                className="md:hidden btn-ghost p-2.5"
                            >
                                <Link size={18} />
                            </button>
                            <button
                                onClick={() => setIsImportModalOpen(true)}
                                className="btn-ghost p-2.5"
                            >
                                <FileSpreadsheet size={18} />
                            </button>
                            <div
                                className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs bg-[var(--accent)] text-white"
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
                            <div className="w-12 h-12 rounded-lg border-2 border-[var(--accent)]/20 border-t-[var(--accent)] animate-spin" />
                            <p className="text-label animate-pulse text-[var(--accent)]">Inicializando Protocolo de Dados</p>
                        </div>
                    ) : fetchError ? (
                        <div className="h-full flex flex-col items-center justify-center p-12 text-center card">
                            <div className="p-5 rounded-xl bg-[var(--accent-red)]/10 border border-[var(--accent-red)]/20 mb-6">
                                <AlertCircle size={40} className="text-[var(--accent-red)]" />
                            </div>
                            <h3 className="text-heading text-xl mb-2">Falha de Sincronização</h3>
                            <p className="max-w-xs text-sm text-[var(--text-secondary)] mb-8">{fetchError}</p>
                            <button
                                onClick={() => window.location.reload()}
                                className="btn-primary"
                            >
                                Reconectar Sistema
                            </button>
                        </div>
                    ) : (

                        <>
                            {/* ══════════ OVERVIEW TAB ══════════ */}
                            {activeTab === 'overview' && (
                                <div className="space-y-8 animate-reveal">
                                    {!data ? (
                                        <div className="flex flex-col items-center justify-center py-20 text-center card border-dashed">
                                            <div className="p-6 rounded-2xl mb-6 bg-[var(--accent-muted)]">
                                                <FileSpreadsheet size={40} className="text-[var(--accent)]" />
                                            </div>
                                            <h3 className="text-heading text-xl mb-2">Protocolo de Dados Inativo</h3>
                                            <p className="max-w-xs text-label px-4">
                                                Nenhum dado detectado no sistema. Por favor, inicialize o banco de dados via importação (.xlsx) ou registro manual.
                                            </p>
                                            <button
                                                onClick={() => setIsImportModalOpen(true)}
                                                className="mt-8 btn-primary flex items-center gap-2"
                                            >
                                                <PlusCircle size={16} /> Inicializar Sistema
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Principais Métricas */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                                                <MetricCard
                                                    title="Total de Kills"
                                                    value={totalKillsFromPlayers}
                                                    subValue={filteredPlayerRows.length > 0 ? `${filteredPlayerRows.length} registros` : `${data.general.mediaKills}/queda`}
                                                    icon={Sword}
                                                />
                                                <MetricCard
                                                    title="Pontuação Total"
                                                    value={data.general.totalPontos}
                                                    subValue={`Média: ${data.general.mediaPontos}`}
                                                    icon={Target}
                                                />
                                                <MetricCard
                                                    title="Booyahs"
                                                    value={data.general.totalBooyahs}
                                                    subValue={`${data.general.percentBooyah}% Win Rate`}
                                                    icon={Trophy}
                                                />
                                                <MetricCard
                                                    title="Sucesso em Call"
                                                    value={`${data.general.percentSucessoCall}%`}
                                                    subValue={`${data.general.callsGanhas}W / ${data.general.callsPerdidas}L`}
                                                    icon={Zap}
                                                />
                                            </div>

                                            {/* Charts Row */}
                                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                                                <Card className="lg:col-span-2">
                                                    <div className="flex items-center justify-between mb-8">
                                                        <div>
                                                            <h4 className="text-heading text-sm">Fluxo de Performance</h4>
                                                            <p className="text-label mt-1">Consolidado de Kills / Partida</p>
                                                        </div>
                                                        <div className="p-2.5 rounded-lg bg-[var(--accent-muted)] text-[var(--accent)]">
                                                            <TrendingUp size={16} />
                                                        </div>
                                                    </div>
                                                    <div className="h-72">
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <AreaChart data={trendChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                                                <defs>
                                                                    <linearGradient id="gradKills" x1="0" y1="0" x2="0" y2="1">
                                                                        <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.4} />
                                                                        <stop offset="60%" stopColor="var(--accent)" stopOpacity={0.08} />
                                                                        <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                                                                    </linearGradient>
                                                                </defs>
                                                                <XAxis dataKey="Data" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: 'var(--text-tertiary)', fontWeight: 600 }} dy={10} />
                                                                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: 'var(--text-tertiary)', fontWeight: 600 }} />
                                                                <Tooltip contentStyle={neonTooltipStyle} />
                                                                <Area type="monotone" dataKey="Kill" stroke="var(--accent)" strokeWidth={2.5} fillOpacity={1} fill="url(#gradKills)" />
                                                            </AreaChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                </Card>

                                                <Card>
                                                    <div className="flex items-center justify-between mb-8">
                                                        <div>
                                                            <h4 className="text-heading text-sm">Domínio de Terreno</h4>
                                                            <p className="text-label mt-1">Distribuição de Pontos</p>
                                                        </div>
                                                        <div className="p-2.5 rounded-lg bg-[var(--accent-muted)] text-[var(--accent)]">
                                                            <Map size={16} />
                                                        </div>
                                                    </div>
                                                    <div className="h-72">
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <PieChart>
                                                                <Pie
                                                                    data={data.byMap || []}
                                                                    cx="50%" cy="45%"
                                                                    innerRadius={60} outerRadius={85}
                                                                    startAngle={90} endAngle={-270}
                                                                    dataKey="totalPontos" nameKey="mapa" paddingAngle={4}
                                                                    stroke="none"
                                                                >
                                                                    {(data.byMap || []).map((_: any, index: number) => (
                                                                        <Cell key={`cell-${index}`} fill={['#9333EA', '#10B981', '#EF4444', '#F59E0B', '#3B82F6'][index % 5]} />
                                                                    ))}
                                                                </Pie>
                                                                <Tooltip contentStyle={neonTooltipStyle} />
                                                                <Legend
                                                                    verticalAlign="bottom"
                                                                    height={40}
                                                                    iconType="circle"
                                                                    iconSize={6}
                                                                    formatter={(value) => (
                                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">{value}</span>
                                                                    )}
                                                                />
                                                            </PieChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                </Card>
                                            </div>

                                            {/* MVP & Squad Metrics */}
                                            {filteredPlayerRows.length > 0 && (
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                                    <div className="card p-6 bg-gradient-to-br from-[var(--accent-muted)] to-transparent border-[var(--accent)]/20 relative overflow-hidden">
                                                        <div className="absolute -right-4 -top-4 opacity-10">
                                                            <Trophy size={100} className="text-[var(--accent)]" />
                                                        </div>
                                                        <p className="badge badge-purple mb-4">Destaque da Última Partida</p>
                                                        <h4 className="text-heading text-2xl uppercase">
                                                            {data.playerMetrics.lastMatchMVP?.player || 'Aguardando...'}
                                                        </h4>
                                                        <div className="mt-6">
                                                            <span className="text-label">Score de Combate</span>
                                                            <div className="flex items-center gap-3 mt-1">
                                                                <span className="text-heading text-4xl text-[var(--accent)]">
                                                                    {data.playerMetrics.lastMatchMVP?.score || 0}
                                                                </span>
                                                                <span className="badge badge-purple">MVP</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <Card className="md:col-span-2">
                                                        <div className="flex items-center justify-between mb-8">
                                                            <div>
                                                                <h4 className="text-heading text-sm">Médias do Squad</h4>
                                                                <p className="text-label mt-1">Análise consolidada por queda</p>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <span className="badge badge-purple">Dano</span>
                                                                <span className="badge badge-green">Abates</span>
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-3 gap-6">
                                                            <div className="space-y-2">
                                                                <span className="text-label">Dano Médio</span>
                                                                <div className="text-heading text-2xl text-[var(--accent)]">{data.squadMetrics.avgDamage}</div>
                                                                <div className="w-full h-1 bg-[var(--bg-surface)] rounded-full overflow-hidden">
                                                                    <div className="h-full bg-[var(--accent)]" style={{ width: `${Math.min(100, (data.squadMetrics.avgDamage / 2500) * 100)}%` }} />
                                                                </div>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <span className="text-label">Kills Squad</span>
                                                                <div className="text-heading text-2xl text-[var(--accent-green)]">{data.squadMetrics.totalKills}</div>
                                                                <div className="w-full h-1 bg-[var(--bg-surface)] rounded-full overflow-hidden">
                                                                    <div className="h-full bg-[var(--accent-green)]" style={{ width: `${Math.min(100, (data.squadMetrics.totalKills / 40) * 100)}%` }} />
                                                                </div>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <span className="text-label">Sobrevivência</span>
                                                                <div className="text-heading text-2xl">{data.squadMetrics.survivalRate}<span className="text-xs text-[var(--text-tertiary)] ml-1">mortes/jogo</span></div>
                                                                <div className="w-full h-1 bg-[var(--bg-surface)] rounded-full overflow-hidden">
                                                                    <div className="h-full bg-[var(--accent-blue)]" style={{ width: `${Math.max(10, 100 - (data.squadMetrics.survivalRate * 20))}%` }} />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </Card>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}

                            {/* ══════════ PLAYERS TAB ══════════ */}
                            {activeTab === 'players' && allPlayerRows.length > 0 && (
                                <div className="space-y-6 animate-reveal">
                                    <div className="flex flex-wrap items-center gap-4">
                                        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-default)]">
                                            <UserCircle2 size={16} className="text-[var(--accent)]" />
                                            <select
                                                value={selectedPlayer}
                                                onChange={e => setSelectedPlayer(e.target.value)}
                                                className="bg-transparent text-sm outline-none cursor-pointer text-[var(--text-primary)] min-w-[160px]"
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
                                                className="badge badge-purple cursor-pointer hover:bg-[var(--accent-hover)]/20 transition-colors"
                                            >
                                                Limpar filtro ✕
                                            </button>
                                        )}
                                        <span className="text-label ml-auto">
                                            {playerChartData.length} jogador(es) exibido(s)
                                        </span>
                                    </div>

                                    {filteredPlayerRows.length > 0 ? (
                                        <div className="space-y-8">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                                <MetricCard
                                                    title="Total de Derrubados"
                                                    value={totalDerrubados}
                                                    subValue={`${filteredPlayerRows.length} registros`}
                                                    icon={Sword}
                                                />
                                                <MetricCard
                                                    title="Média de Derrubados"
                                                    value={mediaDerrubados.toFixed(2)}
                                                    subValue={selectedPlayer !== 'Todos' ? selectedPlayer : 'Geral'}
                                                    icon={Target}
                                                />
                                            </div>

                                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                                                <Card>
                                                    <div className="flex items-center justify-between mb-8">
                                                        <h4 className="text-heading text-sm font-bold uppercase">Média de Abates</h4>
                                                        <Sword size={16} className="text-[var(--accent-red)]" />
                                                    </div>
                                                    <div className="h-56">
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <BarChart data={playerChartData} layout="vertical" margin={{ left: -20 }}>
                                                                <XAxis type="number" hide />
                                                                <YAxis type="category" dataKey="name" stroke="var(--text-tertiary)" tickLine={false} axisLine={false} fontSize={10} width={80} />
                                                                <Tooltip contentStyle={neonTooltipStyle} cursor={false} />
                                                                <Bar dataKey="avgKills" fill="var(--accent-red)" radius={[0, 4, 4, 0]} barSize={12} />
                                                            </BarChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                </Card>

                                                <Card>
                                                    <div className="flex items-center justify-between mb-8">
                                                        <h4 className="text-heading text-sm font-bold uppercase">Média de Dano</h4>
                                                        <ShieldAlert size={16} className="text-[var(--accent)]" />
                                                    </div>
                                                    <div className="h-56">
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <BarChart data={playerChartData} layout="vertical" margin={{ left: -20 }}>
                                                                <XAxis type="number" hide />
                                                                <YAxis type="category" dataKey="name" stroke="var(--text-tertiary)" tickLine={false} axisLine={false} fontSize={10} width={80} />
                                                                <Tooltip contentStyle={neonTooltipStyle} cursor={false} />
                                                                <Bar dataKey="avgDamage" fill="var(--accent)" radius={[0, 4, 4, 0]} barSize={12} />
                                                            </BarChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                </Card>

                                                <Card>
                                                    <div className="flex items-center justify-between mb-8">
                                                        <h4 className="text-heading text-sm font-bold uppercase">Assistências</h4>
                                                        <Target size={16} className="text-[var(--accent-green)]" />
                                                    </div>
                                                    <div className="h-56">
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <BarChart data={playerChartData} layout="vertical" margin={{ left: -20 }}>
                                                                <XAxis type="number" hide />
                                                                <YAxis type="category" dataKey="name" stroke="var(--text-tertiary)" tickLine={false} axisLine={false} fontSize={10} width={80} />
                                                                <Tooltip contentStyle={neonTooltipStyle} cursor={false} />
                                                                <Bar dataKey="avgAssists" fill="var(--accent-green)" radius={[0, 4, 4, 0]} barSize={12} />
                                                            </BarChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                </Card>
                                            </div>

                                            {selectedPlayer !== 'Todos' && radarData.length > 0 && (
                                                <Card>
                                                    <div className="flex items-center gap-3 mb-6">
                                                        <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-base bg-gradient-to-br from-[var(--accent)] to-[var(--accent-green)] text-white">
                                                            {selectedPlayer[0]}
                                                        </div>
                                                        <div>
                                                            <h4 className="text-heading text-lg">Radar de Habilidades</h4>
                                                            <p className="text-label">Competências individuais: {selectedPlayer}</p>
                                                        </div>
                                                    </div>
                                                    <div className="h-80">
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                                                <PolarGrid stroke="#27272D" />
                                                                <PolarAngleAxis 
                                                                    dataKey="subject" 
                                                                    tick={{ fill: '#A1A1AA', fontSize: 11 }} 
                                                                />
                                                                <Radar
                                                                    name={selectedPlayer}
                                                                    dataKey="value"
                                                                    stroke="#9333EA"
                                                                    fill="#9333EA"
                                                                    fillOpacity={0.15}
                                                                    strokeWidth={1.5}
                                                                />
                                                                <Tooltip 
                                                                    contentStyle={{
                                                                        backgroundColor: 'var(--bg-card)',
                                                                        border: '1px solid var(--border-default)',
                                                                        borderRadius: '8px',
                                                                        color: 'var(--text-primary)'
                                                                    }}
                                                                    itemStyle={{ color: 'var(--text-primary)' }}
                                                                />
                                                            </RadarChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                </Card>
                                            )}

                                            <Card className="overflow-hidden p-0!">
                                                <div className="flex items-center justify-between p-6">
                                                    <h4 className="text-heading text-sm font-bold uppercase flex items-center gap-2">
                                                        <Users size={16} className="text-[var(--accent)]" /> Classificação de Elite
                                                    </h4>
                                                </div>
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-xs text-left">
                                                        <thead className="bg-[var(--bg-surface)] border-y border-[var(--border-subtle)]">
                                                            <tr>
                                                                <th className="px-6 py-4 font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Jogador</th>
                                                                <th className="px-6 py-4 font-bold text-[var(--text-tertiary)] uppercase tracking-wider text-right">Kills</th>
                                                                <th className="px-6 py-4 font-bold text-[var(--text-tertiary)] uppercase tracking-wider text-right">Dano</th>
                                                                <th className="px-6 py-4 font-bold text-[var(--text-tertiary)] uppercase tracking-wider text-right">Score</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-[var(--border-subtle)]">
                                                            {(selectedPlayer === 'Todos'
                                                                ? filteredPlayerRows
                                                                : filteredPlayerRows.filter((p: any) => p.Player === selectedPlayer))
                                                                .sort((a: any, b: any) => b.Kill - a.Kill)
                                                                .slice(0, 10)
                                                                .map((p: any, idx: number) => (
                                                                    <tr key={idx} className="hover:bg-[var(--bg-hover)] transition-colors">
                                                                        <td className="px-6 py-4 font-bold text-[var(--text-primary)] uppercase">{p.Player}</td>
                                                                        <td className="px-6 py-4 text-right font-mono text-[var(--accent-red)]">{p.Kill}</td>
                                                                        <td className="px-6 py-4 text-right font-mono text-[var(--accent)]">{p.Dano?.toLocaleString()}</td>
                                                                        <td className="px-6 py-4 text-right">
                                                                            <span className="badge badge-purple">{(p.Kill * 10).toFixed(0)}</span>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </Card>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-20 text-center card border-dashed">
                                            <div className="p-6 rounded-2xl mb-6 bg-[var(--accent-muted)]">
                                                <Users size={40} className="text-[var(--accent)]" />
                                            </div>
                                            <h3 className="text-heading text-xl mb-2">Nenhum registro encontrado</h3>
                                            <p className="max-w-xs text-label px-4">
                                                Não há dados de performance para os parâmetros selecionados.
                                            </p>
                                        </div>
                                    )}

                                    {/* Componente de Conquistas */}
                                    {user && (
                                        <PainelDeConquistas
                                            jogadorId={user.id}
                                            nomeJogador={nomeUsuario || user.email || ''}
                                        />
                                    )}
                                </div>
                            )}

                            {/* ══════════ HISTORY TAB ══════════ */}
                            {activeTab === 'history' && (
                                <div className="space-y-6 animate-reveal">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-heading text-xl">Cronologia de Partidas</h3>
                                            <p className="text-label mt-1">Logs permanentes e histórico do sistema</p>
                                        </div>
                                    </div>
                                    
                                    <Card className="overflow-hidden p-0!">
                                        <div className="overflow-x-auto">
                                            {!data || data.rawData.length === 0 ? (
                                                <div className="flex flex-col items-center justify-center p-16 text-center">
                                                    <AlertCircle size={32} className="mb-4 text-[var(--text-tertiary)] opacity-20" />
                                                    <p className="text-label uppercase tracking-widest">Nenhum dado encontrado</p>
                                                </div>
                                            ) : (
                                                <table className="w-full text-xs text-left">
                                                    <thead className="bg-[var(--bg-surface)] border-b border-[var(--border-subtle)]">
                                                        <tr>
                                                            <th className="px-6 py-4 font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Rodada</th>
                                                            <th className="px-6 py-4 font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Mapa</th>
                                                            <th className="px-6 py-4 font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Rank</th>
                                                            <th className="px-6 py-4 font-bold text-[var(--text-tertiary)] uppercase tracking-wider text-right">Abates</th>
                                                            <th className="px-6 py-4 font-bold text-[var(--text-tertiary)] uppercase tracking-wider text-right">Total</th>
                                                            <th className="px-6 py-4 font-bold text-[var(--text-tertiary)] uppercase tracking-wider text-right">Booyah</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-[var(--border-subtle)]">
                                                        {data.rawData.map((row: any, index: number) => (
                                                            <tr key={index} className="hover:bg-[var(--bg-hover)] transition-colors">
                                                                <td className="px-6 py-4 font-bold text-[var(--text-tertiary)]">#{String(row.Rodada).padStart(2, '0')}</td>
                                                                <td className="px-6 py-4 font-bold text-[var(--text-primary)] uppercase">{row.Mapa}</td>
                                                                <td className="px-6 py-4">
                                                                    <span className={`badge ${row.Colocacao === 1 ? 'badge-purple' : 'badge-ghost'}`}>
                                                                        P{row.Colocacao}
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-4 text-right font-mono text-[var(--accent-red)]">{row.Kill}</td>
                                                                <td className="px-6 py-4 text-right font-mono text-[var(--text-primary)]">{row.Pontos_Total}</td>
                                                                <td className="px-6 py-4 text-right">
                                                                    {row.Booyah === 'SIM' ? (
                                                                        <div className="flex justify-end">
                                                                            <div className="w-6 h-6 rounded bg-[var(--accent)] flex items-center justify-center shadow-lg shadow-[var(--accent-glow)]">
                                                                                <Trophy size={12} className="text-white" />
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <span className="text-[var(--text-tertiary)]">--</span>
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
        </div>
    );
};
