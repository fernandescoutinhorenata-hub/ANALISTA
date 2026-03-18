import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft, CheckCircle, XCircle, AlertTriangle, Trash2,
    Wallet, Users, Activity
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { verificarDesbloqueioConquistas } from '../utils/conquistas';

const MAPAS = ['BERMUDA', 'PURGATÓRIO', 'KALAHARI', 'ALPINE', 'NOVA TERRA', 'SOLARA'];
const COLOCACOES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

// ─── Input Técnico ──────────────────────────────────────────────────────────
const InputField: React.FC<any> = ({ label, id, type = 'text', value, onChange, required, placeholder }) => {
    return (
        <div className="flex flex-col gap-1.5 animate-reveal w-full">
            <label htmlFor={id} className="text-[11px] font-semibold text-[var(--text-secondary)] flex items-center gap-1.5">
                {label} {required && <span className="text-rose-500">*</span>}
            </label>
            <div className="relative">
                <input
                    id={id}
                    type={type}
                    value={value}
                    placeholder={placeholder}
                    min={type === 'number' ? "0" : undefined}
                    onChange={e => {
                        const val = e.target.value;
                        if (type === 'number' && parseInt(val) < 0) return;
                        onChange(val);
                    }}
                    className="input-base px-4 border-[var(--border-default)] bg-[var(--bg-surface)]"
                />
            </div>
        </div>
    );
};

// ─── Select Técnico ──────────────────────────────────────────────────────────
const SelectField: React.FC<any> = ({ label, id, value, onChange, options, required }) => {
    return (
        <div className="flex flex-col gap-1.5 animate-reveal w-full">
            <label htmlFor={id} className="text-[11px] font-semibold text-[var(--text-secondary)] flex items-center gap-1.5">
                {label} {required && <span className="text-rose-500">*</span>}
            </label>
            <select
                id={id}
                value={value}
                onChange={e => onChange(e.target.value)}
                className="input-base px-4 border-[var(--border-default)] bg-[var(--bg-surface)] appearance-none"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2371717A' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5' /%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '0.6rem' }}
            >
                <option value="">Selecionar</option>
                {options.map((o: any) => <option key={o} value={o}>{o}</option>)}
            </select>
        </div>
    );
};

const Toast: React.FC<any> = ({ message, type }) => {
    const config = {
        success: { border: '#10B98130', color: '#10B981', Icon: CheckCircle },
        error: { border: '#F43F5E30', color: '#F43F5E', Icon: XCircle },
    }[type as 'success' | 'error' || 'success'];
    return (
        <div className="fixed top-6 right-6 z-[9999] flex items-center gap-3 px-5 py-3 bg-[#161618] border rounded-sm animate-reveal shadow-2xl" style={{ borderColor: config.border }}>
            <config.Icon size={16} color={config.color} />
            <span className="text-white text-[10px] font-black uppercase tracking-widest">{message}</span>
        </div>
    );
};

const PONTOS_POR_COLOCACAO: Record<number, number> = { 1: 12, 2: 9, 3: 8, 4: 7, 5: 6, 6: 5, 7: 4, 8: 3, 9: 2, 10: 1, 11: 0, 12: 0 };

export const InputData: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    // ─── Estados do Formulário ────────────────────────────────────────────────
    const [matchData, setMatchData] = useState({
        data: new Date().toISOString().split('T')[0],
        campeonato: '',
        mapa: '',
        rodada: '',
        colocacao: '',
        equipe: 'SQUAD PRINCIPAL',
        totalKillsManual: '0'
    });

    const [players, setPlayers] = useState([
        { nome: '', kills: '0', assistencias: '0', derrubados: '0', dano: '0', morte: '0', revividos: '0' },
        { nome: '', kills: '0', assistencias: '0', derrubados: '0', dano: '0', morte: '0', revividos: '0' },
        { nome: '', kills: '0', assistencias: '0', derrubados: '0', dano: '0', morte: '0', revividos: '0' },
        { nome: '', kills: '0', assistencias: '0', derrubados: '0', dano: '0', morte: '0', revividos: '0' },
    ]);

    const [creditos, setCreditos] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState<any>(null);
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);
    const [resetLoading, setResetLoading] = useState(false);

    // Cálculo de Pontos em Tempo Real
    const pontosPosicao = PONTOS_POR_COLOCACAO[parseInt(matchData.colocacao)] || 0;
    const totalKillsSquad = parseInt(matchData.totalKillsManual) || 0;
    const totalPontosPartida = pontosPosicao + totalKillsSquad;

    // Sincronizar kills dos jogadores com o total (opcional, mas ajuda o usuário)
    useEffect(() => {
        const sumKills = players.reduce((acc, p) => acc + (parseInt(p.kills) || 0), 0);
        setMatchData(prev => ({ ...prev, totalKillsManual: String(sumKills) }));
    }, [players]);

    useEffect(() => {
        if (!user) return;
        const fetchPerfil = async () => {
            const { data } = await supabase.from('perfis').select('usos_restantes').eq('id', user.id).single();
            if (data) setCreditos(data.usos_restantes);
        };
        fetchPerfil();
    }, [user]);

    const showToast = (message: string, type: string) => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    const updatePlayer = (index: number, field: string, value: string) => {
        const newPlayers = [...players];
        newPlayers[index] = { ...newPlayers[index], [field]: value };
        setPlayers(newPlayers);
    };

    const handleSaveSquad = async () => {
        if (!user || loading) return;

        // Validação básica
        if (!matchData.campeonato || !matchData.mapa || !matchData.rodada || !matchData.colocacao) {
            showToast('Preencha os dados da partida', 'error');
            return;
        }

        if (players.some(p => !p.nome)) {
            showToast('Todos os jogadores devem ter nome', 'error');
            return;
        }

        if (creditos !== null && creditos <= 0) {
            showToast('Créditos insuficientes', 'error');
            return;
        }

        setLoading(true);
        try {
            const totalKills = totalKillsSquad;
            const pontosTotal = totalPontosPartida;

            // 1. Inserir em partidas_geral
            const { error: errorGeral } = await supabase.from('partidas_geral').insert({
                user_id: user.id,
                data: matchData.data,
                campeonato: matchData.campeonato.toUpperCase(),
                rodada: Math.max(0, parseInt(matchData.rodada) || 0),
                mapa: matchData.mapa,
                equipe: matchData.equipe,
                colocacao: Math.max(1, parseInt(matchData.colocacao) || 1),
                kill: Math.max(0, totalKills),
                pontos_posicao: Math.max(0, pontosPosicao),
                pontos_total: Math.max(0, pontosTotal),
                booyah: parseInt(matchData.colocacao) === 1
            });

            if (errorGeral) throw errorGeral;

            // 2. Inserir em performance_jogadores para cada player
            const performanceRecords = players.map(p => ({
                user_id: user.id,
                data: matchData.data,
                equipe: matchData.equipe,
                modo: 'Campeonato',
                mapa: matchData.mapa,
                posicao: Math.max(1, parseInt(matchData.colocacao) || 1),
                player: p.nome.trim() || 'JOGADOR DESCONHECIDO',
                kill: Math.max(0, parseInt(p.kills) || 0),
                morte: Math.max(0, parseInt(p.morte) || 0),
                assistencia: Math.max(0, parseInt(p.assistencias) || 0),
                queda: 0,
                dano_causado: Math.max(0, parseInt(p.dano) || 0),
                derrubados: Math.max(0, parseInt(p.derrubados) || 0),
                ressurgimento: Math.max(0, parseInt(p.revividos) || 0)
            }));

            const { error: errorPerf } = await supabase.from('performance_jogadores').insert(performanceRecords);
            if (errorPerf) throw errorPerf;

            // 3. Decrementar Crédito
            const { error: errorCred } = await supabase.from('perfis')
                .update({ usos_restantes: Math.max(0, (creditos || 1) - 1) })
                .eq('id', user.id);
            if (errorCred) throw errorCred;

            showToast('Squad Salvo com Sucesso!', 'success');
            setCreditos(prev => (prev !== null ? prev - 1 : null));

            // 4. Verificar conquistas para cada jogador individualmente
            for (const p of players) {
                const jogadorId = user.id; // conquistas ligadas ao coach/user por enquanto
                const stats = {
                    kills: Math.max(0, parseInt(p.kills) || 0),
                    dano: Math.max(0, parseInt(p.dano) || 0),
                    assistencias: Math.max(0, parseInt(p.assistencias) || 0),
                    derrubados: Math.max(0, parseInt(p.derrubados) || 0),
                    ressurgimentos: Math.max(0, parseInt(p.revividos) || 0),
                    mortes: Math.max(0, parseInt(p.morte) || 0),
                    colocacao: Math.max(1, parseInt(matchData.colocacao) || 1),
                };
                const novasConquistas = await verificarDesbloqueioConquistas(jogadorId, stats);
                novasConquistas.forEach(titulo =>
                    showToast(`🏆 Conquista: ${titulo}`, 'success')
                );
            }

            // Limpar alguns campos mantendo o contexto da partida
            setPlayers(players.map(p => ({ ...p, kills: '0', assistencias: '0', derrubados: '0', dano: '0', morte: '0', revividos: '0' })));
            setMatchData(prev => ({ ...prev, rodada: String(parseInt(prev.rodada) + 1 || '') }));

        } catch (err: any) {
            showToast(err.message || 'Erro ao salvar', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleResetData = async () => {
        if (!user || resetLoading) return;
        setResetLoading(true);
        try {
            const { error: errorPerf } = await supabase.from('performance_jogadores').delete().eq('user_id', user.id);
            if (errorPerf) throw errorPerf;

            const { error: errorGeral } = await supabase.from('partidas_geral').delete().eq('user_id', user.id);
            if (errorGeral) throw errorGeral;

            showToast('Tabela reiniciada com sucesso', 'success');
            setIsResetModalOpen(false);
            navigate('/');
        } catch (err: any) {
            showToast(err.message || 'Erro ao reiniciar tabela', 'error');
        } finally {
            setResetLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] font-['Inter',sans-serif]">
            {toast && <Toast message={toast.message} type={toast.type} />}

            {/* Tactical Header */}
            <header className="sticky top-0 z-50 bg-[var(--bg-main)]/80 backdrop-blur-xl border-b border-[var(--border-subtle)]">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/')} className="p-2 border border-[var(--border-default)] rounded-md hover:bg-[var(--bg-hover)] transition-colors">
                            <ChevronLeft size={18} className="text-[var(--text-secondary)]" />
                        </button>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-[var(--text-primary)]">Inserir Dados da Partida</span>
                            <span className="text-[11px] font-medium text-[var(--text-tertiary)]">Preencha os dados do squad</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsResetModalOpen(true)}
                            className="btn-ghost flex items-center gap-2 px-3 py-1.5"
                        >
                            <Trash2 size={14} className="text-red-500/70" />
                            <span className="text-xs font-semibold text-red-500/70">Reiniciar Tabela</span>
                        </button>

                        <div className="badge border border-[var(--border-default)] bg-[var(--bg-hover)] text-[var(--text-secondary)] py-1.5 px-3">
                            <Wallet size={12} className="text-[var(--accent)] mr-2" />
                            <span className="text-[10px] font-bold">{creditos ?? '--'} CRÉDITOS</span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
                {/* 1. Dados da Partida */}
                <section className="animate-reveal">
                    <div className="flex items-center gap-2 mb-4">
                        <Activity size={16} className="text-[var(--accent)]" />
                        <h2 className="text-sm font-bold text-[var(--text-primary)]">Dados da Partida</h2>
                    </div>
                    <div className="card p-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                        <InputField label="Data" type="date" value={matchData.data} onChange={(v: string) => setMatchData(p => ({ ...p, data: v }))} />
                        <InputField label="Campeonato" value={matchData.campeonato} onChange={(v: string) => setMatchData(p => ({ ...p, campeonato: v }))} placeholder="Ex: LBFF" />
                        <SelectField label="Mapa" value={matchData.mapa} onChange={(v: string) => setMatchData(p => ({ ...p, mapa: v }))} options={MAPAS} />
                        <InputField label="Rodada" type="number" value={matchData.rodada} onChange={(v: string) => setMatchData(p => ({ ...p, rodada: v }))} placeholder="No." />
                        <SelectField label="Colocação" value={matchData.colocacao} onChange={(v: string) => setMatchData(p => ({ ...p, colocacao: v }))} options={COLOCACOES} />
                        <InputField label="Kills Squad" type="number" value={matchData.totalKillsManual} onChange={(v: string) => setMatchData(p => ({ ...p, totalKillsManual: v }))} />

                        <div className="flex flex-col gap-1.5 w-full">
                            <span className="text-[11px] font-semibold text-[var(--text-tertiary)]">Total de Pontos</span>
                            <div className="badge badge-purple w-full py-4 flex items-center justify-center bg-[var(--accent-muted)] border-[var(--accent-glow)]">
                                <span className="text-xl font-bold text-[var(--accent-hover)]">{totalPontosPartida}</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 2. Squad Container */}
                <section className="animate-reveal">
                    <div className="flex items-center gap-2 mb-4">
                        <Users size={16} className="text-[var(--accent)]" />
                        <h2 className="text-sm font-bold text-[var(--text-primary)]">Integrantes do Squad</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {players.map((player, idx) => (
                            <div key={idx} className="card p-5 !bg-[var(--bg-surface)] hover:border-[var(--accent-glow)] transition-all">
                                <div className="pb-4 mb-4 border-b border-[var(--border-subtle)]">
                                    <InputField
                                        label={`Jogador ${idx + 1}`}
                                        placeholder="Nome do Player"
                                        value={player.nome}
                                        onChange={(v: string) => updatePlayer(idx, 'nome', v)}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <InputField label="Kills" type="number" value={player.kills} onChange={(v: string) => updatePlayer(idx, 'kills', v)} />
                                    <InputField label="Assists" type="number" value={player.assistencias} onChange={(v: string) => updatePlayer(idx, 'assistencias', v)} />
                                    <InputField label="Derrub." type="number" value={player.derrubados} onChange={(v: string) => updatePlayer(idx, 'derrubados', v)} />
                                    <InputField label="Dano" type="number" value={player.dano} onChange={(v: string) => updatePlayer(idx, 'dano', v)} />
                                    <InputField label="Mortes" type="number" value={player.morte} onChange={(v: string) => updatePlayer(idx, 'morte', v)} />
                                    <InputField label="Reviv." type="number" value={player.revividos} onChange={(v: string) => updatePlayer(idx, 'revividos', v)} />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 3. Botão de Ação */}
                <div className="flex justify-center pt-8 animate-reveal">
                    <button
                        onClick={handleSaveSquad}
                        disabled={loading}
                        className="btn-primary w-full max-w-2xl py-4 font-bold text-sm tracking-widest text-white rounded-[8px]"
                    >
                        {loading ? 'PROCESSANDO...' : 'SALVAR MÉTRICAS'}
                    </button>
                </div>
            </main>

            {/* ⚠️ Reset Modal */}
            {isResetModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="w-full max-w-sm bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl p-8 shadow-2xl animate-reveal">
                        <div className="flex flex-col items-center text-center gap-4">
                            <div className="p-4 rounded-full bg-red-500/10 text-red-500 mb-2">
                                <AlertTriangle size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-[var(--text-primary)]">Ação Irreversível</h3>
                            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                                Após você aceitar, sua planilha será resetada e você não terá mais acesso aos resultados passados. Deseja continuar?
                            </p>
                            <div className="grid grid-cols-2 gap-3 w-full mt-6">
                                <button
                                    onClick={() => setIsResetModalOpen(false)}
                                    className="btn-ghost border border-[var(--border-default)] text-sm font-semibold"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleResetData}
                                    disabled={resetLoading}
                                    className="py-3 px-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 text-sm font-bold hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
                                >
                                    {resetLoading ? 'LIMPENDO...' : 'CONFIRMAR'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes reveal {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-reveal {
                    animation: reveal 0.4s ease-out forwards;
                }
            `}</style>
        </div>
    );
};
