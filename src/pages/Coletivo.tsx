import React, { useState, useEffect, useMemo } from 'react';

import {
    XAxis, YAxis, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell, CartesianGrid
} from 'recharts';
import {
    Trophy, Map, Users, Calendar, ChevronRight, XCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { SidebarLayout } from '../components/SidebarLayout';

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

export const Coletivo: React.FC = () => {
    const [allPlayerRows, setAllPlayerRows] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [specificDate, setSpecificDate] = useState<string>('');
    const [selectedChamp, setSelectedChamp] = useState<string>('Todos');
    const [selectedMap, setSelectedMap] = useState<string>('Todos');
    const [nomeUsuario, setNomeUsuario] = useState<string>('');

    const { user } = useAuth();

    // ─── Fetch Data ─────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!user) return;

        const fetchProfile = async () => {
            const { data } = await supabase
                .from('perfis')
                .select('nome, email')
                .eq('id', user.id)
                .single();
            if (data) {
                setNomeUsuario(data.nome || data.email || user.email || '');
            }
        };

        const fetchPerformanceData = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('performance_jogadores')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('data', { ascending: false });

                if (error) throw error;

                const mapped = (data || []).map(row => ({
                    Data: row.data,
                    Campeonato: row.campeonato || 'Sem Evento',
                    Mapa: row.mapa || 'Desconhecido',
                    Player: row.player,
                    Kill: Number(row.kill) || 0,
                    Morte: Number(row.morte) || 0,
                    Assistencia: Number(row.assistencia) || 0,
                    Dano: Number(row.dano_causado) || 0,
                    Derrubados: Number(row.derrubados) || 0,
                    Revividos: Number(row.ressurgimento) || 0
                }));
                setAllPlayerRows(mapped);
            } catch (err) {
                console.error('Error fetching collective data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
        fetchPerformanceData();
    }, [user]);

    // ─── Filter Options ──────────────────────────────────────────────────────────
    const filterOptions = useMemo(() => {
        const championships = new Set<string>();
        const maps = new Set<string>();
        allPlayerRows.forEach(row => {
            if (row.Campeonato) championships.add(row.Campeonato);
            if (row.Mapa) maps.add(row.Mapa);
        });
        return {
            championships: Array.from(championships).sort(),
            maps: Array.from(maps).sort()
        };
    }, [allPlayerRows]);

    // ─── Process Collective Data ────────────────────────────────────────────────
    const collectiveData = useMemo(() => {
        const filtered = allPlayerRows.filter(row => {
            const dateMatch = !specificDate || row.Data === specificDate || row.Data === specificDate.split('-').reverse().join('/');
            const champMatch = selectedChamp === 'Todos' || row.Campeonato === selectedChamp;
            const mapMatch = selectedMap === 'Todos' || row.Mapa === selectedMap;
            return dateMatch && champMatch && mapMatch;
        });

        const playersMap: Record<string, any> = {};

        filtered.forEach(row => {
            const p = row.Player;
            if (!playersMap[p]) {
                playersMap[p] = { name: p, kills: 0, assists: 0, dano: 0, mortes: 0, dps: 0, revividos: 0, derrubados: 0 };
            }
            playersMap[p].kills += row.Kill;
            playersMap[p].assists += row.Assistencia;
            playersMap[p].dano += row.Dano;
            playersMap[p].mortes += row.Morte;
            playersMap[p].derrubados += row.Derrubados;
            playersMap[p].revividos += row.Revividos;
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
    }, [allPlayerRows, specificDate, selectedChamp, selectedMap]);

    const HorizontalBarChart = ({ data, dataKey, title, color }: any) => (
        <Card className="h-full flex flex-col">
            <h4 className="text-heading text-xs font-black uppercase tracking-widest mb-6 opacity-80">{title}</h4>
            <div className="flex-1 min-h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border-subtle)" />
                        <XAxis type="number" hide />
                        <YAxis 
                            type="category" 
                            dataKey="name" 
                            tick={{ fontSize: 10, fill: 'var(--text-secondary)', fontWeight: 600 }} 
                            axisLine={false} 
                            tickLine={false}
                        />
                        <Tooltip 
                            cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                            contentStyle={neonTooltipStyle}
                            itemStyle={{ color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                            labelStyle={{ color: 'var(--text-tertiary)', fontSize: '10px', marginBottom: '4px' }}
                        />
                        <Bar 
                            dataKey={dataKey} 
                            fill={color} 
                            radius={[0, 4, 4, 0]} 
                            barSize={18}
                            label={{ position: 'right', fill: 'var(--text-primary)', fontSize: 10, fontWeight: 'bold' }}
                        >
                            {data.map((_: any, index: number) => (
                                <Cell key={`cell-${index}`} fillOpacity={1 - (index * 0.1)} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );

    return (
        <SidebarLayout activeTab="coletivo">
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                <header className="h-20 flex items-center justify-between px-8 z-40 backdrop-blur-md sticky top-0 bg-[var(--bg-main)]/80 border-b border-[var(--border-default)]">
                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center text-label">
                            <Users size={14} className="mr-2" />
                            <span>Controle</span>
                            <ChevronRight size={14} className="mx-2 opacity-50" />
                            <span className="text-[var(--accent)]">Coletivo</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Profile */}
                        <div className="hidden sm:flex items-center gap-4 pr-4 border-r border-[var(--border-subtle)]">
                            <div className="flex flex-col text-right items-end gap-1">
                                <span className="text-label text-[10px] opacity-70 leading-none">{nomeUsuario || 'Analista'}</span>
                            </div>
                        </div>

                        {/* Filtro Data */}
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#09090b] border border-[var(--border-default)] transition-all ${specificDate ? 'border-[var(--accent)] ring-1 ring-[var(--accent)]/30' : ''}`}>
                            <Calendar size={13} className={specificDate ? 'text-[var(--accent)]' : 'text-[var(--text-tertiary)]'} />
                            <input 
                                type="date" 
                                value={specificDate}
                                onChange={(e) => setSpecificDate(e.target.value)}
                                className="bg-transparent text-white outline-none border-none text-xs [color-scheme:dark] cursor-pointer"
                            />
                            {specificDate && (
                                <button onClick={() => setSpecificDate('')} className="text-[var(--text-tertiary)] hover:text-white transition-colors">
                                    <XCircle size={14} />
                                </button>
                            )}
                        </div>

                        {/* Filtro Campeonato */}
                        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-default)] text-label">
                            <Trophy size={13} className="text-[var(--accent)]" />
                            <select
                                value={selectedChamp}
                                onChange={e => setSelectedChamp(e.target.value)}
                                className="outline-none cursor-pointer bg-transparent text-white border-none py-1 px-1 rounded-md text-xs font-bold"
                            >
                                <option value="Todos" className="bg-[#141416]">Todos Eventos</option>
                                {filterOptions.championships.map(c => <option key={c} value={c} className="bg-[#141416]">{c}</option>)}
                            </select>
                        </div>

                        {/* Filtro Mapa */}
                        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-default)] text-label">
                            <Map size={13} className="text-[var(--accent)]" />
                            <select
                                value={selectedMap}
                                onChange={e => setSelectedMap(e.target.value)}
                                className="outline-none cursor-pointer bg-transparent text-white border-none py-1 px-1 rounded-md text-xs font-bold"
                            >
                                <option value="Todos" className="bg-[#141416]">Todos Mapas</option>
                                {filterOptions.maps.map(m => <option key={m} value={m} className="bg-[#141416]">{m}</option>)}
                            </select>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {loading ? (
                        <div className="h-full w-full flex flex-col items-center justify-center space-y-6">
                            <div className="w-12 h-12 rounded-lg border-2 border-[var(--accent)]/20 border-t-[var(--accent)] animate-spin" />
                            <p className="text-label animate-pulse text-[var(--accent)]">Processando Métricas Coletivas</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-reveal pb-20">
                            <HorizontalBarChart title="Kills" data={collectiveData.kills} dataKey="kills" color="#7C3AED" />
                            <HorizontalBarChart title="Assists" data={collectiveData.assists} dataKey="assists" color="#7C3AED" />
                            <HorizontalBarChart title="Dano Causado" data={collectiveData.dano} dataKey="dano" color="#7C3AED" />
                            <HorizontalBarChart title="Mortes" data={collectiveData.mortes} dataKey="mortes" color="#7C3AED" />
                            <HorizontalBarChart title="Derrubados" data={collectiveData.derrubados} dataKey="derrubados" color="#7C3AED" />
                            <HorizontalBarChart title="Revividos" data={collectiveData.revividos} dataKey="revividos" color="#7C3AED" />
                        </div>
                    )}
                </main>
            </div>
        </SidebarLayout>
    );
};
