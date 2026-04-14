import React, { useState, useEffect, useMemo } from 'react';
import {
    Sword, Map, Calendar,
    Activity, TrendingUp, TrendingDown,
    Shield, MapPin
} from 'lucide-react';
import {
    XAxis, YAxis, Tooltip, ResponsiveContainer,
    BarChart, Bar, CartesianGrid
} from 'recharts';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { SidebarLayout } from '../components/SidebarLayout';

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
    color?: 'purple' | 'green' | 'red';
}> = ({ title, value, subValue, icon: Icon, color = 'purple' }) => {
    const colorClasses = {
        purple: 'text-[var(--accent)]',
        green: 'text-[#9D5FF5]', // Roxo Médio em vez de verde
        red: 'text-[#B47FFB]'    // Roxo Claro em vez de vermelho
    };

    return (
        <div className="card-metric flex flex-col gap-4 relative">
            <div className="flex justify-between items-start">
                {subValue ? (
                    <span className={`badge ${color === 'green' ? 'badge-green' : color === 'red' ? 'badge-red' : 'badge-purple'}`}>
                        {subValue}
                    </span>
                ) : <div />}
                <div className={colorClasses[color]}>
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
};

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

export default function Quebras() {
    const { user, isSubscriber } = useAuth();
    const [loading, setLoading] = useState(true);
    const [allQuebras, setAllQuebras] = useState<any[]>([]);
    
    // Filtros
    const [timeFilter, setTimeFilter] = useState<'7d' | '30d' | 'all'>('all');
    const [resultFilter, setResultFilter] = useState<'Todos' | 'WIN' | 'LOSS'>('Todos');
    const [mapFilter, setMapFilter] = useState<string>('Todos');

    useEffect(() => {
        if (!user) return;

        const fetchQuebras = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('partidas_geral')
                    .select('*')
                    .eq('user_id', user.id)
                    .eq('quebra_call', true)
                    .order('data', { ascending: false });

                if (error) throw error;
                setAllQuebras(data || []);
            } catch (error) {
                console.error('Erro ao buscar quebras:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchQuebras();
    }, [user]);

    const filteredData = useMemo(() => {
        const now = new Date();
        const timeLimit = timeFilter === '7d'
            ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            : timeFilter === '30d'
                ? new Date(now.getFullYear(), now.getMonth(), 1)
                : null;

        return allQuebras.filter(row => {
            // Filtro de Tempo
            if (timeLimit && row.data) {
                const parts = row.data.split('/');
                const parsed = parts.length === 3
                    ? new Date(`${parts[2]}-${parts[1]}-${parts[0]}`)
                    : new Date(row.data);
                if (isNaN(parsed.getTime()) || parsed < timeLimit) return false;
            }

            // Filtro de Resultado
            if (resultFilter !== 'Todos' && row.resultado_call?.toUpperCase() !== resultFilter) return false;

            // Filtro de Mapa
            if (mapFilter !== 'Todos' && row.mapa !== mapFilter) return false;

            return true;
        });
    }, [allQuebras, timeFilter, resultFilter, mapFilter]);

    const stats = useMemo(() => {
        const total = filteredData.length;
        const wins = filteredData.filter(r => r.resultado_call?.toUpperCase() === 'WIN').length;
        const losses = filteredData.filter(r => r.resultado_call?.toUpperCase() === 'LOSS').length;

        return {
            total,
            winRate: total > 0 ? ((wins / total) * 100).toFixed(1) : '0',
            lossRate: total > 0 ? ((losses / total) * 100).toFixed(1) : '0'
        };
    }, [filteredData]);

    const mapChartData = useMemo(() => {
        const counts: Record<string, number> = {};
        filteredData.forEach(r => {
            if (r.mapa) counts[r.mapa] = (counts[r.mapa] || 0) + 1;
        });
        return Object.entries(counts)
            .map(([mapa, total]) => ({ mapa, total }))
            .sort((a, b) => b.total - a.total);
    }, [filteredData]);

    const callChartData = useMemo(() => {
        const counts: Record<string, { name: string, win: number, loss: number, total: number }> = {};
        filteredData.forEach(r => {
            const call = r.qual_call || 'Sem Nome';
            if (!counts[call]) counts[call] = { name: call, win: 0, loss: 0, total: 0 };
            counts[call].total++;
            if (r.resultado_call?.toUpperCase() === 'WIN') counts[call].win++;
            if (r.resultado_call?.toUpperCase() === 'LOSS') counts[call].loss++;
        });
        return Object.values(counts)
            .sort((a, b) => b.total - a.total)
            .slice(0, 10); // Top 10 calls
    }, [filteredData]);

    const distinctMaps = useMemo(() => {
        return Array.from(new Set(allQuebras.map(r => r.mapa).filter(Boolean))).sort();
    }, [allQuebras]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Activity className="animate-spin text-[var(--accent)]" size={40} />
                    <p className="text-label uppercase tracking-widest font-bold">Analisando Estratégias...</p>
                </div>
            </div>
        );
    }

    return (
        <SidebarLayout activeTab="quebras" isSubscriber={isSubscriber}>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <header className="flex flex-col gap-4 sticky top-0 z-50 bg-[var(--bg-surface)] backdrop-blur-md border-b border-[var(--border-subtle)] px-6 py-5">
                    <div className="w-full flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="hidden md:flex items-center text-[12px] uppercase tracking-widest text-[#6B7280] font-bold">
                                <span>CONTROLE</span>
                                <span className="mx-2 opacity-50">›</span>
                                <span>QUEBRAS</span>
                            </div>
                        </div>

                        {/* Profile header */}
                        <div className="flex items-center gap-4">
                            <div className="hidden sm:flex flex-col text-right items-end gap-1">
                                <span className="text-[13px] text-[#6B7280]">{user?.email || 'Analista'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Linha 2: Filtros */}
                    <div className="w-full flex items-center justify-start gap-4">
                        <div className="flex items-center gap-[8px]">
                            {([{ id: '7d', label: '7 DIAS' }, { id: '30d', label: 'ESTE MÊS' }, { id: 'all', label: 'TODOS' }] as const).map(opt => (
                                <button
                                    key={opt.id}
                                    onClick={() => setTimeFilter(opt.id as any)}
                                    className={`px-[12px] py-[6px] rounded-[8px] text-[13px] border border-[var(--border-default)] transition-all ${timeFilter === opt.id ? 'bg-[var(--accent-muted)] border-[var(--accent)] text-[#A78BFA] font-bold' : 'bg-[#1A1A1A] text-[var(--text-secondary)] hover:bg-[var(--accent-muted)] font-medium'}`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </header>

                <main className="w-full px-6 py-10 space-y-10">
                    
                    {/* Filtros Secundários */}
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-default)]">
                            <Activity size={16} className="text-[var(--accent)]" />
                            <select
                                value={resultFilter}
                                onChange={e => setResultFilter(e.target.value as any)}
                                className="bg-transparent text-[var(--text-primary)] border-none px-2 outline-none cursor-pointer min-w-[120px] font-bold text-sm"
                            >
                                <option value="Todos" className="bg-[#141416]">Todos Resultados</option>
                                <option value="WIN" className="bg-[#141416]">Vitórias (WIN)</option>
                                <option value="LOSS" className="bg-[#141416]">Derrotas (LOSS)</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-default)]">
                            <Map size={16} className="text-[var(--accent)]" />
                            <select
                                value={mapFilter}
                                onChange={e => setMapFilter(e.target.value)}
                                className="bg-transparent text-[var(--text-primary)] border-none px-2 outline-none cursor-pointer min-w-[120px] font-bold text-sm"
                            >
                                <option value="Todos" className="bg-[#141416]">Todos os Mapas</option>
                                {distinctMaps.map(m => (
                                    <option key={m} value={m} className="bg-[#141416]">{m}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Linha 1: Métricas */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <MetricCard 
                            title="Total de Quebras" 
                            value={stats.total} 
                            icon={Shield} 
                            subValue={allQuebras.length > 0 ? `${((stats.total / allQuebras.length) * 100).toFixed(0)}% do histórico` : '0%'}
                        />
                        <MetricCard 
                            title="Taxa de Vitória" 
                            value={`${stats.winRate}%`} 
                            icon={TrendingUp} 
                            color="green"
                        />
                        <MetricCard 
                            title="Taxa de Derrota" 
                            value={`${stats.lossRate}%`} 
                            icon={TrendingDown} 
                            color="red"
                        />
                    </div>

                    {/* Linha 2: Gráficos */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <Card>
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h4 className="text-heading">Quebras por Mapa</h4>
                                    <p className="text-[12px] text-[#6B7280] mb-[16px]">Volume de confrontos por território</p>
                                </div>
                                <div className="p-2.5 text-[#4B5563] hover:text-[var(--accent)] transition-colors cursor-pointer">
                                    <MapPin size={18} />
                                </div>
                            </div>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={mapChartData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
                                        <XAxis 
                                            dataKey="mapa" 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fontSize: 10, fill: 'var(--text-secondary)', fontWeight: 700 }} 
                                        />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} />
                                        <Tooltip contentStyle={neonTooltipStyle} cursor={{ fill: 'var(--bg-hover)' }} />
                                        <Bar dataKey="total" fill="#7C3AED" radius={[4, 4, 0, 0]} barSize={40} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>

                        <Card>
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h4 className="text-heading">Frequência por Call</h4>
                                    <p className="text-[12px] text-[#6B7280] mb-[16px]">Métricas detalhadas por ponto de interesse</p>
                                </div>
                                <div className="p-2.5 text-[#4B5563] hover:text-[var(--accent)] transition-colors cursor-pointer">
                                    <Sword size={18} />
                                </div>
                            </div>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={callChartData} layout="vertical" margin={{ left: 40 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border-subtle)" />
                                        <XAxis type="number" hide />
                                        <YAxis 
                                            dataKey="name" 
                                            type="category" 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fontSize: 10, fill: 'var(--text-secondary)', fontWeight: 700 }} 
                                        />
                                        <Tooltip contentStyle={neonTooltipStyle} cursor={{ fill: 'var(--bg-hover)' }} />
                                        <Bar dataKey="total" fill="#7C3AED" radius={[0, 4, 4, 0]} barSize={20} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>
                    </div>

                    {/* Linha 3: Tabela */}
                    <Card className="p-0 overflow-hidden">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h4 className="text-heading">Histórico de Quebras</h4>
                                <p className="text-[12px] text-[#6B7280] mb-[16px]">Detalhamento das quebras de calls</p>
                            </div>
                            <div className="badge badge-purple">{filteredData.length} registros</div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-[var(--bg-card)]/50 border-b border-[var(--border-subtle)]">
                                    <tr>
                                        <th className="px-6 py-4 text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest">Data</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest">Mapa</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest">Call</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest">Resultado</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest">Rodada</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border-subtle)]">
                                    {filteredData.map((row, i) => (
                                        <tr key={i} className="hover:bg-[var(--bg-hover)]/30 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-1.5 rounded-lg bg-[var(--bg-surface)] text-[var(--text-tertiary)] group-hover:text-[var(--accent)] transition-colors">
                                                        <Calendar size={14} />
                                                    </div>
                                                    <span className="text-xs font-bold text-[var(--text-secondary)]">
                                                        {row.data?.includes('-') ? row.data.split('-').reverse().join('/') : row.data}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-xs font-black text-white uppercase">{row.mapa}</td>
                                            <td className="px-6 py-4 text-xs font-bold text-[var(--text-secondary)]">{row.qual_call || '—'}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${
                                                    row.resultado_call?.toUpperCase() === 'WIN' 
                                                        ? 'bg-[#7C3AED]/10 text-[#7C3AED] border border-[#7C3AED]/20' 
                                                        : 'bg-[#9D5FF5]/10 text-[#9D5FF5] border border-[#9D5FF5]/20'
                                                }`}>
                                                    {row.resultado_call || 'LOSS'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-xs font-bold text-[var(--text-tertiary)]">{row.rodada}ª</td>
                                        </tr>
                                    ))}
                                    {filteredData.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-20 text-center">
                                                <div className="flex flex-col items-center gap-3 opacity-20">
                                                    <Shield size={40} />
                                                    <p className="text-[10px] font-black uppercase tracking-widest">Nenhuma quebra de call registrada</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </main>
            </div>
        </SidebarLayout>
    );
}
