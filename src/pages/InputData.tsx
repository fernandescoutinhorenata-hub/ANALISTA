import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft, CheckCircle, XCircle, AlertTriangle, Trash2,
    Wallet, Camera, Loader2, Lock, Zap
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { verificarDesbloqueioConquistas } from '../utils/conquistas';
import { readScreenshot } from '../lib/vision';

const MAPAS = ['BERMUDA', 'PURGATÓRIO', 'KALAHARI', 'ALPINE', 'NOVA TERRA', 'SOLARA'];
const COLOCACOES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

// ─── Input Técnico ──────────────────────────────────────────────────────────
const InputField: React.FC<any> = ({ label, id, type = 'text', value, onChange, required, placeholder, className = "rounded-lg" }) => {
    return (
        <div className="flex flex-col gap-1.5 animate-reveal w-full">
            <label htmlFor={id} className="text-[11px] font-medium text-[var(--text-secondary)] flex items-center gap-1.5">
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
                    className={`input-base px-4 border-[var(--border-default)] bg-[var(--bg-surface)] ${className}`}
                />
            </div>
        </div>
    );
};

// ─── Select Técnico ──────────────────────────────────────────────────────────
const SelectField: React.FC<any> = ({ label, id, value, onChange, options, required, className = "rounded-lg" }) => {
    return (
        <div className="flex flex-col gap-1.5 animate-reveal w-full">
            <label htmlFor={id} className="text-[11px] font-medium text-[var(--text-secondary)] flex items-center gap-1.5">
                {label} {required && <span className="text-rose-500">*</span>}
            </label>
            <select
                id={id}
                value={value}
                onChange={e => onChange(e.target.value)}
                className={`input-base px-4 border-[var(--border-default)] bg-[var(--bg-surface)] appearance-none ${className}`}
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
        <div className="fixed top-6 right-6 z-[9999] flex items-center gap-3 px-5 py-3 bg-[var(--bg-surface)] border rounded-md animate-reveal shadow-2xl" style={{ borderColor: config.border }}>
            <config.Icon size={16} color={config.color} />
            <span className="text-[var(--text-primary)] text-xs font-semibold">{message}</span>
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
    const [ocrLoading, setOcrLoading] = useState(false);
    const [assinaturaAtiva, setAssinaturaAtiva] = useState(false);
    const [isUpsellModalOpen, setIsUpsellModalOpen] = useState(false);
    const [toast, setToast] = useState<any>(null);
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);
    const [resetLoading, setResetLoading] = useState(false);
    const screenshotInputRef = useRef<HTMLInputElement>(null);

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
        const checkSub = async () => {
            const { data } = await supabase
                .from('subscriptions')
                .select('*')
                .eq('user_id', user.id)
                .eq('status', 'ativo')
                .gt('data_fim', new Date().toISOString())
                .maybeSingle();
            setAssinaturaAtiva(!!data);
        };
        fetchPerfil();
        checkSub();
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

    // ─── OCR via Claude Vision (Anthropic) ─────────────────────────────────────
    const handleScreenshot = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (creditos !== null && creditos <= 0) {
            showToast('Sem créditos. Adquira mais para usar esta função.', 'error');
            return;
        }

        setOcrLoading(true);
        try {
            // Verificar Assinatura Ativa (Paywall OCR)
            const { data: sub, error: subError } = await supabase
                .from('subscriptions')
                .select('*')
                .eq('user_id', user!.id)
                .eq('status', 'ativo')
                .gt('data_fim', new Date().toISOString())
                .maybeSingle();

            if (subError || !sub) {
                showToast('Recurso exclusivo para assinantes. Acesse /admin-celo/planos para assinar.', 'error');
                setOcrLoading(false);
                return;
            }

            // Converter para base64
            const base64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                    const result = reader.result as string;
                    // Remove o prefixo data:image/...;base64,
                    resolve(result.split(',')[1]);
                };
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });

            // Extrair mediaType do arquivo (ex: "image/jpeg", "image/png")
            const mediaType = file.type || 'image/jpeg';

            // Chamar Claude Vision API
            const rawJson = await readScreenshot(base64, mediaType);

            if (!rawJson || rawJson === '{}') {
                showToast('Não foi possível extrair dados da imagem.', 'error');
                return;
            }

            // Claude retorna JSON estruturado diretamente
            // (a Edge Function já limpa markdown, mas fazemos fallback aqui também)
            let result: any;
            try {
                const cleaned = rawJson
                    .replace(/^```(?:json)?\s*/i, '')
                    .replace(/\s*```$/i, '')
                    .trim();
                result = JSON.parse(cleaned);
            } catch {
                console.error('[OCR] JSON inválido recebido:', rawJson);
                showToast(`Resposta inválida: ${rawJson.substring(0, 120)}`, 'error');
                return;
            }

            // Preencher campos automaticamente
            setMatchData(prev => ({
                ...prev,
                mapa: result.mapa,
                colocacao: String(result.colocacao),
            }));

            setPlayers(prev => prev.map((p, i) => {
                const j = result.jogadores[i];
                if (!j) return p;
                return {
                    ...p,
                    nome:        j.nome !== `Jogador ${i + 1}` ? j.nome : p.nome,
                    kills:       String(j.kills),
                    assistencias: String(j.assists),
                    derrubados:  String(j.derrubados),
                    dano:        String(j.dano),
                    morte:       String(j.mortes),
                    revividos:   String(j.ressurgimentos),
                };
            }));

            // Descontar 1 crédito
            if (user) {
                const novosSaldo = Math.max(0, (creditos ?? 1) - 1);
                await supabase.from('perfis').update({ usos_restantes: novosSaldo }).eq('id', user.id);
                setCreditos(novosSaldo);
            }

            showToast('Screenshot lida! Revise os dados antes de salvar.', 'success');
        } catch (err: any) {
            showToast(err.message || 'Erro ao processar screenshot.', 'error');
        } finally {
            setOcrLoading(false);
            // Limpar o input para permitir reusar o mesmo arquivo
            if (screenshotInputRef.current) screenshotInputRef.current.value = '';
        }
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
                            <h1 className="text-sm font-bold text-[var(--text-primary)]">Inserir Partida</h1>
                            <p className="text-[11px] font-medium text-[var(--text-tertiary)]">Preencha os dados do squad</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Botão Ler Screenshot */}
                        <button
                            onClick={() => {
                                if (assinaturaAtiva) {
                                    screenshotInputRef.current?.click();
                                } else {
                                    setIsUpsellModalOpen(true);
                                }
                            }}
                            disabled={ocrLoading}
                            className={`flex items-center gap-2 px-3 py-1.5 border rounded-md transition-all ${
                                assinaturaAtiva 
                                ? "bg-transparent border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--accent)]" 
                                : "opacity-50 cursor-not-allowed border-[var(--border-subtle)] text-[var(--text-tertiary)] bg-[var(--bg-surface)]"
                            }`}
                            title={assinaturaAtiva ? "Ler dados automaticamente de um screenshot" : "Recurso exclusivo para assinantes"}
                        >
                            {ocrLoading ? (
                                <><Loader2 size={14} className="animate-spin" /><span className="text-xs font-semibold">Lendo...</span></>
                            ) : (
                                <>
                                    {!assinaturaAtiva && <Lock size={14} className="text-[var(--accent)]" />}
                                    <span className="text-xs font-semibold">📸 Ler Screenshot</span>
                                    {!assinaturaAtiva && <span className="text-[9px] font-black bg-[var(--accent)] text-white px-1.5 py-0.5 rounded ml-1 tracking-tight">PRO</span>}
                                </>
                            )}
                        </button>
                        {/* Input oculto para a imagem */}
                        <input
                            ref={screenshotInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleScreenshot}
                        />

                        <button
                            onClick={() => setIsResetModalOpen(true)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-transparent border border-[var(--border-default)] rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-all"
                        >
                            <Trash2 size={14} />
                            <span className="text-xs font-semibold">Reiniciar Tabela</span>
                        </button>

                        <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--bg-hover)] border border-[var(--border-subtle)] rounded-md text-[var(--text-secondary)]">
                            <Wallet size={12} className="text-[var(--accent)]" />
                            <span className="text-[10px] font-bold">{creditos ?? '--'} CRÉDITOS</span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
                {/* 1. Dados da Partida */}
                <section className="animate-reveal">
                    <div className="flex items-center gap-2 mb-4">
                        <h2 className="text-sm font-bold text-[var(--text-primary)]">Dados da partida</h2>
                    </div>
                    <div className="card p-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                        <InputField label="Data" type="date" value={matchData.data} onChange={(v: string) => setMatchData(p => ({ ...p, data: v }))} className="rounded-lg" />
                        <InputField label="Campeonato" value={matchData.campeonato} onChange={(v: string) => setMatchData(p => ({ ...p, campeonato: v }))} placeholder="Ex: LBFF" className="rounded-lg" />
                        <SelectField label="Mapa" value={matchData.mapa} onChange={(v: string) => setMatchData(p => ({ ...p, mapa: v }))} options={MAPAS} className="rounded-lg" />
                        <InputField label="Rodada" type="number" value={matchData.rodada} onChange={(v: string) => setMatchData(p => ({ ...p, rodada: v }))} placeholder="No." className="rounded-lg" />
                        <SelectField label="Colocação" value={matchData.colocacao} onChange={(v: string) => setMatchData(p => ({ ...p, colocacao: v }))} options={COLOCACOES} className="rounded-lg" />
                        <InputField label="Kills Squad" type="number" value={matchData.totalKillsManual} onChange={(v: string) => setMatchData(p => ({ ...p, totalKillsManual: v }))} className="rounded-lg" />

                        <div className="flex flex-col gap-1.5 w-full">
                            <span className="text-[11px] font-medium text-[var(--text-secondary)]">Total de Pontos</span>
                            <div className="w-full h-[38px] flex items-center justify-center bg-[var(--accent-muted)] rounded-lg">
                                <span className="text-xl font-bold text-[var(--accent-hover)]">{totalPontosPartida}</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 2. Squad Container */}
                <section className="animate-reveal">
                    <div className="flex items-center gap-2 mb-4">
                        <h2 className="text-sm font-bold text-[var(--text-primary)]">Integrantes do squad</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {players.map((player, idx) => (
                            <div key={idx} className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl p-5 hover:border-[var(--accent-glow)] transition-all">
                                <div className="pb-4 mb-4 border-b border-[var(--border-subtle)]">
                                    <InputField
                                        label={`Jogador ${idx + 1}`}
                                        placeholder="Nome do Player"
                                        value={player.nome}
                                        onChange={(v: string) => updatePlayer(idx, 'nome', v)}
                                        className="rounded-md"
                                    />
                                    <span className="text-[11px] text-[var(--text-tertiary)] font-medium mt-1 inline-block">Métricas de partida</span>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <InputField label="Kills" type="number" value={player.kills} onChange={(v: string) => updatePlayer(idx, 'kills', v)} className="rounded-[6px]" />
                                    <InputField label="Assists" type="number" value={player.assistencias} onChange={(v: string) => updatePlayer(idx, 'assistencias', v)} className="rounded-[6px]" />
                                    <InputField label="Derrub." type="number" value={player.derrubados} onChange={(v: string) => updatePlayer(idx, 'derrubados', v)} className="rounded-[6px]" />
                                    <InputField label="Dano" type="number" value={player.dano} onChange={(v: string) => updatePlayer(idx, 'dano', v)} className="rounded-[6px]" />
                                    <InputField label="Mortes" type="number" value={player.morte} onChange={(v: string) => updatePlayer(idx, 'morte', v)} className="rounded-[6px]" />
                                    <InputField label="Reviv." type="number" value={player.revividos} onChange={(v: string) => updatePlayer(idx, 'revividos', v)} className="rounded-[6px]" />
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
                        className="w-full max-w-2xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white py-3.5 font-semibold text-sm rounded-[10px] transition-all shadow-lg shadow-purple-500/10"
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
                                    className="px-4 py-2 border border-[var(--border-default)] rounded-md text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleResetData}
                                    disabled={resetLoading}
                                    className="py-2 px-4 rounded-md bg-red-500/10 border border-red-500/30 text-red-500 text-sm font-bold hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
                                >
                                    {resetLoading ? 'LIMPENDO...' : 'CONFIRMAR'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 💎 Upsell Modal (Plano Pro) */}
            {isUpsellModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-reveal">
                    <div className="w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl p-8 shadow-2xl overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                            <Camera size={120} />
                        </div>
                        
                        <div className="flex flex-col items-center text-center gap-6 relative z-10">
                            <div className="w-16 h-16 rounded-2xl bg-[var(--accent-muted)] flex items-center justify-center text-[var(--accent)] shrink-0">
                                <Zap size={32} fill="currentColor" />
                            </div>
                            
                            <div>
                                <h3 className="text-2xl font-black text-[var(--text-primary)] mb-2 uppercase tracking-tight">
                                    Recurso exclusivo do Plano Pro
                                </h3>
                                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                                    Com o Plano Pro, tire um print do resultado da partida e o sistema preenche tudo automaticamente em segundos.
                                </p>
                            </div>

                            <ul className="text-left w-full space-y-3 bg-[var(--bg-main)]/50 p-5 rounded-xl border border-[var(--border-subtle)]">
                                {[
                                    'Leitura automática de screenshots',
                                    'Preenchimento instantâneo do formulário',
                                    'Economize tempo em cada partida'
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-xs font-semibold text-[var(--text-secondary)]">
                                        <div className="w-5 h-5 rounded-full bg-[var(--accent-green-muted)] flex items-center justify-center">
                                            <CheckCircle size={12} className="text-[var(--accent-green)]" />
                                        </div>
                                        {item}
                                    </li>
                                ))}
                            </ul>

                            <div className="flex flex-col gap-3 w-full">
                                <button
                                    onClick={() => navigate('/admin-celo/planos')}
                                    className="btn-primary w-full py-4 text-sm font-black uppercase tracking-widest shadow-xl shadow-[var(--accent-glow)]"
                                >
                                    Assinar agora — R$10/semana
                                </button>
                                <button
                                    onClick={() => setIsUpsellModalOpen(false)}
                                    className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] text-xs font-bold uppercase transition-colors py-2"
                                >
                                    Preencher manualmente
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
