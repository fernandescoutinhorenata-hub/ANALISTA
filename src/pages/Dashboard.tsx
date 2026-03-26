import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import {
    XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell,
    BarChart, Bar,
    Legend,
    LineChart, Line, CartesianGrid
} from 'recharts';
import {
    Trophy, Target, Map, FileSpreadsheet, RefreshCcw,
    TrendingUp, LogOut, Users, Sword,
    Calendar, LayoutDashboard, Menu, ChevronRight, UserCircle2, PlusCircle,
    CheckCircle, XCircle, AlertCircle, Link, CreditCard
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { DashboardData } from '../types';
import { processData } from '../utils/data-processing';
import { useAuth } from '../contexts/AuthContext';
import { OnboardingModal } from '../components/OnboardingModal';

// ─── Componentes de UI (Design System) ──────────────────────────────────────────
const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <div className={`card p-6 relative overflow-hidden ${className}`}>
        {children}
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

const neonItemStyle = {
    color: 'var(--text-primary)',
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'uppercase' as const,
};

const neonLabelStyle = {
    color: 'var(--text-secondary)',
    fontSize: '10px',
    fontWeight: '700',
    textTransform: 'uppercase' as const,
    marginBottom: '4px',
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
}> = ({ isOpen, onClose, onUpload, onDownloadTemplate, loading }) => {
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
                .select('nome, email')
                .eq('id', user.id)
                .single();
            if (data) {
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
                    Derrubados: row.derrubados,
                    Mortes: row.mortes,
                    Assistencias: row.assistencias,
                    Dano: row.dano,
                    Revividos: row.revividos,
                    Ressurgimentos: row.ressurgimentos
                }));
                setAllPlayerRows(mappedPlayers);

            } catch (error: any) {
                // Erro de carregamento silenciado (fetchError e toast gerenciam a UI)
                setFetchError('Não foi possível carregar os dados. Verifique sua conexão.');
                showToast('Erro de conexão com o banco.', 'error');
            } finally {
                setIsDashboardLoading(false);
            }
        };

        fetchPerfil();
        fetchDashboardData();

        const channelData = supabase.channel('dashboard-data-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'partidas_geral', filter: `user_id=eq.${user.id}` }, () => fetchDashboardData())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'performance_jogadores', filter: `user_id=eq.${user.id}` }, () => fetchDashboardData())
            .subscribe();

        window.addEventListener('focus', fetchDashboardData);

        return () => {
            supabase.removeChannel(channelData);
            window.removeEventListener('focus', fetchDashboardData);
        };
    }, [user]);






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



    // ─── Novos Dados da Aba Jogadores (Tabela, Funil, Donut, Linha) ───
    const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc'|'desc'}>({ key: 'kills', direction: 'desc' });

    const playerTableData = useMemo(() => {
        if (filteredPlayerRows.length === 0) return [];
        const agg: Record<string, any> = {};
        
        filteredPlayerRows.forEach((p: any) => {
            if (selectedPlayer !== 'Todos' && p.Player !== selectedPlayer) return;
            if (!p.Player) return;
            if (!agg[p.Player]) agg[p.Player] = { name: p.Player, kills: 0, damage: 0, assists: 0, deaths: 0, derrubados: 0 };
            
            agg[p.Player].kills += Number(p.Kill) || 0;
            agg[p.Player].damage += Number(p.Dano) || 0;
            agg[p.Player].assists += Number(p.Assistencias) || 0;
            agg[p.Player].deaths += Number(p.Mortes) || 0;
            agg[p.Player].derrubados += Number(p.Derrubados) || 0;
        });
        
        let arr = Object.values(agg).map((p: any) => {
            return {
                name: p.name,
                kills: p.kills,
                deaths: p.deaths,
                assists: p.assists,
                damage: p.damage,
                kd: parseFloat((p.kills / (p.deaths || 1)).toFixed(2)),
                derrubados: p.derrubados,
            }
        });

        // Aplicar Ordenação
        arr.sort((a: any, b: any) => {
            let valA = a[sortConfig.key];
            let valB = b[sortConfig.key];
            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return arr;
    }, [filteredPlayerRows, selectedPlayer, sortConfig]);

    const donutData = useMemo(() => {
        return playerTableData.map((p: any, i: number) => ({
            name: p.name,
            value: p.kills,
            fill: ['#EF4444', '#F97316', '#EAB308', '#22C55E', '#3B82F6', '#8B5CF6', '#D946EF'][i % 7]
        }));
    }, [playerTableData]);

    const pyramidData = useMemo(() => {
        return [...playerTableData].sort((a: any, b: any) => b.damage - a.damage);
    }, [playerTableData]);

    const lineChartData = useMemo(() => {
        const byMatch: Record<string, { name: string; abates: number; assistencias: number }> = {};
        filteredPlayerRows.forEach((p: any) => {
            if (selectedPlayer !== 'Todos' && p.Player !== selectedPlayer) return;
            const matchKey = `${p.Data} - ${p.Mapa || ''}`; 
            if (!byMatch[matchKey]) byMatch[matchKey] = { name: matchKey, abates: 0, assistencias: 0 };
            byMatch[matchKey].abates += Number(p.Kill) || 0;
            byMatch[matchKey].assistencias += Number(p.Assistencias) || 0;
        });
        return Object.values(byMatch);
    }, [filteredPlayerRows, selectedPlayer]);




    // ─── Métricas calculadas do Overview ────────────────────────────────────────
    const overviewMetrics = useMemo(() => {
        const rows = allGeneralRows;
        const total = rows.length || 1;
        const placementPts = (c: number) =>
            c === 1 ? 12 : c === 2 ? 9 : c === 3 ? 7 : c === 4 ? 5 : c === 5 ? 4
            : c <= 10 ? 3 : c <= 15 ? 1 : 0;

        const booyahs = rows.filter(r => Number(r.Colocacao) === 1).length;
        const taxaBooyah = ((booyahs / total) * 100).toFixed(2);
        const totalKills = rows.reduce((s, r) => s + (Number(r.Kill) || 0), 0);
        const mediaKills = (totalKills / total).toFixed(2);
        const totalPts = rows.reduce((s, r) =>
            s + (Number(r.Kill) || 0) * 3 + placementPts(Number(r.Colocacao) || 99), 0);
        const mediaPontos = Math.round(totalPts / total);
        const top3 = ((rows.filter(r => Number(r.Colocacao) <= 3).length / total) * 100).toFixed(2);
        const top5 = ((rows.filter(r => Number(r.Colocacao) <= 5).length / total) * 100).toFixed(2);
        const top12 = ((rows.filter(r => Number(r.Colocacao) <= 12).length / total) * 100).toFixed(2);

        const booyahsByMap: Record<string, number> = {};
        rows.filter(r => Number(r.Colocacao) === 1).forEach(r => {
            const m = String(r.Mapa || 'Desconhecido');
            booyahsByMap[m] = (booyahsByMap[m] || 0) + 1;
        });
        const barData = Object.entries(booyahsByMap)
            .map(([mapa, qty]) => ({ mapa, booyahs: qty }))
            .sort((a, b) => b.booyahs - a.booyahs);

        const byEvent: Record<string, { total: number; count: number }> = {};
        rows.forEach(r => {
            const ev = String(r.Campeonato || 'Geral');
            const pts = (Number(r.Kill) || 0) * 3 + placementPts(Number(r.Colocacao) || 99);
            if (!byEvent[ev]) byEvent[ev] = { total: 0, count: 0 };
            byEvent[ev].total += pts;
            byEvent[ev].count += 1;
        });
        const tableData = Object.entries(byEvent)
            .map(([evento, { total: t, count }]) => ({ evento, media: t / count }))
            .sort((a, b) => b.media - a.media);

        const lineData = rows.map((r, i) => ({
            partida: i + 1,
            pontos: (Number(r.Kill) || 0) * 3 + placementPts(Number(r.Colocacao) || 99),
        }));

        return { booyahs, taxaBooyah, totalKills, mediaKills, totalPts, mediaPontos, top3, top5, top12, barData, tableData, lineData, rowCount: rows.length };
    }, [allGeneralRows]);

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

            {/* Controle de Onboarding */}
            <OnboardingModal />

            {/* Toast Feedback */}
            {toast && <Toast message={toast.message} type={toast.type} />}

            {/* Modal de Importação */}
            <ImportModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onUpload={handleFileUpload}
                onDownloadTemplate={handleTemplateDownload}
                loading={loading}
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

                    <button
                        onClick={() => navigate('/admin-celo/planos')}
                        className="nav-item w-full"
                    >
                        <CreditCard size={18} />
                        Planos
                    </button>

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
                                    className="outline-none cursor-pointer bg-zinc-950 text-white border-none py-1.5 px-2 rounded-md"
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
                                    className="outline-none cursor-pointer bg-zinc-950 text-white border-none py-1.5 px-2 rounded-md"
                                >
                                    <option value="Todos">Todos Campeonatos</option>
                                    {filterOptions.championships.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>


                        {/* Profile */}
                        <div className="flex items-center gap-4 pl-4 border-l border-[var(--border-subtle)]">
                            <div className="hidden sm:flex flex-col text-right items-end gap-1">
                                <span className="text-label text-[10px] opacity-70 leading-none">{nomeUsuario || 'Analista'}</span>
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
                                            {/* ─── BLOCO 1: 4 MetricCards ─── */}
                                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                                                <div className="card-metric flex flex-col gap-4">
                                                    <div className="flex justify-between items-start">
                                                        <div className="p-2.5 rounded-xl bg-[var(--accent-muted)] text-[var(--accent)]"><Trophy size={20} /></div>
                                                        <span className="badge badge-purple">{overviewMetrics.booyahs} vitórias</span>
                                                    </div>
                                                    <div>
                                                        <h3 className="text-metric text-[var(--accent)]">{overviewMetrics.taxaBooyah}%</h3>
                                                        <p className="text-label mt-2">Taxa de Booyah</p>
                                                    </div>
                                                </div>
                                                <div className="card-metric flex flex-col gap-4">
                                                    <div className="flex justify-between items-start">
                                                        <div className="p-2.5 rounded-xl bg-[var(--accent-muted)] text-[var(--accent)]"><Sword size={20} /></div>
                                                        <span className="badge badge-purple">{overviewMetrics.totalKills} total</span>
                                                    </div>
                                                    <div>
                                                        <h3 className="text-metric">{overviewMetrics.mediaKills}</h3>
                                                        <p className="text-label mt-2">Média de Kills</p>
                                                    </div>
                                                </div>
                                                <div className="card-metric flex flex-col gap-4">
                                                    <div className="flex justify-between items-start">
                                                        <div className="p-2.5 rounded-xl bg-[#22C55E]/10 text-[#22C55E]"><Target size={20} /></div>
                                                        <span className="badge" style={{ background: '#22C55E22', color: '#22C55E', border: '1px solid #22C55E44' }}>{overviewMetrics.totalPts} pts</span>
                                                    </div>
                                                    <div>
                                                        <h3 className="text-metric text-[#22C55E]">{overviewMetrics.mediaPontos}</h3>
                                                        <p className="text-label mt-2">Média de Pontos</p>
                                                    </div>
                                                </div>
                                                <div className="card-metric flex flex-col gap-4">
                                                    <div className="flex justify-between items-start">
                                                        <div className="p-2.5 rounded-xl bg-[var(--accent-muted)] text-[var(--accent)]"><Calendar size={20} /></div>
                                                    </div>
                                                    <div>
                                                        <h3 className="text-metric">{overviewMetrics.rowCount}</h3>
                                                        <p className="text-label mt-2">Partidas Jogadas</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* ─── BLOCO 2: 3 Cards de Taxa ─── */}
                                            <div className="grid grid-cols-3 gap-5">
                                                {[
                                                    { label: 'TAXA TOP 3', value: overviewMetrics.top3 },
                                                    { label: 'TAXA TOP 5', value: overviewMetrics.top5 },
                                                    { label: 'TAXA TOP 12', value: overviewMetrics.top12 },
                                                ].map((t, i) => (
                                                    <div key={i} className="card p-5 flex flex-col items-center justify-center gap-2 bg-[var(--bg-card)] border border-[var(--border-subtle)]">
                                                        <span className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)] font-bold">{t.label}</span>
                                                        <span className="text-3xl font-black text-[var(--accent)]">{t.value}%</span>
                                                        <span className="text-[10px] text-[var(--text-tertiary)]">de todas as partidas</span>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* ─── BLOCO 3: BarChart + Tabela ─── */}
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                                                <Card>
                                                    <div className="flex items-center justify-between mb-6">
                                                        <div>
                                                            <h4 className="text-heading text-sm font-bold uppercase tracking-wider">Booyahs por Mapa</h4>
                                                            <p className="text-label mt-1">Vitórias agrupadas por arena</p>
                                                        </div>
                                                        <div className="p-2.5 rounded-lg bg-[var(--accent-muted)] text-[var(--accent)]"><Map size={16} /></div>
                                                    </div>
                                                    {overviewMetrics.barData.length === 0 ? (
                                                        <div className="h-56 flex items-center justify-center text-label">Sem booyahs registrados ainda</div>
                                                    ) : (
                                                        <div className="h-56">
                                                            <ResponsiveContainer width="100%" height="100%">
                                                                <BarChart data={overviewMetrics.barData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                                                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                                                                    <XAxis dataKey="mapa" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: 'var(--text-tertiary)', fontWeight: 600 }} />
                                                                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }} allowDecimals={false} />
                                                                    <Tooltip contentStyle={neonTooltipStyle} itemStyle={neonItemStyle} labelStyle={neonLabelStyle} />
                                                                    <Bar dataKey="booyahs" name="Booyahs" fill="#9333EA" radius={[4, 4, 0, 0]} />
                                                                </BarChart>
                                                            </ResponsiveContainer>
                                                        </div>
                                                    )}
                                                </Card>

                                                <Card>
                                                    <div className="flex items-center justify-between mb-6">
                                                        <div>
                                                            <h4 className="text-heading text-sm font-bold uppercase tracking-wider">Média Pontos por Evento</h4>
                                                            <p className="text-label mt-1">Ranking por campeonato</p>
                                                        </div>
                                                        <div className="p-2.5 rounded-lg bg-[var(--accent-muted)] text-[var(--accent)]"><Trophy size={16} /></div>
                                                    </div>
                                                    <div>
                                                        <div className="grid grid-cols-12 text-[10px] uppercase tracking-widest text-[var(--text-tertiary)] font-bold pb-2 border-b border-[var(--border-subtle)] mb-1">
                                                            <span className="col-span-1">#</span>
                                                            <span className="col-span-9">Evento</span>
                                                            <span className="col-span-2 text-right">Média</span>
                                                        </div>
                                                        {overviewMetrics.tableData.length === 0 ? (
                                                            <p className="text-label text-center py-8">Sem dados por evento</p>
                                                        ) : overviewMetrics.tableData.map((row, i) => (
                                                            <div key={i} className="grid grid-cols-12 py-2.5 hover:bg-[var(--bg-hover)] rounded-lg px-1 transition-colors items-center">
                                                                <span className="col-span-1 text-[var(--accent)] font-black text-sm">{i + 1}</span>
                                                                <span className="col-span-9 text-sm text-[var(--text-primary)] font-medium truncate">{row.evento}</span>
                                                                <span className="col-span-2 text-right text-sm font-black text-[var(--text-primary)]">{row.media.toFixed(2)}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </Card>
                                            </div>

                                            {/* ─── BLOCO 4: LineChart Histórico ─── */}
                                            {overviewMetrics.lineData.length > 0 && (
                                                <Card>
                                                    <div className="flex items-center justify-between mb-6">
                                                        <div>
                                                            <h4 className="text-heading text-sm font-bold uppercase tracking-wider">Histórico — Média Pontos / Queda</h4>
                                                            <p className="text-label mt-1">Evolução de pontuação por partida</p>
                                                        </div>
                                                        <div className="p-2.5 rounded-lg bg-[#22C55E]/10 text-[#22C55E]"><TrendingUp size={16} /></div>
                                                    </div>
                                                    <ResponsiveContainer width="100%" height={280}>
                                                        <LineChart data={overviewMetrics.lineData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                                                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                                                            <XAxis dataKey="partida" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: 'var(--text-tertiary)', fontWeight: 600 }} />
                                                            <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }} />
                                                            <Tooltip
                                                                contentStyle={neonTooltipStyle}
                                                                itemStyle={{ ...neonItemStyle, color: '#22C55E' }}
                                                                labelStyle={neonLabelStyle}
                                                                formatter={(v: any) => [v, 'Pontos']}
                                                                labelFormatter={(l) => `Partida ${l}`}
                                                            />
                                                            <Line type="monotone" dataKey="pontos" stroke="#22C55E" strokeWidth={2.5} dot={{ r: 4, fill: '#22C55E', stroke: '#22C55E', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                                                        </LineChart>
                                                    </ResponsiveContainer>
                                                </Card>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}

                            {/* ══════════ PLAYERS TAB ══════════ */}
                            {activeTab === 'players' && (
                                <div className="space-y-6 animate-reveal">
                                    <div className="flex flex-wrap items-center gap-4">
                                        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-default)]">
                                            <UserCircle2 size={16} className="text-[var(--accent)]" />
                                            <select
                                                value={selectedPlayer}
                                                onChange={e => setSelectedPlayer(e.target.value)}
                                                className="bg-transparent text-[var(--text-primary)] border-none px-2 outline-none cursor-pointer min-w-[160px] font-bold text-sm"
                                            >
                                                <option value="Todos" className="bg-[#141416]">Todos os Jogadores</option>
                                                {playerList.map((p: any) => (
                                                    <option key={p} value={p} className="bg-[#141416]">{p}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* BLOCO 1: Tabela */}
                                    <Card className="!bg-[#141416] border-none p-0 overflow-hidden">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left">
                                                <thead className="border-b border-[#27272A] bg-[#18181B]">
                                                    <tr>
                                                        {[{ l: 'Player', k: 'name' }, { l: 'Abates', k: 'kills' }, { l: 'Mortes', k: 'deaths' }, { l: 'Assists', k: 'assists' }, { l: 'Dano', k: 'damage' }, { l: 'KD', k: 'kd' }, { l: 'Derrubados', k: 'derrubados' }].map(col => (
                                                            <th key={col.k} 
                                                                className="px-6 py-4 text-xs font-bold text-[#A1A1AA] uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                                                                onClick={() => setSortConfig({ key: col.k, direction: sortConfig.key === col.k && sortConfig.direction === 'desc' ? 'asc' : 'desc' })}
                                                            >
                                                                {col.l} {sortConfig.key === col.k ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                                                            </th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-[#27272A]">
                                                    {playerTableData.map((p: any) => (
                                                        <tr key={p.name} className="hover:bg-[#1E1E21] transition-colors">
                                                            <td className="px-6 py-4 text-sm font-black text-white">{p.name}</td>
                                                            <td className="px-6 py-4 text-center font-mono text-lg text-white">{p.kills}</td>
                                                            <td className="px-6 py-4 text-center font-mono text-[#A1A1AA]">{p.deaths}</td>
                                                            <td className="px-6 py-4 text-center font-mono text-[#A1A1AA]">{p.assists}</td>
                                                            <td className="px-6 py-4 text-center font-mono text-[var(--accent)] font-bold">{p.damage}</td>
                                                            <td className="px-6 py-4 text-center">
                                                                <span className="badge badge-purple">{(p.kills / (p.deaths || 1)).toFixed(2)}</span>
                                                            </td>
                                                            <td className="px-6 py-4 text-center font-mono text-[#EAB308]">{p.derrubados}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </Card>

                                    {/* BLOCO 2: Dano (Pyramid) & Kills (Donut) */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <Card className="!bg-[#141416] border-none flex flex-col items-center justify-center min-h-[300px]">
                                            <h4 className="text-[#EAB308] text-sm font-bold uppercase mb-6 tracking-widest">DANO</h4>
                                            <div className="w-full flex flex-col items-center gap-1">
                                                {pyramidData.map((p: any, i: number) => {
                                                    const maxD = pyramidData[0]?.damage || 1;
                                                    const wP = Math.max(30, (p.damage / maxD) * 100);
                                                    return (
                                                        <div key={i} 
                                                            className="h-8 flex items-center justify-center rounded uppercase text-[10px] font-black text-black/70 shadow-sm"
                                                            style={{ width: `${wP}%`, backgroundColor: `hsl(142, 70%, ${Math.min(90, 45 + (i * 8))}%)` }}
                                                        >
                                                            {p.name}
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </Card>

                                        <Card className="!bg-[#141416] border-none flex flex-col items-center justify-center min-h-[300px]">
                                            <h4 className="text-[#EAB308] text-sm font-bold uppercase mb-2 tracking-widest">KILLS</h4>
                                            <div className="w-full h-48 relative">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie
                                                            data={donutData} cx="50%" cy="50%" innerRadius={45} outerRadius={75}
                                                            paddingAngle={2} dataKey="value" stroke="none" labelLine={false}
                                                            label={({ percent }) => `${((percent || 0) * 100).toFixed(1)}%`}
                                                        >
                                                            {donutData.map((d: any, i: number) => <Cell key={`cell-${i}`} fill={d.fill} />)}
                                                        </Pie>
                                                        <Tooltip contentStyle={{ backgroundColor: '#18181B', border: 'none', borderRadius: '8px', color: '#FAFAFA' }} itemStyle={{ color: '#FAFAFA' }} />
                                                        <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" wrapperStyle={{ fontSize: '10px', color: '#FAFAFA', fontWeight: 'bold' }} />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </Card>
                                    </div>

                                    {/* BLOCO 3: Gráfico de Linha (Abates vs Assistências) */}
                                    <div className="w-full h-64 mt-4">
                                        <div className="flex flex-col items-center md:items-start mb-6 px-4">
                                            <div className="flex gap-4 text-xs font-bold uppercase">
                                                <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#EF4444]" /> Abates</span>
                                                <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#22C55E]" /> Assistência</span>
                                            </div>
                                        </div>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={lineChartData} margin={{ left: -20, bottom: 5, right: 20 }}>
                                                <CartesianGrid stroke="#27272A" vertical={false} strokeDasharray="3 3" />
                                                <XAxis dataKey="name" hide />
                                                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#A1A1AA' }} />
                                                <Tooltip contentStyle={{ backgroundColor: '#18181B', border: 'none', borderRadius: '8px' }} />
                                                <Line type="monotone" dataKey="abates" stroke="#EF4444" strokeWidth={2} dot={{ r: 3, fill: '#EF4444', strokeWidth: 0 }} />
                                                <Line type="monotone" dataKey="assistencias" stroke="#22C55E" strokeWidth={2} dot={{ r: 3, fill: '#22C55E', strokeWidth: 0 }} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            )}

                            {/* ══════════ HISTORY TAB ══════════ */}
                            {activeTab === 'history' && (
                                <div className="space-y-6 animate-reveal">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-heading text-xl">Cronologia de Partidas</h3>
                                            <p className="text-label mt-1">Histórico completo de partidas registradas</p>
                                        </div>
                                    </div>
                                    
                                    <Card className="overflow-hidden p-0">
                                        <div className="overflow-x-auto">
                                            {(!data || data.rawData.length === 0) ? (
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
