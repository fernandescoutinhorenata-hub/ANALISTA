import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft, CheckCircle, XCircle,
    Wallet, Play, Target, Hash, Map, Trophy, Users, Sword, HeartPulse, Activity
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const MAPAS = ['BERMUDA', 'PURGATÓRIO', 'KALAHARI', 'ALPINE', 'NOVA TERRA', 'SOLARA'];
const COLOCACOES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

// ─── Design Tokens Customizados ──────────────────────────────────────────────


// ─── Input Técnico ──────────────────────────────────────────────────────────
const InputField: React.FC<any> = ({ label, id, type = 'text', value, onChange, required, placeholder, icon: Icon }) => {
    const [focused, setFocused] = useState(false);
    return (
        <div className="flex flex-col gap-1.5 animate-reveal w-full">
            <label htmlFor={id} className="text-[9px] uppercase tracking-[0.2em] font-black text-[#A1A1AA] flex items-center gap-1.5">
                {Icon && <Icon size={10} className={focused ? 'text-[#A855F7]' : 'text-[#71717A]'} />}
                {label} {required && <span className="text-rose-500">*</span>}
            </label>
            <div className="relative">
                <input
                    id={id}
                    type={type}
                    value={value}
                    placeholder={placeholder}
                    onChange={e => onChange(e.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    className={`w-full bg-[#161618] border ${focused ? 'border-[#A855F7] ring-1 ring-[#A855F7]/30' : 'border-[#2D2D30]'} rounded-sm py-2 px-3 text-xs text-white placeholder:text-zinc-800 transition-all outline-none font-medium`}
                />
            </div>
        </div>
    );
};

// ─── Select Técnico ──────────────────────────────────────────────────────────
const SelectField: React.FC<any> = ({ label, id, value, onChange, options, required, icon: Icon }) => {
    const [focused, setFocused] = useState(false);
    return (
        <div className="flex flex-col gap-1.5 animate-reveal w-full">
            <label htmlFor={id} className="text-[9px] uppercase tracking-[0.2em] font-black text-[#A1A1AA] flex items-center gap-1.5">
                {Icon && <Icon size={10} className={focused ? 'text-[#A855F7]' : 'text-[#71717A]'} />}
                {label} {required && <span className="text-rose-500">*</span>}
            </label>
            <select
                id={id}
                value={value}
                onChange={e => onChange(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                className={`w-full bg-[#161618] border ${focused ? 'border-[#A855F7]' : 'border-[#2D2D30]'} rounded-sm py-2 px-3 text-xs ${value ? 'text-white' : 'text-[#71717A]'} transition-all outline-none cursor-pointer font-bold appearance-none`}
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2371717A' stroke-width='3'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5' /%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '0.6rem' }}
            >
                <option value="">SELECIONAR</option>
                {options.map((o: any) => <option key={o} value={o}>{o.toUpperCase()}</option>)}
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
                campeonato: matchData.campeonato,
                rodada: parseInt(matchData.rodada),
                mapa: matchData.mapa,
                equipe: matchData.equipe,
                colocacao: parseInt(matchData.colocacao),
                kill: totalKills,
                pontos_posicao: pontosPosicao,
                pontos_total: pontosTotal,
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
                posicao: parseInt(matchData.colocacao),
                player: p.nome,
                kill: parseInt(p.kills),
                morte: parseInt(p.morte),
                assistencia: parseInt(p.assistencias),
                queda: 0, // Placeholder se não houver campo
                dano_causado: parseInt(p.dano),
                derrubados: parseInt(p.derrubados),
                ressurgimento: parseInt(p.revividos)
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

            // Limpar alguns campos mantendo o contexto da partida
            setPlayers(players.map(p => ({ ...p, kills: '0', assistencias: '0', derrubados: '0', dano: '0', morte: '0', revividos: '0' })));
            setMatchData(prev => ({ ...prev, rodada: String(parseInt(prev.rodada) + 1 || '') }));

        } catch (err: any) {
            showToast(err.message || 'Erro ao salvar', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0B0B0C] text-white font-['Inter',sans-serif] selection:bg-[#A3E635] selection:text-black">
            {toast && <Toast message={toast.message} type={toast.type} />}

            {/* Tactical Header */}
            <header className="sticky top-0 z-50 bg-[#0B0B0CEE] backdrop-blur-xl border-b border-[#2D2D30]">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/')} className="p-1.5 border border-[#2D2D30] rounded-sm hover:bg-[#1A1A1C] transition-colors">
                            <ChevronLeft size={16} className="text-[#A1A1AA]" />
                        </button>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#A855F7]">Unified Squad Input</span>
                            <span className="text-[9px] font-bold text-[#71717A] uppercase tracking-tighter">Terminal de Métricas Elite</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#161618] border border-[#2D2D30] rounded-sm">
                            <Wallet size={12} className="text-amber-500" />
                            <span className="text-[10px] font-black">{creditos ?? '--'} CRÉDITOS</span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
                {/* 1. Dados da Partida */}
                <section className="animate-reveal">
                    <div className="flex items-center gap-2 mb-4">
                        <Activity size={14} className="text-[#A855F7]" />
                        <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#A1A1AA]">Dados da Partida</h2>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 p-6 bg-[#161618] border border-[#2D2D30] rounded-sm">
                        <InputField label="Data" type="date" value={matchData.data} onChange={(v: string) => setMatchData(p => ({ ...p, data: v }))} icon={Play} />
                        <InputField label="Campeonato" value={matchData.campeonato} onChange={(v: string) => setMatchData(p => ({ ...p, campeonato: v }))} placeholder="Ex: LBFF" icon={Trophy} />
                        <SelectField label="Mapa" value={matchData.mapa} onChange={(v: string) => setMatchData(p => ({ ...p, mapa: v }))} options={MAPAS} icon={Map} />
                        <InputField label="Rodada" type="number" value={matchData.rodada} onChange={(v: string) => setMatchData(p => ({ ...p, rodada: v }))} placeholder="No." icon={Hash} />
                        <SelectField label="Colocação" value={matchData.colocacao} onChange={(v: string) => setMatchData(p => ({ ...p, colocacao: v }))} options={COLOCACOES} icon={Trophy} />
                        <InputField label="Kills Squad" type="number" value={matchData.totalKillsManual} onChange={(v: string) => setMatchData(p => ({ ...p, totalKillsManual: v }))} icon={Sword} />

                        <div className="flex flex-col gap-1.5 w-full">
                            <span className="text-[9px] uppercase tracking-[0.2em] font-black text-[#BEF264]">Total de Pontos</span>
                            <div className="bg-[#BEF26410] border border-[#BEF26430] rounded-sm py-2 px-3 flex items-center justify-center">
                                <span className="text-xl font-black text-[#BEF264]">{totalPontosPartida}</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 2. Squad Container */}
                <section className="animate-reveal">
                    <div className="flex items-center gap-2 mb-4">
                        <Users size={14} className="text-[#A855F7]" />
                        <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#A1A1AA]">Integrantes do Squad</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {players.map((player, idx) => (
                            <div key={idx} className="flex flex-col gap-4 p-5 bg-[#161618] border border-[#2D2D30] rounded-sm transition-all hover:border-[#A855F7]/30">
                                <div className="pb-3 border-b border-[#2D2D30]">
                                    <InputField
                                        label={`Jogador ${idx + 1}`}
                                        placeholder="NOME DO PLAYER"
                                        value={player.nome}
                                        onChange={(v: string) => updatePlayer(idx, 'nome', v)}
                                        icon={Users}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <InputField label="Kills" type="number" value={player.kills} onChange={(v: string) => updatePlayer(idx, 'kills', v)} icon={Sword} />
                                    <InputField label="Assists" type="number" value={player.assistencias} onChange={(v: string) => updatePlayer(idx, 'assistencias', v)} icon={Target} />
                                    <InputField label="Derrub." type="number" value={player.derrubados} onChange={(v: string) => updatePlayer(idx, 'derrubados', v)} icon={Activity} />
                                    <InputField label="Dano" type="number" value={player.dano} onChange={(v: string) => updatePlayer(idx, 'dano', v)} icon={Activity} />
                                    <InputField label="Mortes" type="number" value={player.morte} onChange={(v: string) => updatePlayer(idx, 'morte', v)} icon={XCircle} />
                                    <InputField label="Reviv." type="number" value={player.revividos} onChange={(v: string) => updatePlayer(idx, 'revividos', v)} icon={HeartPulse} />
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
                        className="w-full max-w-2xl bg-[#BEF264] text-black py-4 px-8 rounded-sm font-black text-sm uppercase tracking-[0.4em] hover:bg-[#A855F7] hover:text-white transition-all disabled:opacity-30 disabled:pointer-events-none shadow-[0_0_30px_rgba(190,242,100,0.2)]"
                    >
                        {loading ? 'PROCESSANDO PROTOCOLO...' : 'SALVAR MÉTRICAS'}
                    </button>
                </div>
            </main>

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
