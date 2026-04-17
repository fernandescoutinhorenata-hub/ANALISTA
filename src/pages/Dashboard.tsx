import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import * as XLSX from 'xlsx';
import {
    Trophy, Target, Map as MapIcon, FileSpreadsheet, RefreshCcw,
    TrendingUp, Users, Sword, 
    Calendar, UserCircle2, PlusCircle,
    CheckCircle, XCircle, AlertCircle, Link, Activity, Trash2
} from 'lucide-react';
import {
    XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell,
    Legend,
    LineChart, Line, CartesianGrid,
    BarChart, Bar
} from 'recharts';
import { supabase } from '../lib/supabase';
import type { DashboardData } from '../types';
import { processData } from '../utils/data-processing';
import { useAuth } from '../contexts/AuthContext';
import { OnboardingModal } from '../components/OnboardingModal';
import { SidebarLayout } from '../components/SidebarLayout';
import { SecurityTab } from '../components/SecurityTab';

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
    <div className="card-metric flex flex-col gap-4 relative">
        <div className="flex justify-between items-start">
            {subValue ? (
                <span className="badge badge-purple">
                    {subValue}
                </span>
            ) : <div />}
            <div className="text-[var(--accent)]">
                <Icon size={20} strokeWidth={1.5} />
            </div>
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
    const [nomeUsuario, setNomeUsuario] = useState<string>('');
    const [shareToken, setShareToken] = useState<string | null>(null);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [shareUniqueCamps, setShareUniqueCamps] = useState<string[]>([]);
    const [selectedShareCamps, setSelectedShareCamps] = useState<Record<string, boolean>>({});
    const [allGeneralRows, setAllGeneralRows] = useState<any[]>([]);
    const [allPlayerRows, setAllPlayerRows] = useState<any[]>([]);
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(false);
    const [isDashboardLoading, setIsDashboardLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);

    const [searchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
    const [filters, setFilters] = useState({ date: 'Todos', championship: 'Todos', round: 'Todos' });

    // Sincronizar aba ativa com a URL
    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab && tab !== activeTab) {
            setActiveTab(tab);
        } else if (!tab) {
            setActiveTab('overview');
        }
    }, [searchParams, activeTab]);
    const [timeFilter, setTimeFilter] = useState<'7d' | '30d' | 'all'>('all');
    const [specificDate, setSpecificDate] = useState<string>(''); // Novo filtro de data Dashboard
    
    // ─── Estados de Filtro Independentes para Aba Jogadores ───────────────────
    const [playerDateFilter, setPlayerDateFilter] = useState<string>('Todos');
    const [playerChampFilter, setPlayerChampFilter] = useState<string>('Todos');
    const [playerRoundFilter, setPlayerRoundFilter] = useState<string>('Todos');
    const [playerSelectedPlayer, setPlayerSelectedPlayer] = useState<string>('Todos');
    const [playerTableData, setPlayerTableData] = useState<any[]>([]);
    const [playerStatsLoading, setPlayerStatsLoading] = useState(false);
    const [playerChampOptions, setPlayerChampOptions] = useState<string[]>([]); // opções vindas direto da view

    // ─── Estados para Aba Rodadas ──────────────────────────────────────────
    const [roundChampFilter, setRoundChampFilter] = useState<string>('Todos');
    const [roundDateFilter, setRoundDateFilter] = useState<string>('Todos');
    const [expandedRound, setExpandedRound] = useState<string | null>(null); // data|mapa|rodada
    const [roundPlayerData, setRoundPlayerData] = useState<any[]>([]);

    // ─── Sincronização de Filtros Globais (Navbar) com Abas Locais ────────────
    useEffect(() => {
        setPlayerDateFilter(filters.date);
        setPlayerChampFilter(filters.championship);
        setPlayerRoundFilter(filters.round);
        
        setRoundChampFilter(filters.championship);
        setRoundDateFilter(filters.date); // aba rodadas não tem filtro de rodada em cima
    }, [filters.date, filters.championship, filters.round]);

    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [matchToDelete, setMatchToDelete] = useState<any>(null);
    const [selectedMap, setSelectedMap] = useState<string | null>(null);
    const [isSubscriber, setIsSubscriber] = useState(false);

    const { user } = useAuth();

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
            if (row.Campeonato) championships.add(String(row.Campeonato).trim());
        });

        // Rodadas dinâmicas baseadas no campeonato ativo
        const rounds = new Set<string>();
        allGeneralRows.forEach(row => {
            const matchChamp = filters.championship === 'Todos' || String(row.Campeonato).trim().toUpperCase() === filters.championship.trim().toUpperCase();
            const matchDate = filters.date === 'Todos' || String(row.Data) === filters.date;
            if (matchChamp && matchDate && row.Rodada) rounds.add(String(row.Rodada));
        });

        return { 
            dates: Array.from(dates).sort(), 
            championships: Array.from(championships).sort(),
            rounds: Array.from(rounds).sort((a, b) => Number(a) - Number(b))
        };
    }, [allGeneralRows, filters.championship, filters.date]);

    useEffect(() => {
        if (!user) return;

        const fetchPerfil = async () => {
            const { data } = await supabase
                .from('perfis')
                .select('nome, email, share_token')
                .eq('id', user.id)
                .single();
            if (data) {
                setNomeUsuario(data.nome || data.email || user.email || '');
                setShareToken(data.share_token);
            }
        };

        const fetchDashboardData = async () => {
            if (!user) return;
            setIsDashboardLoading(true);
            setFetchError(null);
            try {
                const [generalRes, playersRes] = await Promise.all([
                    supabase.from('partidas_geral').select('*').eq('user_id', user.id).order('data', { ascending: false }).order('created_at', { ascending: false }),
                    supabase.from('performance_jogadores').select('*').eq('user_id', user.id).order('data', { ascending: false }).order('created_at', { ascending: false })
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
                    "Resultado quebra": row.resultado_quebra,
                    id: row.id // ESSENCIAL PARA DELETAR
                }));
                setAllGeneralRows(mappedGeneral);

                // Mapeia exatamente as colunas reais de performance_jogadores
                const mappedPlayers = (playersRes.data || []).map(row => ({
                    Data: row.data,
                    Campeonato: row.campeonato,
                    Rodada: row.rodada,
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
                    "Ressurgimento": row.ressurgimento,
                    Quedas: row.quedas,
                    KD: row.kd,
                    MD: row.md,
                    Revividos: row.revividos
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

        const checkSubscription = async () => {
            const { data } = await supabase
                .from('subscriptions')
                .select('*')
                .eq('user_id', user.id)
                .eq('status', 'ativo')
                .gt('data_fim', new Date().toISOString())
                .maybeSingle();
            setIsSubscriber(!!data);
        };

        fetchPerfil();
        fetchDashboardData();
        checkSubscription();

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



    // ─── Helpers de Normalização para Joins ─────────────────────────────────────


    const normalizeMap = (m: any) => String(m || '').trim().toUpperCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "");



    const filteredGeneralRows = useMemo(() => {
        const now = new Date();
        const timeLimit = timeFilter === '7d'
            ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            : timeFilter === '30d'
                ? new Date(now.getFullYear(), now.getMonth(), 1)
                : null;

        return allGeneralRows.filter(row => {
            const matchChamp = filters.championship === 'Todos' || String(row.Campeonato) === filters.championship;
            const matchMap = !selectedMap || normalizeMap(row.Mapa) === normalizeMap(selectedMap);
            const matchRound = filters.round === 'Todos' || String(row.Rodada) === filters.round;
            
            if (specificDate) {
                const rowDateStr = String(row.Data || '');
                const formattedSpecific = specificDate.split('-').reverse().join('/');
                return (rowDateStr === specificDate || rowDateStr === formattedSpecific) && matchChamp && matchMap && matchRound;
            }

            const matchDate = filters.date === 'Todos' || String(row.Data) === filters.date;
            if (!matchDate || !matchChamp || !matchMap || !matchRound) return false;

            if (!timeLimit) return true;
            const dateStr = String(row.Data || '');
            const parts = dateStr.split('/');
            const parsed = parts.length === 3
                ? new Date(`${parts[2]}-${parts[1]}-${parts[0]}`)
                : new Date(dateStr);
            return !isNaN(parsed.getTime()) && parsed >= timeLimit;
        });
    }, [allGeneralRows, filters.date, filters.championship, timeFilter, specificDate, selectedMap]);


    // ─── Métricas unificadas e filtradas ─────────────────────────────────────────
    const filteredPlayerRows = useMemo(() => {
        const now = new Date();
        const timeLimit = timeFilter === '7d'
            ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            : timeFilter === '30d'
                ? new Date(now.getFullYear(), now.getMonth(), 1)
                : null;

        return allPlayerRows.filter(row => {
            
            const champ = String(row.Campeonato || '').trim().toUpperCase() || 'SEM EVENTO';
            const matchChamp = filters.championship === 'Todos' || champ === filters.championship.trim().toUpperCase();
            
            const matchRound = filters.round === 'Todos' || String(row.Rodada) === filters.round;
            const matchMap = !selectedMap || normalizeMap(row.Mapa) === normalizeMap(selectedMap);
            
            // Usar specificDate (filtro global) como fonte primária de verdade
            if (specificDate) {
                const rowDateStr = String(row.Data || '');
                const formattedSpecific = specificDate.split('-').reverse().join('/');
                return (rowDateStr === specificDate || rowDateStr === formattedSpecific) && matchChamp && matchMap && matchRound;
            }

            const matchDate = filters.date === 'Todos' || String(row.Data) === filters.date;
            if (!matchDate || !matchChamp || !matchMap || !matchRound) return false;
            
            if (!timeLimit) return true;
            
            const dateStr = String(row.Data || '');
            const parts = dateStr.split('/');
            const parsed = parts.length === 3
                ? new Date(`${parts[2]}-${parts[1]}-${parts[0]}`)
                : new Date(dateStr);
            return !isNaN(parsed.getTime()) && parsed >= timeLimit;
        });
    }, [allPlayerRows, filters.date, filters.championship, filters.round, timeFilter, specificDate, selectedMap]);



    // ─── Atribuir processData baseado no novo filtered central ──────────────
    useEffect(() => {
        if (filteredGeneralRows.length === 0 && filteredPlayerRows.length === 0) {
            if (allGeneralRows.length > 0 || allPlayerRows.length > 0) {
                setData(processData([], [])); // Mantém estrutura mas zerado
            } else {
                setData(null);
            }
            return;
        }
        setData(processData(filteredGeneralRows, filteredPlayerRows));
    }, [filteredGeneralRows, filteredPlayerRows]);

    const playerList = useMemo(() => {
        return Array.from(new Set(allPlayerRows.map((p: any) => p.Player).filter(Boolean))).sort() as string[];
    }, [allPlayerRows]);

    // ─── Novos Dados da Aba Jogadores (Tabela, Funil, Donut, Linha) ───
    const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc'|'desc'}>({ key: 'abates', direction: 'desc' });
    const [playerRawData, setPlayerRawData] = useState<any[]>([]);

    // ─── Busca e Processamento Independente para Aba Jogadores ────────────────
    useEffect(() => {
        if (!user || activeTab !== 'players') return;
        
        let isCancelled = false; // Flag de cancelamento
        
        const fetchPlayerTabData = async () => {
            setPlayerStatsLoading(true);
            setPlayerTableData([]);
            setPlayerRawData([]);
            
            try {
                // Busca dados e opções do dropdown em paralelo, ambos da view
                const [perfRes, champsRes] = await Promise.all([
                    supabase
                        .from('vw_jogadores_com_campeonato')
                        .select('*')
                        .eq('user_id', user.id),
                    supabase
                        .from('vw_jogadores_com_campeonato')
                        .select('campeonato_correto')
                        .eq('user_id', user.id)
                        .not('campeonato_correto', 'is', null)
                ]);

                // Se o componente desmontou ou filtro mudou, ignora o resultado
                if (isCancelled) return;
                if (perfRes.error) throw perfRes.error;

                // Popula dropdown de campeonato direto da view (fonte única de verdade)
                if (!champsRes.error && champsRes.data) {
                    const uniqueChamps = Array.from(
                        new Set(champsRes.data.map((r: any) => String(r.campeonato_correto).trim().toUpperCase()))
                    ).sort() as string[];
                    setPlayerChampOptions(uniqueChamps);
                }

                const allPerfRows = perfRes.data || [];
                
                const rows = allPerfRows.filter((p: any) => {
                    // Normaliza campeonato usando sempre campeonato_correto da view como fonte primária
                    const campReal = p.campeonato_correto
                        ? String(p.campeonato_correto).trim().toUpperCase()
                        : p.campeonato
                            ? String(p.campeonato).trim().toUpperCase()
                            : 'SEM EVENTO';

                    const normPlayer = String(p.player).trim().toUpperCase();
                    const matchDate = playerDateFilter === 'Todos' || p.data === playerDateFilter;
                    const matchPlayer = playerSelectedPlayer === 'Todos' || normPlayer === playerSelectedPlayer.trim().toUpperCase();
                    const matchChamp = playerChampFilter === 'Todos' || campReal === playerChampFilter.trim().toUpperCase();
                    const roundText = p.rodada ? String(p.rodada).trim() : '';
                    const matchRound = playerRoundFilter === 'Todos' || roundText === playerRoundFilter;
                    return matchDate && matchPlayer && matchChamp && matchRound;
                });

                if (isCancelled) return; // Checa novamente após filtro

                if (!rows || rows.length === 0) {
                    setPlayerTableData([]);
                    setPlayerRawData([]);
                    return;
                }

                const jogadoresMap: Record<string, any> = {};

                rows.forEach((p: any) => {
                    const nome = p.player;
                    if (!jogadoresMap[nome]) {
                        jogadoresMap[nome] = {
                            name: nome,
                            kills: 0,
                            damage: 0,
                            assists: 0,
                            deaths: 0,
                            derrubados: 0,
                            partidas: new Set<string>()
                        };
                    }
                    // Usa os nomes reais das colunas da view (herdados de performance_jogadores)
                    jogadoresMap[nome].kills += Number(p.kill) || 0;
                    jogadoresMap[nome].damage += Number(p.dano_causado) || 0;
                    jogadoresMap[nome].assists += Number(p.assistencia) || 0;
                    jogadoresMap[nome].deaths += Number(p.morte) || 0;
                    jogadoresMap[nome].derrubados += Number(p.derrubados) || 0;
                    // Cada linha é uma partida única — usa partida_id (quando disponível) para não perder mapas repetidos
                    const uniqueMatchId = p.partida_id ? String(p.partida_id) : `${p.data}|${p.campeonato}|${p.rodada}|${p.mapa}`;
                    jogadoresMap[nome].partidas.add(uniqueMatchId);
                });

                if (isCancelled) return; // Checa antes de setar estado

                let arr = Object.values(jogadoresMap).map((p: any) => ({
                    name: p.name,
                    abates: p.kills,
                    mortes: p.deaths,
                    assistencias: p.assists,
                    dano: p.damage,
                    kd: parseFloat((p.kills / Math.max(1, p.deaths)).toFixed(2)),
                    derrubados: p.derrubados,
                    quedas: p.partidas.size,
                }));

                arr.sort((a: any, b: any) => {
                    let valA = a[sortConfig.key];
                    let valB = b[sortConfig.key];
                    if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
                    if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
                    return 0;
                });

                setPlayerTableData(arr);
                // Salvar as linhas brutas (cada rodada) para renderização do gráfico de evolução na Timeline
                setPlayerRawData(rows);

            } catch (err: any) {
                if (!isCancelled) {
                    showToast(`Erro: ${err.message || 'Erro ao carregar estatísticas'}`, 'error');
                }
            } finally {
                if (!isCancelled) {
                    setPlayerStatsLoading(false);
                }
            }
        };

        fetchPlayerTabData();

        // Cleanup: cancela fetch anterior quando filtro mudar
        return () => {
            isCancelled = true;
        };

    }, [user, activeTab, playerDateFilter, playerChampFilter, playerRoundFilter, playerSelectedPlayer, sortConfig]);

    // Dados para os gráficos baseados na busca independente
    const maxAbates = useMemo(() => Math.max(...playerTableData.map((p: any) => p.abates), 1), [playerTableData]);

    const donutData = useMemo(() => {
        const PURPLE_PALETTE = ['#7C3AED', '#9D5FF5', '#B47FFB', '#5B21B6', '#C4B5FD', '#6D28D9', '#DDD6FE'];
        return playerTableData.map((p: any, i: number) => ({
            name: p.name,
            value: p.abates,
            fill: PURPLE_PALETTE[i % PURPLE_PALETTE.length]
        }));
    }, [playerTableData]);

    const quedasDonutData = useMemo(() => {
        const PURPLE_PALETTE = ['#7C3AED', '#9D5FF5', '#B47FFB', '#5B21B6', '#C4B5FD', '#6D28D9', '#DDD6FE'];
        return playerTableData.map((p: any, i: number) => ({
            name: p.name,
            value: p.quedas,
            fill: PURPLE_PALETTE[i % PURPLE_PALETTE.length]
        }));
    }, [playerTableData]);

    const pyramidData = useMemo(() => {
        return [...playerTableData].sort((a: any, b: any) => b.dano - a.dano);
    }, [playerTableData]);

    const lineChartData = useMemo(() => {
        // Mapeia os dados brutos de cada queda (da view vw_jogadores_com_campeonato)
        return playerRawData.map((row: any) => ({
            name: row.player, // O XAxis e o Tooltip usam 'name' por padrão nos gráficos da aplicação
            player: row.player,
            kill: Number(row.kill) || 0,
            assistencia: Number(row.assistencia) || 0
        }));
    }, [playerRawData]);

    // Total de Kills somado de todos os jogadores (performance_jogadores)


    const globalSquadStats = useMemo(() => {
        const quedas = filteredGeneralRows.length || 1;
        const totalKills = filteredPlayerRows.reduce((sum, p) => sum + (Number(p.Kill) || 0), 0);
        const totalDerrubados = filteredPlayerRows.reduce((sum, p) => sum + (Number(p.Derrubados) || 0), 0);
        
        return {
            quedas: filteredGeneralRows.length,
            kd: parseFloat((totalKills / (filteredGeneralRows.length || 1)).toFixed(2)),
            medAbates: parseFloat((totalKills / quedas).toFixed(2)),
            medDerrubados: parseFloat((totalDerrubados / quedas).toFixed(2))
        };
    }, [filteredGeneralRows, filteredPlayerRows]);

    // ─── Métricas novas da aba overview ───────────────────────────────────────
    const overviewExtras = useMemo(() => {
        if (!data) return null;

        const rows = filteredGeneralRows;
        const total = rows.length || 1;

        // Taxas TOP
        const top3 = rows.filter(r => Number(r.Colocacao) <= 3).length;
        const top5 = rows.filter(r => Number(r.Colocacao) <= 5).length;
        const top12 = rows.filter(r => Number(r.Colocacao) <= 12).length;
        const booyahs = rows.filter(r => r.Booyah === 'SIM').length;

        // Booyahs por mapa
        const byMapAgg: Record<string, number> = {};
        rows.forEach(r => {
            if (r.Booyah === 'SIM' && r.Mapa) {
                byMapAgg[String(r.Mapa)] = (byMapAgg[String(r.Mapa)] || 0) + 1;
            }
        });
        const booyahsByMap = Object.entries(byMapAgg)
            .sort(([,a],[,b]) => b - a)
            .map(([mapa, qtd]) => ({ mapa, qtd }));

        // Média de pontos por evento (campeonato)
        const byChamp: Record<string, { sum: number; count: number }> = {};
        rows.forEach(r => {
            const c = String(r.Campeonato || 'Sem Evento');
            if (!byChamp[c]) byChamp[c] = { sum: 0, count: 0 };
            byChamp[c].sum += Number(r.Pontos_Total) || 0;
            byChamp[c].count += 1;
        });
        const avgByChamp = Object.entries(byChamp)
            .map(([evento, { sum, count }]) => ({ evento, media: parseFloat((sum / count).toFixed(2)) }))
            .sort((a, b) => b.media - a.media);

        // Histórico média pontos por queda (por rodada)
        const byRound: Record<string, { sum: number; count: number }> = {};
        rows.forEach(r => {
            const round = String(r.Rodada || '');
            if (!round) return;
            if (!byRound[round]) byRound[round] = { sum: 0, count: 0 };
            byRound[round].sum += Number(r.Pontos_Total) || 0;
            byRound[round].count += 1;
        });
        const avgPontosByRound = Object.entries(byRound)
            .sort(([a],[b]) => Number(a) - Number(b))
            .map(([rodada, { sum, count }]) => ({ rodada: Number(rodada), media: parseFloat((sum / count).toFixed(2)) }));

        return {
            taxaBooyah: parseFloat(((booyahs / total) * 100).toFixed(2)),
            taxaTop3: parseFloat(((top3 / total) * 100).toFixed(2)),
            taxaTop5: parseFloat(((top5 / total) * 100).toFixed(2)),
            taxaTop12: parseFloat(((top12 / total) * 100).toFixed(2)),
            booyahsByMap,
            avgByChamp,
            avgPontosByRound,
        };
    }, [data, filteredGeneralRows]);

    const roundsTabRows = useMemo(() => {
        return allGeneralRows.filter(row => {
            const champ = String(row.Campeonato || '').trim().toUpperCase();
            const matchChamp = roundChampFilter === 'Todos' || champ === roundChampFilter.trim().toUpperCase();
            const matchDate = roundDateFilter === 'Todos' || String(row.Data) === roundDateFilter;
            return matchChamp && matchDate;
        }).sort((a, b) => {
            const dateA = a.Data.includes('/') ? new Date(a.Data.split('/').reverse().join('-')) : new Date(a.Data);
            const dateB = b.Data.includes('/') ? new Date(b.Data.split('/').reverse().join('-')) : new Date(b.Data);
            if (dateA.getTime() !== dateB.getTime()) return dateA.getTime() - dateB.getTime();
            return Number(a.Rodada) - Number(b.Rodada);
        });
    }, [allGeneralRows, roundChampFilter, roundDateFilter]);

    const roundsStats = useMemo(() => {
        if (roundsTabRows.length === 0) return null;
        const points = roundsTabRows.map(r => Number(r.Pontos_Total) || 0);
        const best = roundsTabRows.reduce((a, b) => (Number(a.Pontos_Total) || 0) > (Number(b.Pontos_Total) || 0) ? a : b);
        const worst = roundsTabRows.reduce((a, b) => (Number(a.Pontos_Total) || 0) < (Number(b.Pontos_Total) || 0) ? a : b);
        return {
            total: roundsTabRows.length,
            best: Number(best.Pontos_Total) || 0,
            worst: Number(worst.Pontos_Total) || 0,
            avg: parseFloat((points.reduce((a, b) => a + b, 0) / roundsTabRows.length).toFixed(1))
        };
    }, [roundsTabRows]);

    const roundsChartData = useMemo(() =>
        roundsTabRows.map((r, index) => ({
            name: `R${r.Rodada}-${index}`,
            pontos: Number(r.Pontos_Total)
        })),
        [roundsTabRows]
    );

    useEffect(() => {
        if (!expandedRound || !user) {
            setRoundPlayerData([]);
            return;
        }
        const [campeonato, rodada] = expandedRound.split('|');
        const fetchRoundPlayers = async () => {
            const { data } = await supabase
                .from('vw_jogadores_com_campeonato')
                .select('*')
                .eq('user_id', user.id)
                .ilike('campeonato_correto', campeonato.trim())
                .eq('rodada', rodada);
            setRoundPlayerData(data || []);
        };
        fetchRoundPlayers();
    }, [expandedRound, user]);

    // Cálculo da evolução diária (Média e Total por dia)
    const dailyEvolData = useMemo(() => {
        if (!allGeneralRows || allGeneralRows.length === 0) return [];
        
        const groups = filteredGeneralRows.reduce((acc: Record<string, { total: number; count: number }>, row) => {
            const dateStr = String(row.Data || '');
            if (!dateStr) return acc;
            
            if (!acc[dateStr]) acc[dateStr] = { total: 0, count: 0 };
            acc[dateStr].total += Number(row.Pontos_Total) || 0;
            acc[dateStr].count += 1;
            return acc;
        }, {});

        return Object.entries(groups)
            .map(([date, g]) => ({
                date,
                name: date.includes('-') 
                    ? date.split('-').reverse().slice(0, 2).join('/') // YYYY-MM-DD -> DD/MM
                    : date.split('/').slice(0, 2).join('/'),          // DD/MM/YYYY -> DD/MM
                media: Math.round(g.total / (g.count || 1)),
                total: g.total
            }))
            .sort((a, b) => {
                // Tenta parsear datas em formatos diferentes para ordenação estável
                const dateA = a.date.includes('/') ? new Date(a.date.split('/').reverse().join('-')) : new Date(a.date);
                const dateB = b.date.includes('/') ? new Date(b.date.split('/').reverse().join('-')) : new Date(b.date);
                return dateA.getTime() - dateB.getTime();
            });
    }, [filteredGeneralRows]);

    const pointsByMapData = useMemo(() => {
        if (!data?.byMap) return [];
        return data.byMap.map(m => ({
            mapa: m.mapa,
            total: (m.totalPontos || 0)
        })).sort((a, b) => b.total - a.total);
    }, [data?.byMap]);

    // Cálculo do Melhor e Pior Mapa
    const mapComparisonData = useMemo(() => {
        if (!allGeneralRows || allGeneralRows.length === 0) return null;
        
        const mapStats: Record<string, { total: number; count: number }> = {};
        filteredGeneralRows.forEach(row => {
            const m = String(row.Mapa || 'Desconhecido');
            if (!mapStats[m]) mapStats[m] = { total: 0, count: 0 };
            mapStats[m].total += Number(row.Pontos_Total) || 0;
            mapStats[m].count += 1;
        });

        const sorted = Object.entries(mapStats)
            .map(([mapa, { total, count }]) => ({
                mapa,
                total,
                media: parseFloat((total / count).toFixed(2))
            }))
            .sort((a, b) => b.total - a.total);

        if (sorted.length === 0) return null;
        
        return {
            best: sorted[0],
            worst: sorted[sorted.length - 1]
        };
    }, [filteredGeneralRows]);

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

    const handleShareDashboard = async () => {
        if (!shareToken || !user) {
            showToast('Erro ao gerar link de compartilhamento. Tente recarregar.', 'error');
            return;
        }
        
        setIsShareModalOpen(true);
        const { data: camps } = await supabase
            .from('partidas_geral')
            .select('campeonato')
            .eq('user_id', user.id)
            .order('campeonato');
            
        if (camps) {
            const unique = Array.from(new Set(camps.map(c => c.campeonato).filter(Boolean)));
            setShareUniqueCamps(unique);
            const initialSelected: Record<string, boolean> = {};
            unique.forEach(c => initialSelected[c] = true);
            setSelectedShareCamps(initialSelected);
        }
    };

    const confirmShareDashboard = () => {
        const selected = shareUniqueCamps.filter(c => selectedShareCamps[c]);
        const campsParam = selected.map(c => encodeURIComponent(c)).join(',');
        const params = campsParam ? `?camps=${campsParam}` : '';
        const shareUrl = `${window.location.origin}/squad/${shareToken}${params}`;
        
        navigator.clipboard.writeText(shareUrl).then(() => {
            showToast('✅ Link copiado! Envie para o seu squad.', 'success');
            setIsShareModalOpen(false);
        }).catch(() => {
            showToast('Erro ao copiar link.', 'error');
        });
    };

    const handleDeleteMatch = async () => {
        if (!user || !matchToDelete) return;

        console.log('Deletando:', matchToDelete);

        if (!matchToDelete.id) {
            showToast('ID da partida não encontrado.', 'error');
            return;
        }

        setLoading(true);
        try {
            // Deleção em paralelo
            const [resGeneral, resPerformance] = await Promise.all([
                supabase.from('partidas_geral').delete().eq('id', matchToDelete.id),
                supabase.from('performance_jogadores')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('data', String(matchToDelete.Data))
                    .eq('mapa', String(matchToDelete.Mapa))
            ]);

            if (resGeneral.error) throw resGeneral.error;
            if (resPerformance.error) throw resPerformance.error;

            // Atualização local do estado
            setAllGeneralRows(prev => prev.filter(r => r.id !== matchToDelete.id));
            setAllPlayerRows(prev => prev.filter(p => 
                !(String(p.Data) === String(matchToDelete.Data) && 
                  String(p.Mapa) === String(matchToDelete.Mapa) && 
                  Number(p.Posicao) === Number(matchToDelete.Rodada))
            ));

            showToast('Queda removida com sucesso! 🗑️', 'success');
            setIsDeleteModalOpen(false);
            setMatchToDelete(null);
        } catch (err: any) {
            console.error('Erro ao deletar:', err);
            showToast('Erro ao remover queda.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-[var(--bg-main)]">

            {/* Controle de Onboarding */}
            <OnboardingModal />

            {/* Toast Feedback */}
            {toast && <Toast message={toast.message} type={toast.type} />}

            {/* Modal de Compartilhamento Específico */}
            {isShareModalOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="card w-full max-w-sm p-8 animate-reveal border-[var(--accent)]/30">
                        <div className="flex flex-col items-center text-center">
                            <div className="p-4 rounded-full bg-[var(--accent-muted)] text-[var(--accent)] mb-6">
                                <Users size={32} />
                            </div>
                            <h3 className="text-heading text-lg">Compartilhar Squad</h3>
                            <p className="text-label mt-2 px-4 mb-6">Selecione quais campeonatos exibir na página pública:</p>
                        </div>
                        <div className="max-h-60 overflow-y-auto space-y-2 mb-6 pr-2">
                            {shareUniqueCamps.map(camp => (
                                <label key={camp} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] cursor-pointer hover:border-[var(--accent)] transition-colors">
                                    <input 
                                        type="checkbox" 
                                        className="w-4 h-4 accent-purple-500 rounded"
                                        checked={!!selectedShareCamps[camp]}
                                        onChange={(e) => setSelectedShareCamps(prev => ({ ...prev, [camp]: e.target.checked }))}
                                    />
                                    <span className="text-xs font-bold text-zinc-300 uppercase">{camp}</span>
                                </label>
                            ))}
                            {shareUniqueCamps.length === 0 && (
                                <p className="text-zinc-500 text-xs text-center">Nenhum evento encontrado.</p>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => setIsShareModalOpen(false)} className="btn-ghost">Cancelar</button>
                            <button onClick={confirmShareDashboard} className="btn-primary flex items-center justify-center gap-2">Copiar Link</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Confirmação de Deleção */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="card w-full max-w-sm p-8 animate-reveal border-[var(--accent-red)]/30">
                        <div className="flex flex-col items-center text-center">
                            <div className="p-4 rounded-full bg-red-500/10 text-red-500 mb-6">
                                <AlertCircle size={32} />
                            </div>
                            <h3 className="text-heading text-lg">Remover Queda?</h3>
                            <p className="text-label mt-2 px-4">
                                Tem certeza que deseja apagar esta queda? <br/>
                                <span className="text-white">Mapa: {matchToDelete?.Mapa} | Rodada: #{matchToDelete?.Rodada}</span>
                            </p>
                            <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest mt-4">Esta ação não pode ser desfeita.</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mt-8">
                            <button
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="btn-ghost"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDeleteMatch}
                                className="btn-primary !bg-red-600 hover:!bg-red-700 shadow-lg shadow-red-900/20 flex items-center justify-center gap-2"
                                disabled={loading}
                            >
                                {loading ? <RefreshCcw size={14} className="animate-spin" /> : <Trash2 size={14} />} Apagar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Importação */}
            <ImportModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onUpload={handleFileUpload}
                onDownloadTemplate={handleTemplateDownload}
                loading={loading}
            />

            <SidebarLayout activeTab={activeTab} isSubscriber={isSubscriber}>

                {/* Header / Top Bar */}
                <header
                    className="flex flex-col gap-4 px-8 py-5 z-40 backdrop-blur-md sticky top-0 bg-[var(--bg-surface)] border-b border-[var(--border-subtle)]"
                >
                    {/* Linha 1: Breadcrumb + Profile */}
                    <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-4">
                            <div className="hidden md:flex items-center text-[12px] uppercase tracking-widest text-[#6B7280] font-bold">
                                <span>CONTROLE</span>
                                <span className="mx-2 opacity-50">›</span>
                                <span>
                                    {activeTab === 'overview' ? 'DASHBOARD' : activeTab === 'players' ? 'JOGADORES' : activeTab === 'rounds' ? 'RODADAS' : 'ANÁLISE'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Linha 2: Filtros */}
                    <div className="flex items-center justify-start w-full gap-4">
                        {/* ── Filtros de Tempo Rápido (Tabs) ── */}
                        <div className="hidden lg:flex items-center gap-[8px]">
                            {([{ id: '7d', label: '7 DIAS' }, { id: '30d', label: 'ESTE MÊS' }, { id: 'all', label: 'TODOS' }] as const).map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => { setTimeFilter(t.id); setSpecificDate(''); }}
                                    className={`px-[12px] py-[6px] rounded-[8px] text-[13px] border border-[var(--border-default)] transition-all ${timeFilter === t.id && !specificDate ? 'bg-[var(--accent-muted)] border-[var(--accent)] text-[var(--accent-hover)] font-bold' : 'bg-[#1A1A1A] text-[var(--text-secondary)] hover:bg-[var(--accent-muted)] font-medium'} ${specificDate ? 'opacity-50 grayscale' : ''}`}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>

                        {/* Filtros por Data / Campeonato */}
                        <div className="hidden lg:flex items-center gap-2">
                            {/* Dropdown de Datas Dashboard */}
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#09090b] border border-[var(--border-default)] transition-all ${specificDate ? 'border-[var(--accent)] ring-1 ring-[var(--accent)]/30' : ''}`}>
                                <Calendar size={13} className={specificDate ? 'text-[var(--accent)]' : 'text-[var(--text-tertiary)]'} />
                                <select 
                                    value={specificDate}
                                    onChange={(e) => {
                                        setSpecificDate(e.target.value);
                                        if (e.target.value) setTimeFilter('all'); // Desativa período se selecionar data
                                    }}
                                    className="bg-transparent text-white outline-none border-none text-xs cursor-pointer appearance-none min-w-[100px]"
                                >
                                    <option value="" className="bg-[#09090b]">Filtrar por Data</option>
                                    {filterOptions.dates.map(d => {
                                        const displayDate = d.includes('-') ? d.split('-').reverse().join('/') : d;
                                        return <option key={d} value={d} className="bg-[#09090b]">{displayDate}</option>;
                                    })}
                                </select>
                                {specificDate && (
                                    <button onClick={() => setSpecificDate('')} className="ml-1 text-[var(--text-tertiary)] hover:text-white transition-colors">
                                        <XCircle size={14} />
                                    </button>
                                )}
                            </div>

                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-default)] text-label">
                                <Trophy size={13} className="text-[var(--accent)]" />
                                <select
                                    value={filters.championship}
                                    onChange={e => setFilters(prev => ({ ...prev, championship: e.target.value }))}
                                    className="outline-none cursor-pointer bg-zinc-950 text-white border-none py-1.5 px-2 rounded-md hover:bg-zinc-900 transition-colors"
                                >
                                    <option value="Todos">Todos os Eventos</option>
                                    {filterOptions.championships.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>

                            {/* Dropdown de Rodada Dashboard */}
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#09090b] border border-[var(--border-default)]">
                                <Activity size={13} className="text-[var(--text-tertiary)]" />
                                <select 
                                    value={filters.round}
                                    onChange={(e) => setFilters({ ...filters, round: e.target.value })}
                                    className="bg-transparent text-white outline-none border-none text-xs cursor-pointer appearance-none min-w-[100px]"
                                >
                                    <option value="Todos" className="bg-[#09090b]">Todas Rodadas</option>
                                    {filterOptions.rounds.map(r => (
                                        <option key={r} value={r} className="bg-[#09090b]">Rodada {String(r).padStart(2, '0')}</option>
                                    ))}
                                </select>
                            </div>
                        </div>


                        {/* Profile */}
                        <div className="flex items-center gap-4 pl-4 border-l border-[var(--border-subtle)]">
                            <div className="hidden sm:flex flex-col text-right items-end gap-1">
                                <span className="text-[13px] text-[#6B7280]">{nomeUsuario || user?.email || 'Analista'}</span>
                            </div>
                            <button
                                onClick={handleShareDashboard}
                                className="hidden md:flex items-center gap-2 text-[var(--accent)] text-[13px] hover:underline"
                                title="Compartilhar Dashboard"
                            >
                                <Link size={14} />
                                Link para Players
                            </button>
                            {/* Mobile version simple icon */}
                            <button
                                onClick={handleShareDashboard}
                                className="md:hidden btn-ghost p-2.5 text-[var(--accent)]"
                            >
                                <Link size={18} />
                            </button>

                            <div
                                className="w-10 h-10 rounded-full border-2 border-[var(--accent)] flex items-center justify-center font-bold text-xs bg-[var(--accent-muted)] text-[var(--accent-hover)]"
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
                                            {selectedMap && (
                                                <div className="flex items-center gap-2 mb-6 animate-fade-in group pointer-events-none">
                                                    <div className="bg-[var(--accent)]/10 border border-[var(--accent)]/20 px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg shadow-[var(--accent)]/5 backdrop-blur-sm pointer-events-auto">
                                                        <MapIcon size={12} className="text-[var(--accent)]" />
                                                        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent)]">
                                                            Filtrando por: {selectedMap}
                                                        </span>
                                                        <button 
                                                            onClick={() => setSelectedMap(null)}
                                                            className="hover:bg-[var(--accent)]/20 p-1 rounded-full transition-colors ml-1"
                                                            title="Limpar filtro de mapa"
                                                        >
                                                            <XCircle size={14} className="text-[var(--accent)]" />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                            {/* Principais Métricas */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                                                <MetricCard
                                                    title="Total de Kills"
                                                    value={data.general.totalKills}
                                                    subValue={`${data.general.mediaKills} por queda`}
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
                                                    title="Dano Médio"
                                                    value={data.squadMetrics.avgDamage.toLocaleString("pt-BR")}
                                                    subValue={`${data.squadMetrics.avgDamage} por queda`}
                                                    icon={Sword}
                                                />
                                            </div>

                                            {/* ── NOVAS MÉTRICAS ── */}
                                            {overviewExtras && (
                                                <>



                                                </>
                                            )}

                                            {/* Charts Row */}
                                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                                                <Card className="lg:col-span-2">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div>
                                                            <h4 className="text-heading">Pontos por Mapa</h4>
                                                            <p className="text-[12px] text-[#6B7280] mb-[16px]">Total de pontos por mapa</p>
                                                        </div>
                                                        <div className="p-2.5 text-[#4B5563] hover:text-[var(--accent)] transition-colors cursor-pointer">
                                                            <MapIcon size={16} />
                                                        </div>
                                                    </div>
                                                    <div className="h-72">
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <BarChart 
                                                                layout="horizontal" 
                                                                data={pointsByMapData} 
                                                                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                                                onClick={(e) => {
                                                                    if (e && e.activeLabel) {
                                                                        const mapClicked = String(e.activeLabel);
                                                                        setSelectedMap(prev => prev === mapClicked ? null : mapClicked);
                                                                    }
                                                                }}
                                                            >
                                                                <XAxis 
                                                                    dataKey="mapa" 
                                                                    axisLine={false} 
                                                                    tickLine={false} 
                                                                    tick={{ fontSize: 11, fill: 'var(--text-secondary)', fontWeight: 600 }} 
                                                                />
                                                                <YAxis hide type="number" />
                                                                <Tooltip 
                                                                    cursor={{ fill: 'rgba(124, 58, 237, 0.05)' }}
                                                                    contentStyle={neonTooltipStyle}
                                                                    itemStyle={neonItemStyle}
                                                                    labelStyle={neonLabelStyle}
                                                                />
                                                                <Bar 
                                                                    dataKey="total" 
                                                                    name="Pontos Totais"
                                                                    radius={[4, 4, 0, 0]} 
                                                                    barSize={24}
                                                                    style={{ cursor: 'pointer' }}
                                                                >
                                                                    {pointsByMapData.map((entry: any, index: number) => (
                                                                        <Cell 
                                                                            key={`cell-${index}`} 
                                                                            fill={selectedMap === entry.mapa ? '#A855F7' : '#7C3AED'}
                                                                            stroke={selectedMap === entry.mapa ? '#FFFFFF' : 'none'}
                                                                            strokeWidth={selectedMap === entry.mapa ? 2 : 0}
                                                                        />
                                                                    ))}
                                                                </Bar>
                                                            </BarChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                </Card>

                                                <Card className="flex flex-col h-full">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div>
                                                            <h4 className="text-heading">Performance por Mapa</h4>
                                                            <p className="text-[12px] text-[#6B7280] mb-[16px]">Comparação de pontuação extrema</p>
                                                        </div>
                                                        <div className="p-2.5 text-[#4B5563] hover:text-[var(--accent)] transition-colors cursor-pointer">
                                                            <MapIcon size={16} />
                                                        </div>
                                                    </div>

                                                    {!mapComparisonData ? (
                                                        <div className="flex flex-col items-center justify-center h-full py-10 opacity-30">
                                                            <MapIcon size={48} className="mb-4" />
                                                            <p className="text-label">Sem dados para comparar</p>
                                                        </div>
                                                    ) : (
                                                        <div className="grid grid-cols-2 gap-0 h-full">
                                                            {/* Melhor Mapa */}
                                                            <div className="pr-6 flex flex-col justify-center overflow-hidden">
                                                                <span className="text-[10px] whitespace-nowrap font-black uppercase tracking-[0.2em] text-[#10B981] mb-2 block">Melhor Mapa</span>
                                                                <h3 className="text-heading text-xl font-black uppercase tracking-tight mb-6 truncate">{mapComparisonData.best.mapa}</h3>
                                                                
                                                                <div className="space-y-4">
                                                                    <div>
                                                                        <div className="text-heading text-xl font-bold text-white whitespace-nowrap">{mapComparisonData.best.total}</div>
                                                                        <span className="text-label whitespace-nowrap !text-[#10B981]/80">Pontos no Melhor</span>
                                                                    </div>
                                                                    <div>
                                                                        <div className="text-heading text-xl font-semibold text-white/90 whitespace-nowrap">{mapComparisonData.best.media}</div>
                                                                        <span className="text-label whitespace-nowrap !text-[#10B981]/50">Média por queda</span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Pior Mapa */}
                                                            <div className="pl-6 border-l border-[var(--border-subtle)] flex flex-col justify-center overflow-hidden">
                                                                <span className="text-[10px] whitespace-nowrap font-black uppercase tracking-[0.2em] text-[#EF4444] mb-2 block">Pior Mapa</span>
                                                                <h3 className="text-heading text-xl font-black uppercase tracking-tight mb-6 truncate">{mapComparisonData.worst.mapa}</h3>
                                                                
                                                                <div className="space-y-4">
                                                                    <div>
                                                                        <div className="text-heading text-xl font-bold text-white whitespace-nowrap">{mapComparisonData.worst.total}</div>
                                                                        <span className="text-label whitespace-nowrap !text-[#EF4444]/80">Pontos no Pior</span>
                                                                    </div>
                                                                    <div>
                                                                        <div className="text-heading text-xl font-semibold text-white/90 whitespace-nowrap">{mapComparisonData.worst.media}</div>
                                                                        <span className="text-label whitespace-nowrap !text-[#EF4444]/50">Média por queda</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </Card>
                                            </div>

                                            {/* MVP & Squad Metrics */}
                                            {filteredPlayerRows.length > 0 && (
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                                    <Card className="p-6 md:col-span-2">
                                                        <div className="flex items-center justify-between mb-4">
                                                            <div>
                                                                <h4 className="text-heading">Evolução Diária</h4>
                                                                <p className="text-[12px] text-[#6B7280] mb-[16px]">Média e total de pontos por dia</p>
                                                            </div>
                                                            <div className="p-2.5 text-[#4B5563] hover:text-[var(--accent)] transition-colors cursor-pointer">
                                                                <TrendingUp size={16} />
                                                            </div>
                                                        </div>
                                                        <div className="h-56">
                                                            <ResponsiveContainer width="100%" height="100%">
                                                                <LineChart data={dailyEvolData} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                                                                    <CartesianGrid stroke="var(--border-subtle)" vertical={false} strokeDasharray="3 3" />
                                                                    <XAxis 
                                                                        dataKey="name" 
                                                                        tickLine={false} 
                                                                        axisLine={false} 
                                                                        tick={{ fontSize: 10, fill: 'var(--text-tertiary)', fontWeight: 600 }} 
                                                                    />
                                                                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }} />
                                                                    <Tooltip contentStyle={neonTooltipStyle} itemStyle={neonItemStyle} labelStyle={neonLabelStyle} />
                                                                    <Legend 
                                                                        verticalAlign="top" 
                                                                        align="right" 
                                                                        iconType="circle" 
                                                                        iconSize={8}
                                                                        wrapperStyle={{ fontSize: '10px', marginTop: '-20px' }}
                                                                    />
                                                                    <Line type="monotone" dataKey="media" name="Média" stroke="#7C3AED" strokeWidth={2} dot={{ r: 4, fill: '#7C3AED', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                                                                    <Line type="monotone" dataKey="total" name="Total" stroke="#9D5FF5" strokeWidth={2} dot={{ r: 4, fill: '#9D5FF5', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                                                                </LineChart>
                                                            </ResponsiveContainer>
                                                        </div>
                                                    </Card>

                                                    <Card className="md:col-span-1 p-6 flex flex-col justify-between">
                                                        <div className="flex items-center justify-between mb-4">
                                                            <div>
                                                                <h4 className="text-heading">Médias do squad</h4>
                                                                <p className="text-[12px] text-[#6B7280] mb-[16px]">Análise consolidada por queda</p>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <span className="badge badge-purple">GLOBAL</span>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="grid grid-cols-2 gap-4 h-full">
                                                            <div className="p-4 rounded-xl bg-[var(--bg-main)]/50 border border-[var(--border-subtle)] hover:border-[var(--accent)]/50 transition-all flex flex-col justify-between">
                                                                <div className="flex items-center justify-between text-[var(--accent)] mb-2">
                                                                    <span className="text-label !mt-0">Quedas</span>
                                                                    <Activity size={12} className="opacity-50" />
                                                                </div>
                                                                <div className="text-heading text-4xl font-black text-white">{globalSquadStats.quedas}</div>
                                                            </div>

                                                            <div className="p-4 rounded-xl bg-[var(--bg-main)]/50 border border-[var(--border-subtle)] hover:border-[var(--accent)]/50 transition-all flex flex-col justify-between">
                                                                <div className="flex items-center justify-between text-[var(--accent)] mb-2">
                                                                    <span className="text-label !mt-0">K/D</span>
                                                                    <TrendingUp size={12} className="opacity-50" />
                                                                </div>
                                                                <div className="text-heading text-4xl font-black text-white">{globalSquadStats.kd}</div>
                                                            </div>

                                                            <div className="p-4 rounded-xl bg-[var(--bg-main)]/50 border border-[var(--border-subtle)] hover:border-[var(--accent)]/50 transition-all flex flex-col justify-between">
                                                                <div className="flex items-center justify-between text-[var(--accent)] mb-2">
                                                                    <span className="text-label !mt-0">Abates</span>
                                                                    <Sword size={12} className="opacity-50" />
                                                                </div>
                                                                <div className="text-heading text-4xl font-black text-white">{globalSquadStats.medAbates}</div>
                                                            </div>

                                                            <div className="p-4 rounded-xl bg-[var(--bg-main)]/50 border border-[var(--border-subtle)] hover:border-[var(--accent)]/50 transition-all flex flex-col justify-between">
                                                                <div className="flex items-center justify-between text-[var(--accent)] mb-2">
                                                                    <span className="text-label !mt-0">Derrub.</span>
                                                                    <Target size={12} className="opacity-50" />
                                                                </div>
                                                                <div className="text-heading text-4xl font-black text-white">{globalSquadStats.medDerrubados}</div>
                                                            </div>
                                                        </div>
                                                    </Card>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}

                            {activeTab === 'security' && (
                                <SecurityTab />
                            )}

                            {/* ══════════ PLAYERS TAB ══════════ */}
                            {activeTab === 'players' && (
                                <div className="space-y-6 animate-reveal">
                                    <div className="flex flex-wrap items-center gap-4">
                                        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-default)]">
                                            <UserCircle2 size={16} className="text-[var(--accent)]" />
                                            <select
                                                value={playerSelectedPlayer}
                                                onChange={e => setPlayerSelectedPlayer(e.target.value)}
                                                className="bg-transparent text-[var(--text-primary)] border-none px-2 outline-none cursor-pointer min-w-[160px] font-bold text-sm"
                                            >
                                                <option value="Todos" className="bg-[#141416]">Todos os Jogadores</option>
                                                {playerList.map((p: any) => (
                                                    <option key={p} value={p} className="bg-[#141416]">{p}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-default)]">
                                            <Trophy size={16} className="text-[var(--accent)]" />
                                            <select
                                                value={playerChampFilter}
                                                onChange={e => setPlayerChampFilter(e.target.value)}
                                                className="bg-transparent text-[var(--text-primary)] border-none px-2 outline-none cursor-pointer min-w-[160px] font-bold text-sm"
                                            >
                                                <option value="Todos" className="bg-[#141416]">Todos os Eventos</option>
                                                {/* Usa playerChampOptions populado direto da view para evitar mismatch */}
                                                {playerChampOptions.map(c => (
                                                    <option key={c} value={c} className="bg-[#141416]">{c}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-default)]">
                                            <Calendar size={16} className="text-[var(--accent)]" />
                                            <select
                                                value={playerDateFilter}
                                                onChange={e => setPlayerDateFilter(e.target.value)}
                                                className="bg-transparent text-[var(--text-primary)] border-none px-2 outline-none cursor-pointer min-w-[160px] font-bold text-sm"
                                            >
                                                <option value="Todos" className="bg-[#141416]">Todas as Datas</option>
                                                {filterOptions.dates.map(d => (
                                                    <option key={d} value={d} className="bg-[#141416]">{d}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-default)]">
                                            <Activity size={16} className="text-[var(--accent)]" />
                                            <select
                                                value={playerRoundFilter}
                                                onChange={e => setPlayerRoundFilter(e.target.value)}
                                                className="bg-transparent text-[var(--text-primary)] border-none px-2 outline-none cursor-pointer min-w-[160px] font-bold text-sm"
                                            >
                                                <option value="Todos" className="bg-[#141416]">Todas as Rodadas</option>
                                                {filterOptions.rounds.map(r => (
                                                    <option key={r} value={r} className="bg-[#141416]">Rodada {String(r).padStart(2, '0')}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    
                                    {(playerSelectedPlayer !== 'Todos' || playerChampFilter !== 'Todos' || playerDateFilter !== 'Todos') && (
                                        <div className="flex items-center gap-2 mb-4 animate-fade-in group">
                                            <div className="bg-[#EAB308]/10 border border-[#EAB308]/20 px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg shadow-yellow-500/5 backdrop-blur-sm">
                                                <AlertCircle size={12} className="text-[#EAB308]" />
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-[#EAB308]">
                                                    Filtros Ativos
                                                </span>
                                                <button 
                                                    onClick={() => {
                                                        setPlayerSelectedPlayer('Todos');
                                                        setPlayerChampFilter('Todos');
                                                        setPlayerDateFilter('Todos');
                                                    }}
                                                    className="hover:bg-[#EAB308]/20 p-1 rounded-full transition-colors ml-1"
                                                    title="Limpar todos os filtros"
                                                >
                                                    <XCircle size={14} className="text-[#EAB308]" />
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* BLOCO 1: Tabela */}
                                    <Card className="!bg-[#141416] border-none p-0 overflow-hidden relative">
                                        {playerStatsLoading && (
                                            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-10 flex items-center justify-center">
                                                <RefreshCcw size={24} className="text-[var(--accent)] animate-spin" />
                                            </div>
                                        )}
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left">
                                                <thead className="border-b border-[#27272A] bg-[#18181B]">
                                                    <tr>
                                                        {[{ l: 'Player', k: 'name' }, { l: 'Abates', k: 'abates' }, { l: 'Mortes', k: 'mortes' }, { l: 'Assists', k: 'assistencias' }, { l: 'Dano', k: 'dano' }, { l: 'KD', k: 'kd' }, { l: 'Derrubados', k: 'derrubados' }, { l: 'Quedas', k: 'quedas' }].map(col => (
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
                                                    {playerTableData.map((row: any, i: number) => (
                                                        <tr key={i} className="hover:bg-white/5 transition-colors text-sm text-[#FAFAFA] font-medium">
                                                            <td className="px-6 py-4">{row.name}</td>
                                                            <td className="px-6 py-4 flex items-center gap-3">
                                                                <span className="w-6 text-right">{row.abates}</span>
                                                                <div className="h-2.5 bg-[#7C3AED] rounded-sm" style={{ width: `${Math.max(2, (row.abates / maxAbates) * 80)}px` }} />
                                                            </td>
                                                            <td className="px-6 py-4">{row.mortes}</td>
                                                            <td className="px-6 py-4">{row.assistencias}</td>
                                                            <td className="px-6 py-4">{row.dano.toLocaleString('pt-BR')}</td>
                                                            <td className="px-6 py-4 font-mono text-[#A1A1AA]">{String(row.kd).replace('.', ',')}</td>
                                                            <td className="px-6 py-4">{row.derrubados}</td>
                                                            <td className="px-6 py-4">{row.quedas}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </Card>

                                    {/* BLOCO 2: Dano | Kills | Quedas */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                        <Card className="!bg-[#141416] border-none flex flex-col items-center justify-center min-h-[300px]">
                                            <h4 className="text-[#EAB308] text-sm font-bold uppercase mb-6 tracking-widest">DANO</h4>
                                            <div className="w-full flex flex-col items-center gap-1">
                                                {pyramidData.map((p: any, i: number) => {
                                                    const maxD = pyramidData[0]?.dano || 1;
                                                    const wP = Math.max(30, (p.dano / maxD) * 100);
                                                    return (
                                                        <div key={i} 
                                                            className="h-8 flex items-center justify-center rounded uppercase text-[10px] font-black text-black/70 shadow-sm"
                                                            style={{ width: `${wP}%`, backgroundColor: `hsl(258, 83%, ${Math.min(90, 45 + (i * 8))}%)` }}
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
                                                            paddingAngle={2} dataKey="value" nameKey="name" stroke="none" labelLine={false}
                                                            label={({ percent }) => (percent && percent > 0.05) ? `${(percent * 100).toFixed(0)}%` : ''}
                                                            style={{ cursor: 'pointer' }}
                                                            onClick={(data: any) => {
                                                                if (data && data.name) {
                                                                    setPlayerSelectedPlayer(prev => prev === data.name ? 'Todos' : data.name);
                                                                }
                                                            }}
                                                        >
                                                            {donutData.map((d: any, i: number) => (
                                                                <Cell 
                                                                    key={`cell-${i}`} 
                                                                    fill={d.fill} 
                                                                    opacity={playerSelectedPlayer === 'Todos' || playerSelectedPlayer === d.name ? 1 : 0.4}
                                                                    stroke={playerSelectedPlayer === d.name ? '#FFFFFF' : 'none'}
                                                                    strokeWidth={playerSelectedPlayer === d.name ? 3 : 0}
                                                                />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip contentStyle={{ backgroundColor: '#18181B', border: 'none', borderRadius: '8px', color: '#FAFAFA' }} itemStyle={{ color: '#FAFAFA' }} />
                                                        <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" wrapperStyle={{ fontSize: '10px', color: '#FAFAFA', fontWeight: 'bold' }} />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </Card>

                                        <Card className="!bg-[#141416] border-none flex flex-col items-center justify-center min-h-[300px]">
                                            <h4 className="text-[#EAB308] text-sm font-bold uppercase mb-2 tracking-widest text-center">
                                                QUEDAS
                                                <span className="block text-[10px] text-[#A1A1AA] mt-1 font-normal lowercase italic tracking-normal">Partidas por jogador</span>
                                            </h4>
                                            <div className="w-full h-48 relative">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie
                                                            data={quedasDonutData} cx="50%" cy="50%" innerRadius={45} outerRadius={75}
                                                            paddingAngle={2} dataKey="value" nameKey="name" stroke="none" labelLine={false}
                                                            label={({ percent }) => (percent && percent > 0.05) ? `${(percent * 100).toFixed(0)}%` : ''}
                                                            style={{ cursor: 'pointer' }}
                                                            onClick={(data: any) => {
                                                                if (data && data.name) {
                                                                    setPlayerSelectedPlayer(prev => prev === data.name ? 'Todos' : data.name);
                                                                }
                                                            }}
                                                        >
                                                            {quedasDonutData.map((d: any, i: number) => (
                                                                <Cell 
                                                                    key={`cell-${i}`} 
                                                                    fill={d.fill} 
                                                                    opacity={playerSelectedPlayer === 'Todos' || playerSelectedPlayer === d.name ? 1 : 0.4}
                                                                    stroke={playerSelectedPlayer === d.name ? '#FFFFFF' : 'none'}
                                                                    strokeWidth={playerSelectedPlayer === d.name ? 3 : 0}
                                                                />
                                                            ))}
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
                                                <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#7C3AED]" /> Abates</span>
                                                <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#9D5FF5]" /> Assistência</span>
                                            </div>
                                        </div>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={lineChartData} margin={{ left: -20, bottom: 5, right: 20 }}>
                                                <CartesianGrid stroke="#27272A" vertical={false} strokeDasharray="3 3" />
                                                <XAxis dataKey="player" hide />
                                                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#A1A1AA' }} />
                                                <Tooltip contentStyle={{ backgroundColor: '#18181B', border: 'none', borderRadius: '8px' }} />
                                                <Line type="monotone" dataKey="kill" name="Abates" stroke="#7C3AED" strokeWidth={2} dot={{ r: 3, fill: '#7C3AED', strokeWidth: 0 }} />
                                                <Line type="monotone" dataKey="assistencia" name="Assistências" stroke="#9D5FF5" strokeWidth={2} dot={{ r: 3, fill: '#9D5FF5', strokeWidth: 0 }} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            )}

                            {/* ══════════ ROUNDS TAB ══════════ */}
                            {activeTab === 'rounds' && (
                                <div className="space-y-6 animate-reveal">
                                    <div className="flex flex-wrap items-center gap-4">
                                        <div className="flex items-center gap-4 px-4 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-default)]">
                                            <Trophy size={16} className="text-[var(--accent)]" />
                                            <select 
                                                value={roundChampFilter}
                                                onChange={(e) => setRoundChampFilter(e.target.value)}
                                                className="bg-transparent text-heading text-xs font-bold focus:outline-none min-w-[120px]"
                                            >
                                                <option value="Todos">Todos Eventos</option>
                                                {filterOptions.championships.map(c => (
                                                    <option key={c} value={c}>{c}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="flex items-center gap-4 px-4 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-default)]">
                                            <Calendar size={16} className="text-[var(--accent)]" />
                                            <select 
                                                value={roundDateFilter}
                                                onChange={(e) => setRoundDateFilter(e.target.value)}
                                                className="bg-transparent text-heading text-xs font-bold focus:outline-none min-w-[120px]"
                                            >
                                                <option value="Todos">Todas as Datas</option>
                                                {filterOptions.dates.map(d => (
                                                    <option key={d} value={d}>{d}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <MetricCard title="Total de Rodadas" value={roundsStats?.total || 0} icon={Activity} />
                                        <MetricCard title="Melhor Rodada" value={roundsStats?.best || 0} icon={Trophy} subValue="PONTOS" />
                                        <MetricCard title="Pior Rodada" value={roundsStats?.worst || 0} icon={Target} subValue="PONTOS" />
                                        <MetricCard title="Média de Pontos" value={roundsStats?.avg || 0} icon={TrendingUp} />
                                    </div>

                                    <Card className="p-0 overflow-hidden">
                                        <div className="p-6 border-b border-[var(--border-subtle)] bg-[var(--bg-card)]">
                                            <h4 className="text-heading text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                                                <TrendingUp size={16} className="text-[var(--accent)]" />
                                                Evolução de Pontos por Rodada
                                            </h4>
                                        </div>
                                        <div className="h-64 px-6 py-8">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={roundsChartData}>
                                                    <CartesianGrid stroke="#27272A" vertical={false} strokeDasharray="3 3" />
                                                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#A1A1AA' }} axisLine={false} tickLine={false} />
                                                    <YAxis tick={{ fontSize: 10, fill: '#A1A1AA' }} axisLine={false} tickLine={false} />
                                                    <Tooltip
                                                        contentStyle={neonTooltipStyle}
                                                        itemStyle={neonItemStyle}
                                                        labelStyle={neonLabelStyle}
                                                        formatter={(value: number | undefined) => [value ?? 0, 'PONTOS']}
                                                        labelFormatter={(label: unknown) => String(label)}
                                                    />
                                                    <Line 
                                                        type="monotone" 
                                                        dataKey="pontos"
                                                        name="PONTOS"
                                                        stroke="#7C3AED" 
                                                        strokeWidth={3}
                                                        dot={{ r: 5, fill: '#7C3AED', strokeWidth: 0 }}
                                                        activeDot={{ r: 8, fill: '#7C3AED', stroke: '#FFF', strokeWidth: 2 }}
                                                    />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </Card>

                                    <Card className="p-0 overflow-hidden">
                                        <table className="w-full text-xs text-left">
                                            <thead className="bg-[#18181B] border-b border-[#27272A]">
                                                <tr>
                                                    <th className="px-6 py-4 font-bold text-[#A1A1AA] uppercase">Rodada</th>
                                                    <th className="px-6 py-4 font-bold text-[#A1A1AA] uppercase">Mapa</th>
                                                    <th className="px-6 py-4 font-bold text-[#A1A1AA] uppercase text-center">Colocação</th>
                                                    <th className="px-6 py-4 font-bold text-[#A1A1AA] uppercase text-center">Kills Squad</th>
                                                    <th className="px-6 py-4 font-bold text-[#A1A1AA] uppercase text-center">Pontos</th>
                                                    <th className="px-6 py-4 font-bold text-[#A1A1AA] uppercase">Data</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[#27272A]">
                                                {roundsTabRows.map((row, i) => (
                                                    <React.Fragment key={i}>
                                                        <tr 
                                                            onClick={() => setExpandedRound(prev => prev === `${row.Campeonato}|${row.Rodada}` ? null : `${row.Campeonato}|${row.Rodada}`)}
                                                            className="hover:bg-white/5 transition-colors cursor-pointer group"
                                                        >
                                                            <td className="px-6 py-4 font-bold text-white">#{String(row.Rodada).padStart(2, '0')}</td>
                                                            <td className="px-6 py-4 font-bold uppercase text-[var(--text-primary)]">{row.Mapa}</td>
                                                            <td className="px-6 py-4 text-center">
                                                                <span className={`badge ${row.Colocacao === 1 ? 'badge-purple' : 'badge-ghost'}`}>
                                                                    P{row.Colocacao}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 text-center font-mono text-[var(--accent-red)]">{row.Kill}</td>
                                                            <td className="px-6 py-4 text-center font-bold text-white">{row.Pontos_Total}</td>
                                                            <td className="px-6 py-4 text-[#A1A1AA]">{row.Data}</td>
                                                        </tr>
                                                        {expandedRound === `${row.Campeonato}|${row.Rodada}` && (
                                                            <tr className="bg-white/5 animate-fade-in">
                                                                <td colSpan={6} className="px-8 py-4">
                                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4">
                                                                        {roundPlayerData.length === 0 ? (
                                                                            <div className="col-span-full text-center py-4 text-[#A1A1AA] italic">Carregando performance individual...</div>
                                                                        ) : (
                                                                            roundPlayerData.map((p, idx) => (
                                                                                <div key={idx} className="p-3 rounded-lg bg-black/30 border border-white/5">
                                                                                    <div className="text-[10px] font-bold text-[var(--accent)] uppercase mb-1">{p.player}</div>
                                                                                    <div className="flex justify-between items-center">
                                                                                        <span className="text-xs text-white"><Sword size={10} className="inline mr-1 opacity-50"/>{p.kill}</span>
                                                                                        <span className="text-xs text-white"><Target size={10} className="inline mr-1 opacity-50"/>{p.dano_causado}</span>
                                                                                        <span className={`text-[10px] ${p.morte === 0 ? 'text-green-400' : 'text-red-400'}`}>{p.morte === 0 ? 'SURVIVED' : 'ELIMINATED'}</span>
                                                                                    </div>
                                                                                </div>
                                                                            ))
                                                                        )}
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </React.Fragment>
                                                ))}
                                            </tbody>
                                        </table>
                                    </Card>
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
                                                            <th className="px-6 py-4 font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Data</th>
                                                            <th className="px-6 py-4 font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Torneio</th>
                                                            <th className="px-6 py-4 font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Rodada</th>
                                                            <th className="px-6 py-4 font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Mapa</th>
                                                            <th className="px-6 py-4 font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Rank</th>
                                                            <th className="px-6 py-4 font-bold text-[var(--text-tertiary)] uppercase tracking-wider text-right">Abates</th>
                                                            <th className="px-6 py-4 font-bold text-[var(--text-tertiary)] uppercase tracking-wider text-right">Total</th>
                                                            <th className="px-6 py-4 font-bold text-[var(--text-tertiary)] uppercase tracking-wider text-right">Booyah</th>
                                                            <th className="px-6 py-4 font-bold text-[var(--text-tertiary)] uppercase tracking-wider text-right">Ação</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-[var(--border-subtle)]">
                                                        {data.rawData.map((row: any, index: number) => (
                                                            <tr key={index} className="hover:bg-[var(--bg-hover)] transition-colors group">
                                                                <td className="px-6 py-4 font-mono text-[var(--text-secondary)]">
                                                                    {String(row.Data).includes('-') 
                                                                        ? String(row.Data).split('-').reverse().join('/') 
                                                                        : row.Data}
                                                                </td>
                                                                <td className="px-6 py-4 font-bold text-[var(--accent)] text-[10px] uppercase truncate max-w-[120px]" title={row.Campeonato}>
                                                                    {row.Campeonato}
                                                                </td>
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
                                                                <td className="px-6 py-4 text-right">
                                                                    <button 
                                                                        onClick={() => { setMatchToDelete(row); setIsDeleteModalOpen(true); }}
                                                                        className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                                                                        title="Remover Partida"
                                                                    >
                                                                        <Trash2 size={16} />
                                                                    </button>
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
        </SidebarLayout>
    </div>
    );
};
