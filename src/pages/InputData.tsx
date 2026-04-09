import React, { useState, useEffect, useRef } from 'react';
import { CadastroSquad, type SquadPlayer } from '../components/CadastroSquad';
import { matchNomeOficial } from '../utils/ocr-processing';
import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft, CheckCircle, XCircle, AlertTriangle, Trash2,
    Camera, Loader2, Zap, HelpCircle
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

    const [squadJogadores, setSquadJogadores] = useState<SquadPlayer[]>([]);
    const [loading, setLoading] = useState(false);
    const [ocrLoading, setOcrLoading] = useState(false);
    const [assinaturaAtiva, setAssinaturaAtiva] = useState(false);
    const [ocrUses, setOcrUses] = useState(0);
    const [isUpsellModalOpen, setIsUpsellModalOpen] = useState(false);
    const [toast, setToast] = useState<any>(null);
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);
    const [resetLoading, setResetLoading] = useState(false);

    // Estados para o Modal de Detalhes da Partida
    const [isMatchDetailModalOpen, setIsMatchDetailModalOpen] = useState(false);
    const [currentMatchId, setCurrentMatchId] = useState<string | null>(null);
    const [callDetail, setCallDetail] = useState({
        quebraCall: null as boolean | null,
        resultadoCall: null as 'win' | 'loss' | null,
        qualCall: ''
    });

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
        const checkSubAndUses = async () => {
            const { data: subData } = await supabase
                .from('subscriptions')
                .select('*')
                .eq('user_id', user.id)
                .eq('status', 'ativo')
                .gt('data_fim', new Date().toISOString())
                .maybeSingle();
            setAssinaturaAtiva(!!subData);

            const { data: profile } = await supabase
                .from('perfis')
                .select('ocr_uses')
                .eq('id', user.id)
                .single();
            if (profile) setOcrUses(profile.ocr_uses ?? 0);
            console.log('[OCR DEBUG] ocr_uses carregado:', profile?.ocr_uses, '| assinatura:', !!subData);
        };
        checkSubAndUses();
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

        console.log('[OCR DEBUG] ocr_uses:', ocrUses, '| assinaturaAtiva:', assinaturaAtiva);

        // 1. Verificar Assinatura Ativa ou Usos Gratuitos (Paywall OCR)
        // Se NÃO for Pro e já usou 4 vezes, abre Upsell
        if (!assinaturaAtiva && ocrUses >= 4) {
            setIsUpsellModalOpen(true);
            if (screenshotInputRef.current) screenshotInputRef.current.value = '';
            return;
        }

        setOcrLoading(true);
        try {
            // Converter para base64
            const base64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                    const result = reader.result as string;
                    resolve(result.split(',')[1]);
                };
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });

            const mediaType = file.type || 'image/jpeg';
            const rawJson = await readScreenshot(base64, mediaType);

            if (!rawJson || rawJson === '{}') {
                showToast('Não foi possível extrair dados da imagem.', 'error');
                return;
            }

            let result: any;
            try {
                const cleaned = rawJson
                    .replace(/^```(?:json)?\s*/i, '')
                    .replace(/\s*```$/i, '')
                    .trim();
                result = JSON.parse(cleaned);
            } catch {
                console.error('[OCR] JSON inválido recebido:', rawJson);
                showToast(`Resposta inválida. Tente novamente.`, 'error');
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
                    nome:        j.nome !== `Jogador ${i + 1}` ? matchNomeOficial(j.nome, squadJogadores.map(s => s.nome_oficial)) : p.nome,
                    kills:       String(j.kills),
                    assistencias: String(j.assists),
                    derrubados:  String(j.derrubados),
                    dano:        String(j.dano),
                    morte:       String(j.mortes),
                    revividos:   String(j.ressurgimentos),
                };
            }));



            // 2. Incrementar uso se não for PRO
            if (!assinaturaAtiva && user) {
                const nextUses = ocrUses + 1;
                await supabase.from('perfis').update({ ocr_uses: nextUses }).eq('id', user.id);
                setOcrUses(nextUses);
            }

            showToast('Screenshot lida! Revise os dados antes de salvar.', 'success');
        } catch (err: any) {
            showToast(err.message || 'Erro ao processar screenshot.', 'error');
        } finally {
            setOcrLoading(false);
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

        if (players.some(p => !p.nome || p.nome.trim() === '')) {
            showToast('Preencha o nome de todos os jogadores', 'error');
            return;
        }



        setLoading(true);
        try {
            // Verifica duplicidade de Data, Mapa e Rodada para evitar conflitos na consulta do painel
            const { count, error: dupCheckError } = await supabase
                .from('partidas_geral')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('data', matchData.data)
                .eq('rodada', matchData.rodada)
                .eq('campeonato', matchData.campeonato.toUpperCase());

            if (!dupCheckError && count && count > 0) {
                const proceed = window.confirm("Já existe uma partida registrada nessa data, rodada e campeonato.\nTem certeza que deseja salvar novamente?");
                if (!proceed) {
                    setLoading(false);
                    return;
                }
            }

            const totalKills = totalKillsSquad;
            const pontosTotal = totalPontosPartida;

            // 1. Inserir em partidas_geral e pegar o ID
            const { data: inserted, error: errorGeral } = await supabase.from('partidas_geral').insert({
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
            }).select('id').single();

            if (errorGeral) throw errorGeral;

            // 2. Inserir em performance_jogadores para cada player
            const performanceRecords = players.map(p => {
                const nomeSeguro = matchNomeOficial(p.nome, squadJogadores.map(s => s.nome_oficial));
                return {
                    user_id: user.id,
                    partida_id: inserted?.id, // Vínculo direto com a partida geral
                    data: matchData.data,
                    equipe: matchData.equipe,
                    modo: 'Campeonato',
                    mapa: matchData.mapa,
                    campeonato: matchData.campeonato.toUpperCase(),
                    rodada: Math.max(0, parseInt(matchData.rodada) || 0).toString(),
                    posicao: Math.max(1, parseInt(matchData.colocacao) || 1),
                    player: nomeSeguro || 'JOGADOR DESCONHECIDO',
                    kill: Math.max(0, parseInt(p.kills) || 0),
                    morte: Math.max(0, parseInt(p.morte) || 0),
                    assistencia: Math.max(0, parseInt(p.assistencias) || 0),
                    queda: 0,
                    dano_causado: Math.max(0, parseInt(p.dano) || 0),
                    derrubados: Math.max(0, parseInt(p.derrubados) || 0),
                    ressurgimento: Math.max(0, parseInt(p.revividos) || 0)
                };
            });

            const { error: errorPerf } = await supabase.from('performance_jogadores').insert(performanceRecords);
            if (errorPerf) throw errorPerf;

            if (inserted?.id) {
                setCurrentMatchId(inserted.id);
                setIsMatchDetailModalOpen(true);
            }

            showToast('Squad Salvo com Sucesso!', 'success');

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

            // A abertura do modal já limpa os dados caso seja pulada/confirmada.

        } catch (err: any) {
            showToast(err.message || 'Erro ao salvar', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveCallDetails = async () => {
        if (!currentMatchId) return;
        setLoading(true);
        try {
            const { error } = await supabase.from('partidas_geral').update({
                quebra_call: true,
                resultado_call: callDetail.resultadoCall,
                qual_call: callDetail.qualCall ? callDetail.qualCall.toUpperCase() : null
            }).eq('id', currentMatchId);

            if (error) throw error;
            setIsMatchDetailModalOpen(false);
            window.location.reload();
        } catch (err: any) {
            showToast(err.message || 'Erro ao salvar detalhes', 'error');
            setLoading(false);
        }
    };

    const handleNoQuebraCall = async () => {
        if (!currentMatchId) return;
        setCallDetail(p => ({ ...p, quebraCall: false }));
        setLoading(true);
        try {
            const { error } = await supabase.from('partidas_geral').update({
                quebra_call: false,
                resultado_call: null,
                qual_call: null
            }).eq('id', currentMatchId);

            if (error) throw error;
            setIsMatchDetailModalOpen(false);
            window.location.reload();
        } catch (err: any) {
            showToast(err.message || 'Erro', 'error');
            setLoading(false);
        }
    };

    const handleCloseDetailModal = () => {
        setIsMatchDetailModalOpen(false);
        window.location.reload();
    };
    const handleResetData = async () => {
        if (!user || resetLoading) return;
        setResetLoading(true);
        try {
            // Executamos as deleções em paralelo para maior performance e resiliência
            const [resPerf, resGeral, resConq] = await Promise.all([
                supabase.from('performance_jogadores').delete().eq('user_id', user.id),
                supabase.from('partidas_geral').delete().eq('user_id', user.id),
                supabase.from('conquistas_jogadores').delete().eq('jogador_id', user.id)
            ]);

            if (resPerf.error) throw resPerf.error;
            if (resGeral.error) throw resGeral.error;
            // Se as conquistas falharem não bloqueia o usuário principal mas logamos como segurança
            if (resConq.error) console.warn('[RESET] Erro ao limpar conquistas:', resConq.error);

            showToast('Tabela e histórico reiniciados!', 'success');
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

                        {!assinaturaAtiva && (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--bg-hover)] border border-[var(--border-subtle)] rounded-md">
                                <span className="text-[10px] font-bold text-[var(--text-secondary)]">
                                    {Math.max(0, 4 - ocrUses)} de 4 usos gratuitos restantes
                                </span>
                            </div>
                        )}

                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
                <CadastroSquad onSquadChange={setSquadJogadores} />

                {/* 1. Dados da Partida */}
                <section className="animate-reveal">
                    <div className="flex items-center gap-2 mb-4">
                        <h2 className="text-sm font-bold text-[var(--text-primary)]">Dados da partida</h2>
                    </div>
                    <div className="card p-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                        <InputField label="Data" type="date" value={matchData.data} onChange={(v: string) => setMatchData(p => ({ ...p, data: v }))} className="rounded-lg" />
                        <InputField label="Campeonato" value={matchData.campeonato} onChange={(v: string) => setMatchData(p => ({ ...p, campeonato: v.trim().toUpperCase() }))} placeholder="Ex: LBFF" className="rounded-lg" />
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
                                    <div className="flex flex-col gap-1.5 animate-reveal w-full">
                                        <label className="text-[11px] font-bold text-[#F97316] flex items-center gap-1.5 uppercase tracking-wide">
                                            Jogador {idx + 1}
                                        </label>
                                        <div className="relative flex items-center">
                                            <input
                                                type="text"
                                                placeholder="Nome do Player"
                                                value={player.nome}
                                                onChange={e => updatePlayer(idx, 'nome', e.target.value.toUpperCase())}
                                                className="input-base px-4 pr-10 border-[#F97316] bg-[#1C1410] rounded-md w-full focus:ring-1 focus:ring-[#F97316] uppercase transition-all shadow-[0_0_15px_rgba(249,115,22,0.1)] font-bold text-[#F97316]"
                                            />
                                            <div className="absolute right-3 text-[#F97316] pointer-events-none">
                                                <AlertTriangle size={16} />
                                            </div>
                                        </div>
                                        <span className="text-[10px] text-[#F97316]/80 font-medium mt-0.5">Confirme o nome antes de salvar</span>
                                    </div>
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

                {/* 3. Botões de Ação */}
                <div className="flex flex-col items-center gap-3 pt-8 animate-reveal max-w-2xl mx-auto w-full">
                    {/* Contador de usos gratuitos */}
                    {!assinaturaAtiva && (
                        <p style={{
                            fontSize: '12px',
                            fontWeight: 500,
                            textAlign: 'center',
                            color: ocrUses >= 3
                                ? 'var(--accent-red)'
                                : ocrUses >= 2
                                    ? 'var(--accent-amber)'
                                    : 'var(--text-secondary)',
                            marginBottom: '-4px'
                        }}>
                            {ocrUses} de 4 leituras gratuitas utilizadas
                        </p>
                    )}

                    {/* Botão Ler Screenshot */}
                    <button
                        onClick={() => {
                            console.log('[OCR DEBUG] botão clicado | assinatura:', assinaturaAtiva, '| ocrUses:', ocrUses);
                            if (assinaturaAtiva || ocrUses < 4) {
                                screenshotInputRef.current?.click();
                            } else {
                                setIsUpsellModalOpen(true);
                            }
                        }}
                        disabled={ocrLoading}
                        className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white py-3.5 font-bold text-sm rounded-[10px] transition-all shadow-lg shadow-purple-500/10 flex items-center justify-center gap-2"
                    >
                        {ocrLoading ? (
                            <><Loader2 size={16} className="animate-spin" /><span>LENDO...</span></>
                        ) : (
                            <span>Ler Screenshot</span>
                        )}
                    </button>

                    <button
                        onClick={handleSaveSquad}
                        disabled={loading || players.some(p => !p.nome || p.nome.trim() === '')}
                        className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:bg-[#27272A] disabled:text-[#A1A1AA] disabled:shadow-none disabled:cursor-not-allowed text-white py-3.5 font-bold text-sm rounded-[10px] transition-all shadow-lg shadow-purple-500/10"
                    >
                        {loading ? 'PROCESSANDO...' : 'SALVAR PARTIDA'}
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
                                    {ocrUses >= 4 ? "Seus usos gratuitos acabaram" : "Recurso exclusivo do Plano Pro"}
                                </h3>
                                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                                    {ocrUses >= 4 
                                        ? "Você usou todos os 4 usos gratuitos. Assine o Plano Pro para continuar usando sem limite."
                                        : "Com o Plano Pro, tire um print do resultado da partida e o sistema preenche tudo automaticamente em segundos."
                                    }
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

            

            {/* 📊 Modal de Detalhes da Partida (Pós-Salvamento) */}
            {isMatchDetailModalOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-reveal">
                    <div className="w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl p-8 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                            <HelpCircle size={100} />
                        </div>

                        <div className="flex flex-col gap-6 relative z-10">
                            <div className="flex flex-col items-center text-center gap-2">
                                <div className="w-12 h-12 rounded-xl bg-[var(--accent-muted)] flex items-center justify-center text-[var(--accent)] mb-2">
                                    <Zap size={24} fill="currentColor" />
                                </div>
                                <h3 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tight">Detalhes da Partida</h3>
                                <p className="text-xs text-[var(--text-secondary)] font-medium">Preencha para análise completa do coach</p>
                            </div>

                            <div className="space-y-6 mt-4">
                                {/* Pergunta 1: Quebra de Call */}
                                <div className="space-y-3">
                                    <label className="text-[11px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
                                        Houve quebra de call?
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button 
                                            onClick={() => setCallDetail(p => ({ ...p, quebraCall: true }))}
                                            className={`py-3 rounded-lg text-xs font-bold transition-all border ${callDetail.quebraCall === true ? 'bg-[var(--accent)] border-[var(--accent)] text-white' : 'bg-[var(--bg-main)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'}`}
                                        >
                                            SIM
                                        </button>
                                        <button 
                                            onClick={handleNoQuebraCall}
                                            className={`py-3 rounded-lg text-xs font-bold transition-all border ${callDetail.quebraCall === false ? 'bg-[var(--accent)] border-[var(--accent)] text-white' : 'bg-[var(--bg-main)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'}`}
                                        >
                                            {loading && callDetail.quebraCall === false ? 'Aguarde...' : 'NÃO'}
                                        </button>
                                    </div>
                                </div>

                                {/* Condicional: Se Houve quebra de call */}
                                {callDetail.quebraCall === true && (
                                    <div className="space-y-6 animate-reveal">
                                        {/* Pergunta 2: Resultado */}
                                        <div className="space-y-3">
                                            <label className="text-[11px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
                                                Qual foi o resultado?
                                            </label>
                                            <div className="grid grid-cols-2 gap-3">
                                                <button 
                                                    onClick={() => setCallDetail(p => ({ ...p, resultadoCall: 'win' }))}
                                                    className={`py-3 rounded-lg text-xs font-bold transition-all border ${callDetail.resultadoCall === 'win' ? 'bg-[var(--accent-green)] border-[var(--accent-green)] text-white' : 'bg-[var(--bg-main)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'}`}
                                                >
                                                    WIN
                                                </button>
                                                <button 
                                                    onClick={() => setCallDetail(p => ({ ...p, resultadoCall: 'loss' }))}
                                                    className={`py-3 rounded-lg text-xs font-bold transition-all border ${callDetail.resultadoCall === 'loss' ? 'bg-[var(--accent-red)] border-[var(--accent-red)] text-white' : 'bg-[var(--bg-main)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'}`}
                                                >
                                                    LOSS
                                                </button>
                                            </div>
                                        </div>

                                        {/* Pergunta 3: Qual Call (Condicional) */}
                                        <div className="space-y-3">
                                            <label className="text-[11px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
                                                Em qual call quebramos?
                                            </label>
                                            <input 
                                                type="text"
                                                value={callDetail.qualCall}
                                                onChange={(e) => setCallDetail(p => ({ ...p, qualCall: e.target.value }))}
                                                placeholder="Ex: Call do final, call da zona..."
                                                className="w-full bg-[var(--bg-main)] border border-[var(--border-subtle)] rounded-lg px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)] transition-all"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col gap-3 mt-4">
                                {callDetail.quebraCall === true && callDetail.resultadoCall !== null && (
                                    <button
                                        onClick={handleSaveCallDetails}
                                        disabled={loading}
                                        className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white py-4 font-black uppercase tracking-widest text-xs rounded-xl shadow-xl shadow-[var(--accent-glow)] transition-all disabled:opacity-30 animate-reveal"
                                    >
                                        {loading ? 'SALVANDO...' : 'Salvar e Continuar'}
                                    </button>
                                )}
                                <button
                                    onClick={handleCloseDetailModal}
                                    className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] text-[10px] font-bold uppercase transition-colors py-2 tracking-widest"
                                >
                                    Pular e fechar
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
