import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft, Save, CheckCircle, AlertCircle, XCircle,
    Wallet
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

// ─── Design Tokens ─────────────────────────────────────────────────────────
const COLORS = {
    bgMain: '#0A0E17',
    bgCard: '#161B28',
    border: '#2A3042',
    textPri: '#FFFFFF',
    textSec: '#B0B8C3',
    textTer: '#7A8291',
    purple: '#8A2BE2',
    green: '#00FF7F',
    red: '#FF0055',
    cyan: '#00BFFF',
    gold: '#FFD700',
};

const MAPAS = ['Bermuda', 'Purgatório', 'Alpine', 'Bermuda Remastered', 'Outro'];
const MODOS = ['Campeonato', 'Ranqueado', 'Casual', 'Treino'];
const RESULTADOS_QUEBRA = ['GANHOU', 'PERDEU', '-'];

// ─── Input Estilizado ────────────────────────────────────────────────────────
interface InputFieldProps {
    label: string;
    id: string;
    type?: string;
    value: string | number;
    onChange: (val: string) => void;
    required?: boolean;
    min?: number;
    placeholder?: string;
}
const InputField: React.FC<InputFieldProps> = ({ label, id, type = 'text', value, onChange, required, min, placeholder }) => {
    const [focused, setFocused] = useState(false);
    return (
        <div className="flex flex-col gap-1.5">
            <label htmlFor={id} style={{ color: COLORS.textSec, fontSize: '12px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                {label} {required && <span style={{ color: COLORS.red }}>*</span>}
            </label>
            <input
                id={id}
                type={type}
                value={value}
                min={min}
                placeholder={placeholder}
                onChange={e => onChange(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                style={{
                    backgroundColor: '#0D1117',
                    border: `1px solid ${focused ? COLORS.purple : COLORS.border}`,
                    borderRadius: '10px',
                    padding: '10px 14px',
                    color: COLORS.textPri,
                    fontSize: '14px',
                    fontFamily: 'Inter, sans-serif',
                    outline: 'none',
                    transition: 'all 0.2s',
                    boxShadow: focused ? `0 0 0 3px ${COLORS.purple}25` : 'none',
                    width: '100%',
                }}
            />
        </div>
    );
};

// ─── Select Estilizado ───────────────────────────────────────────────────────
interface SelectFieldProps {
    label: string;
    id: string;
    value: string;
    onChange: (val: string) => void;
    options: string[];
    required?: boolean;
}
const SelectField: React.FC<SelectFieldProps> = ({ label, id, value, onChange, options, required }) => {
    const [focused, setFocused] = useState(false);
    return (
        <div className="flex flex-col gap-1.5">
            <label htmlFor={id} style={{ color: COLORS.textSec, fontSize: '12px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                {label} {required && <span style={{ color: COLORS.red }}>*</span>}
            </label>
            <select
                id={id}
                value={value}
                onChange={e => onChange(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                style={{
                    backgroundColor: '#0D1117',
                    border: `1px solid ${focused ? COLORS.purple : COLORS.border}`,
                    borderRadius: '10px',
                    padding: '10px 14px',
                    color: value ? COLORS.textPri : COLORS.textTer,
                    fontSize: '14px',
                    fontFamily: 'Inter, sans-serif',
                    outline: 'none',
                    transition: 'all 0.2s',
                    boxShadow: focused ? `0 0 0 3px ${COLORS.purple}25` : 'none',
                    width: '100%',
                    cursor: 'pointer',
                }}
            >
                <option value="">Selecione...</option>
                {options.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
        </div>
    );
};

// ─── Toggle/Switch ─────────────────────────────────────────────────────────
interface ToggleFieldProps {
    label: string;
    id: string;
    checked: boolean;
    onChange: (val: boolean) => void;
}
const ToggleField: React.FC<ToggleFieldProps> = ({ label, id, checked, onChange }) => (
    <div className="flex flex-col gap-1.5">
        <label htmlFor={id} style={{ color: COLORS.textSec, fontSize: '12px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            {label}
        </label>
        <button
            id={id}
            type="button"
            onClick={() => onChange(!checked)}
            style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                backgroundColor: 'transparent', border: 'none', cursor: 'pointer',
                padding: '6px 0',
            }}
        >
            <div style={{
                width: '44px', height: '24px', borderRadius: '12px',
                backgroundColor: checked ? COLORS.purple : COLORS.border,
                position: 'relative', transition: 'all 0.3s',
                boxShadow: checked ? `0 0 10px ${COLORS.purple}60` : 'none',
            }}>
                <div style={{
                    width: '18px', height: '18px', borderRadius: '50%',
                    backgroundColor: COLORS.textPri,
                    position: 'absolute', top: '3px',
                    left: checked ? '23px' : '3px',
                    transition: 'all 0.3s',
                }} />
            </div>
            <span style={{ color: checked ? COLORS.green : COLORS.textTer, fontSize: '13px', fontWeight: 600 }}>
                {checked ? 'SIM' : 'NÃO'}
            </span>
        </button>
    </div>
);

// ─── Toast Component ─────────────────────────────────────────────────────────
type ToastType = 'success' | 'error' | 'warning';
interface ToastProps { message: string; type: ToastType; }
const Toast: React.FC<ToastProps> = ({ message, type }) => {
    const config = {
        success: { bg: `${COLORS.green}15`, border: `${COLORS.green}50`, color: COLORS.green, Icon: CheckCircle },
        error: { bg: `${COLORS.red}15`, border: `${COLORS.red}50`, color: COLORS.red, Icon: XCircle },
        warning: { bg: `${COLORS.gold}15`, border: `${COLORS.gold}50`, color: COLORS.gold, Icon: AlertCircle },
    }[type];
    return (
        <div style={{
            position: 'fixed', top: '24px', right: '24px', zIndex: 9999,
            backgroundColor: config.bg, border: `1px solid ${config.border}`,
            borderRadius: '12px', padding: '14px 20px',
            display: 'flex', alignItems: 'center', gap: '10px',
            fontFamily: 'Inter, sans-serif', animation: 'slideIn 0.3s ease',
            backdropFilter: 'blur(10px)',
        }}>
            <config.Icon size={20} color={config.color} />
            <span style={{ color: config.color, fontWeight: 600, fontSize: '14px' }}>{message}</span>
        </div>
    );
};

// ─── Tabela de Pontos por Colocação (Mobile Oficial) ─────────────────────────
const PONTOS_POR_COLOCACAO: Record<number, number> = {
    1: 12, 2: 9, 3: 8, 4: 7, 5: 6,
    6: 5, 7: 4, 8: 3, 9: 2, 10: 1,
    11: 0, 12: 0,
};
const getPontosColocacao = (colocacao: string): number => {
    const pos = parseInt(colocacao);
    if (isNaN(pos) || pos < 1) return 0;
    if (pos > 12) return 0;
    return PONTOS_POR_COLOCACAO[pos] ?? 0;
};

// ─── Formulário Geral ─────────────────────────────────────────────────────────
interface GeralForm {
    data: string; campeonato: string; rodada: string; mapa: string;
    equipe: string; colocacao: string; kill: string; pontos_posicao: string;
    booyah: boolean; quebra_de_call: boolean; resultado_quebra: string;
}
const GERAL_INIT: GeralForm = {
    data: '', campeonato: '', rodada: '', mapa: '', equipe: '',
    colocacao: '', kill: '0', pontos_posicao: '0', booyah: false,
    quebra_de_call: false, resultado_quebra: '-',
};

// ─── Formulário Performance ───────────────────────────────────────────────────
interface PerfForm {
    data: string; equipe: string; modo: string; mapa: string; posicao: string;
    player: string; kill: string; morte: string; assistencia: string;
    queda: string; dano_causado: string; derrubados: string; ressurgimento: string;
}
const PERF_INIT: PerfForm = {
    data: '', equipe: '', modo: '', mapa: '', posicao: '',
    player: '', kill: '0', morte: '0', assistencia: '0',
    queda: '0', dano_causado: '0', derrubados: '0', ressurgimento: '0',
};

// ─── Main Component ────────────────────────────────────────────────────────────
export const InputData: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'geral' | 'performance'>('geral');
    const [geralForm, setGeralForm] = useState<GeralForm>(GERAL_INIT);
    const [perfForm, setPerfForm] = useState<PerfForm>(PERF_INIT);
    const [creditos, setCreditos] = useState<number | null>(null);
    const [nomeUsuario, setNomeUsuario] = useState<string>('');
    const [loading, setSaving] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
    // Flag: pontos_posicao foi calculado automaticamente pela colocação
    const [pontosAutoCalculados, setPontosAutoCalculados] = useState(false);

    // Buscar créditos em realtime
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
        fetchPerfil();

        // Realtime subscription
        const channel = supabase
            .channel('perfil-changes')
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'perfis', filter: `id=eq.${user.id}` },
                payload => setCreditos((payload.new as any).usos_restantes)
            )
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [user]);

    const showToast = (message: string, type: ToastType) => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    // ── Auto-calcular pontos_posicao ao alterar colocação ─────────────────────
    useEffect(() => {
        if (!geralForm.colocacao) return;
        const pts = getPontosColocacao(geralForm.colocacao);
        setGeralForm(prev => ({ ...prev, pontos_posicao: String(pts) }));
        setPontosAutoCalculados(true);
    }, [geralForm.colocacao]);

    const checkCreditos = async (): Promise<boolean> => {
        const { data } = await supabase.from('perfis').select('usos_restantes').eq('id', user!.id).single();
        if (!data || data.usos_restantes === 0) {
            showToast('Saldo Insuficiente! Recarregue seus usos.', 'warning');
            return false;
        }
        return true;
    };

    const decrementarCredito = async () => {
        await supabase.from('perfis').update({ usos_restantes: (creditos ?? 1) - 1 }).eq('id', user!.id);
    };

    // ── Salvar Geral ───────────────────────────────────────────────────────────
    const salvarGeral = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        if (!(await checkCreditos())) return;

        const pontos_total = (parseInt(geralForm.kill) || 0) + (parseInt(geralForm.pontos_posicao) || 0);
        setSaving(true);
        try {
            const { error } = await supabase.from('partidas_geral').insert({
                user_id: user.id,
                data: geralForm.data,
                campeonato: geralForm.campeonato,
                rodada: parseInt(geralForm.rodada) || null,
                mapa: geralForm.mapa,
                equipe: geralForm.equipe,
                colocacao: parseInt(geralForm.colocacao) || null,
                kill: parseInt(geralForm.kill) || 0,
                pontos_posicao: parseInt(geralForm.pontos_posicao) || 0,
                pontos_total,
                booyah: geralForm.booyah,
                quebra_de_call: geralForm.quebra_de_call,
                resultado_quebra: geralForm.quebra_de_call ? geralForm.resultado_quebra : '-',
            });
            if (error) throw error;
            await decrementarCredito();
            showToast('Dados salvos com sucesso! ✅', 'success');
            setGeralForm(GERAL_INIT);
        } catch (err: any) {
            showToast(`Erro ao salvar: ${err.message}`, 'error');
        } finally {
            setSaving(false);
        }
    };

    // ── Salvar Performance ─────────────────────────────────────────────────────
    const salvarPerformance = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        if (!(await checkCreditos())) return;

        setSaving(true);
        try {
            const { error } = await supabase.from('performance_jogadores').insert({
                user_id: user.id,
                data: perfForm.data,
                equipe: perfForm.equipe,
                modo: perfForm.modo,
                mapa: perfForm.mapa,
                posicao: parseInt(perfForm.posicao) || null,
                player: perfForm.player,
                kill: parseInt(perfForm.kill) || 0,
                morte: parseInt(perfForm.morte) || 0,
                assistencia: parseInt(perfForm.assistencia) || 0,
                queda: parseInt(perfForm.queda) || 0,
                dano_causado: parseInt(perfForm.dano_causado) || 0,
                derrubados: parseInt(perfForm.derrubados) || 0,
                ressurgimento: parseInt(perfForm.ressurgimento) || 0,
            });
            if (error) throw error;
            await decrementarCredito();
            showToast('Dados salvos com sucesso! ✅', 'success');
            setPerfForm(PERF_INIT);
        } catch (err: any) {
            showToast(`Erro ao salvar: ${err.message}`, 'error');
        } finally {
            setSaving(false);
        }
    };

    const gSet = (key: keyof GeralForm, val: string | boolean) => setGeralForm(p => ({ ...p, [key]: val }));
    const pSet = (key: keyof PerfForm, val: string) => setPerfForm(p => ({ ...p, [key]: val }));

    const pontos_total_calculado = (parseInt(geralForm.kill) || 0) + (parseInt(geralForm.pontos_posicao) || 0);

    return (
        <div className="min-h-screen" style={{ backgroundColor: COLORS.bgMain, fontFamily: 'Inter, sans-serif', color: COLORS.textPri }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
                @keyframes slideIn { from { transform: translateX(120%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
                select option { background-color: #161B28; color: #FFFFFF; }
            `}</style>

            {/* Toast */}
            {toast && <Toast message={toast.message} type={toast.type} />}

            {/* ── Header ──────────────────────────────────────────── */}
            <header style={{
                backgroundColor: '#0A0E17CC', borderBottom: `1px solid ${COLORS.border}`,
                backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 40,
            }}>
                <div className="max-w-4xl mx-auto flex items-center justify-between px-6 py-4">
                    {/* Logo + Nav */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/')}
                            style={{ backgroundColor: `${COLORS.purple}18`, border: `1px solid ${COLORS.purple}40`, borderRadius: '10px', padding: '8px 12px', color: COLORS.purple, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
                        >
                            <ChevronLeft size={16} /> Dashboard
                        </button>
                        <div
                            style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', transition: 'transform 0.2s', margin: '10px 0' }}
                            onClick={() => navigate('/')}
                            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            <img
                                src="/image_10.png"
                                alt="Logo Celo Tracker"
                                className="w-auto object-contain"
                                style={{ height: '120px', imageRendering: 'high-quality' as any }}
                            />
                        </div>
                    </div>

                    {/* Usuário + Créditos */}
                    <div className="flex items-center gap-3">
                        {/* Badge de Créditos */}
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            backgroundColor: COLORS.bgCard, border: `1px solid ${COLORS.border}`,
                            borderRadius: '10px', padding: '8px 14px',
                        }}>
                            <Wallet size={16} style={{ color: COLORS.gold }} />
                            <span style={{ fontSize: '12px', color: COLORS.textSec, fontWeight: 600 }}>Créditos:</span>
                            <span style={{
                                fontSize: '15px', fontWeight: 800,
                                color: creditos === null ? COLORS.textTer : creditos <= 10 ? COLORS.red : COLORS.green,
                            }}>
                                {creditos === null ? '...' : creditos}
                            </span>
                        </div>

                        {/* Avatar + Nome */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                                width: '36px', height: '36px', borderRadius: '50%',
                                background: `linear-gradient(135deg, ${COLORS.purple}, ${COLORS.cyan})`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: 800, fontSize: '14px', color: '#FFF',
                            }}>
                                {(nomeUsuario || user?.email || '?')[0].toUpperCase()}
                            </div>
                            <div className="hidden md:block">
                                <p style={{ fontSize: '13px', fontWeight: 700, color: COLORS.textPri }}>{nomeUsuario || user?.email}</p>
                                <p style={{ fontSize: '11px', color: COLORS.textTer }}>Operador</p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* ── Conteúdo ─────────────────────────────────────────── */}
            <main className="max-w-4xl mx-auto px-6 py-8">
                {/* Page Title */}
                <div className="mb-8">
                    <h1 style={{ fontSize: '28px', fontWeight: 900, color: COLORS.textPri, marginBottom: '4px' }}>
                        Inserir Dados
                    </h1>
                    <p style={{ fontSize: '14px', color: COLORS.textTer }}>
                        Preencha os formulários abaixo para registrar dados de partidas e performance.
                    </p>
                </div>

                {/* ── Tab Switcher ──────────────────────────────────── */}
                <div style={{
                    display: 'flex', gap: '4px',
                    backgroundColor: COLORS.bgCard, border: `1px solid ${COLORS.border}`,
                    borderRadius: '12px', padding: '4px', marginBottom: '24px', width: 'fit-content',
                }}>
                    {[
                        { id: 'geral', label: '📋 Geral' },
                        { id: 'performance', label: '🎮 Performance Jogadores' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as 'geral' | 'performance')}
                            style={{
                                padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                                fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px',
                                transition: 'all 0.2s',
                                backgroundColor: activeTab === tab.id ? COLORS.purple : 'transparent',
                                color: activeTab === tab.id ? '#FFF' : COLORS.textTer,
                                boxShadow: activeTab === tab.id ? `0 0 16px ${COLORS.purple}40` : 'none',
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* ── Formulário Geral ────────────────────────────────── */}
                {activeTab === 'geral' && (
                    <form onSubmit={salvarGeral}>
                        <div style={{
                            backgroundColor: COLORS.bgCard, border: `1px solid ${COLORS.border}`,
                            borderRadius: '16px', padding: '28px', marginBottom: '20px',
                        }}>
                            <h2 style={{ fontSize: '16px', fontWeight: 800, color: COLORS.textPri, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: COLORS.cyan, display: 'inline-block' }} />
                                Dados da Partida
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <InputField label="Data" id="g-data" type="date" value={geralForm.data} onChange={v => gSet('data', v)} required />
                                <InputField label="Campeonato" id="g-camp" value={geralForm.campeonato} onChange={v => gSet('campeonato', v)} placeholder="Ex: LBFF, ESL..." required />
                                <InputField label="Rodada" id="g-rod" type="number" value={geralForm.rodada} onChange={v => gSet('rodada', v)} min={1} placeholder="Nº da rodada" required />
                                <SelectField label="Mapa" id="g-mapa" value={geralForm.mapa} onChange={v => gSet('mapa', v)} options={MAPAS} required />
                                <InputField label="Equipe" id="g-eq" value={geralForm.equipe} onChange={v => gSet('equipe', v)} placeholder="Nome da equipe" required />
                                <InputField label="Colocação" id="g-col" type="number" value={geralForm.colocacao} onChange={v => gSet('colocacao', v)} min={1} placeholder="1º, 2º..." required />
                                <InputField label="Kills" id="g-kill" type="number" value={geralForm.kill} onChange={v => gSet('kill', v)} min={0} />

                                {/* Pontos / Posição — read-only, auto-calculado */}
                                <div className="flex flex-col gap-1.5">
                                    <label htmlFor="g-pp" style={{ color: COLORS.textSec, fontSize: '12px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                        Pontos / Posição
                                        {pontosAutoCalculados && (
                                            <span style={{ marginLeft: '8px', fontSize: '10px', color: COLORS.purple, fontWeight: 700 }}>AUTO ✓</span>
                                        )}
                                    </label>
                                    <div
                                        id="g-pp"
                                        style={{
                                            backgroundColor: pontosAutoCalculados ? `${COLORS.purple}18` : '#0D1117',
                                            border: `1px solid ${pontosAutoCalculados ? COLORS.purple : COLORS.border}`,
                                            borderRadius: '10px',
                                            padding: '10px 14px',
                                            color: pontosAutoCalculados ? COLORS.purple : COLORS.textPri,
                                            fontSize: '18px',
                                            fontWeight: 800,
                                            fontFamily: 'Inter, sans-serif',
                                            boxShadow: pontosAutoCalculados ? `0 0 16px ${COLORS.purple}40, inset 0 0 8px ${COLORS.purple}10` : 'none',
                                            transition: 'all 0.3s',
                                            letterSpacing: '0.02em',
                                        }}
                                    >
                                        {geralForm.pontos_posicao}
                                        <span style={{ fontSize: '11px', marginLeft: '6px', color: COLORS.textTer, fontWeight: 400 }}>pts</span>
                                    </div>
                                </div>
                            </div>

                            {/* Mini-tabela de referência */}
                            <div style={{ marginTop: '14px', padding: '12px 16px', backgroundColor: '#0D1117', border: `1px solid ${COLORS.border}`, borderRadius: '10px' }}>
                                <p style={{ fontSize: '10px', fontWeight: 700, color: COLORS.textTer, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Pontos por Colocação (tabela oficial)</p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    {Object.entries(PONTOS_POR_COLOCACAO).map(([pos, pts]) => {
                                        const isAtivo = geralForm.colocacao === pos;
                                        return (
                                            <div
                                                key={pos}
                                                style={{
                                                    padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700,
                                                    backgroundColor: isAtivo ? COLORS.purple : '#161B28',
                                                    color: isAtivo ? '#FFF' : COLORS.textSec,
                                                    border: `1px solid ${isAtivo ? COLORS.purple : COLORS.border}`,
                                                    boxShadow: isAtivo ? `0 0 10px ${COLORS.purple}50` : 'none',
                                                    transition: 'all 0.2s',
                                                }}
                                            >
                                                {pos}º = {pts}pt
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Pontos Total calculado */}
                            <div style={{ marginTop: '16px', padding: '14px 18px', backgroundColor: `${COLORS.purple}12`, border: `1px solid ${COLORS.purple}30`, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div>
                                    <span style={{ fontSize: '13px', color: COLORS.textSec, fontWeight: 600 }}>PONTOS TOTAL (calculado automaticamente)</span>
                                    <p style={{ fontSize: '11px', color: COLORS.textTer, marginTop: '2px' }}>
                                        Kills ({parseInt(geralForm.kill) || 0} pts) + Posição ({parseInt(geralForm.pontos_posicao) || 0} pts)
                                    </p>
                                </div>
                                <span style={{ fontSize: '28px', fontWeight: 900, color: COLORS.purple }}>{pontos_total_calculado}</span>
                            </div>

                            {/* Toggles */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
                                <ToggleField label="Booyah?" id="g-booyah" checked={geralForm.booyah} onChange={v => gSet('booyah', v)} />
                                <ToggleField label="Quebra de Call?" id="g-quebra" checked={geralForm.quebra_de_call} onChange={v => gSet('quebra_de_call', v)} />
                            </div>

                            {geralForm.quebra_de_call && (
                                <div style={{ marginTop: '16px' }}>
                                    <SelectField label="Resultado Quebra" id="g-res" value={geralForm.resultado_quebra} onChange={v => gSet('resultado_quebra', v)} options={RESULTADOS_QUEBRA} />
                                </div>
                            )}
                        </div>

                        {/* Botão Salvar */}
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: '100%', padding: '16px', borderRadius: '12px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                                backgroundColor: loading ? COLORS.border : COLORS.purple,
                                color: '#FFF', fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '16px',
                                transition: 'all 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                boxShadow: loading ? 'none' : `0 4px 20px ${COLORS.purple}50`,
                            }}
                        >
                            {loading ? (
                                <><span style={{ animation: 'spin 1s linear infinite' }}>⏳</span> Salvando...</>
                            ) : (
                                <><Save size={20} /> Salvar Registro — Geral</>
                            )}
                        </button>

                        {creditos !== null && creditos <= 10 && (
                            <p style={{ textAlign: 'center', marginTop: '10px', fontSize: '12px', color: creditos === 0 ? COLORS.red : COLORS.gold, fontWeight: 600 }}>
                                {creditos === 0 ? '⛔ Sem créditos disponíveis!' : `⚠️ Atenção: apenas ${creditos} usos restantes.`}
                            </p>
                        )}
                    </form>
                )}

                {/* ── Formulário Performance ──────────────────────────── */}
                {activeTab === 'performance' && (
                    <form onSubmit={salvarPerformance}>
                        <div style={{
                            backgroundColor: COLORS.bgCard, border: `1px solid ${COLORS.border}`,
                            borderRadius: '16px', padding: '28px', marginBottom: '20px',
                        }}>
                            <h2 style={{ fontSize: '16px', fontWeight: 800, color: COLORS.textPri, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: COLORS.green, display: 'inline-block' }} />
                                Performance do Jogador
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <InputField label="Data" id="p-data" type="date" value={perfForm.data} onChange={v => pSet('data', v)} required />
                                <InputField label="Equipe" id="p-eq" value={perfForm.equipe} onChange={v => pSet('equipe', v)} placeholder="Nome da equipe" required />
                                <SelectField label="Modo" id="p-modo" value={perfForm.modo} onChange={v => pSet('modo', v)} options={MODOS} required />
                                <SelectField label="Mapa" id="p-mapa" value={perfForm.mapa} onChange={v => pSet('mapa', v)} options={MAPAS} required />
                                <InputField label="Posição" id="p-pos" type="number" value={perfForm.posicao} onChange={v => pSet('posicao', v)} min={1} placeholder="1, 2..." />
                                <InputField label="Player" id="p-player" value={perfForm.player} onChange={v => pSet('player', v)} placeholder="Nome do jogador" required />
                            </div>

                            <div style={{ marginTop: '20px' }}>
                                <h3 style={{ fontSize: '13px', fontWeight: 700, color: COLORS.textSec, marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Estatísticas
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <InputField label="Kills" id="p-kill" type="number" value={perfForm.kill} onChange={v => pSet('kill', v)} min={0} />
                                    <InputField label="Mortes" id="p-morte" type="number" value={perfForm.morte} onChange={v => pSet('morte', v)} min={0} />
                                    <InputField label="Assistência" id="p-assists" type="number" value={perfForm.assistencia} onChange={v => pSet('assistencia', v)} min={0} />
                                    <InputField label="Queda" id="p-queda" type="number" value={perfForm.queda} onChange={v => pSet('queda', v)} min={0} />
                                    <InputField label="Dano Causado" id="p-dano" type="number" value={perfForm.dano_causado} onChange={v => pSet('dano_causado', v)} min={0} />
                                    <InputField label="Derrubados" id="p-derr" type="number" value={perfForm.derrubados} onChange={v => pSet('derrubados', v)} min={0} />
                                    <InputField label="Ressurgimento" id="p-res" type="number" value={perfForm.ressurgimento} onChange={v => pSet('ressurgimento', v)} min={0} />
                                </div>
                            </div>
                        </div>

                        {/* Botão Salvar */}
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: '100%', padding: '16px', borderRadius: '12px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                                backgroundColor: loading ? COLORS.border : COLORS.green,
                                color: '#0A0E17', fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '16px',
                                transition: 'all 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                boxShadow: loading ? 'none' : `0 4px 20px ${COLORS.green}50`,
                            }}
                        >
                            {loading ? (
                                <>⏳ Salvando...</>
                            ) : (
                                <><Save size={20} /> Salvar Registro — Performance</>
                            )}
                        </button>

                        {creditos !== null && creditos <= 10 && (
                            <p style={{ textAlign: 'center', marginTop: '10px', fontSize: '12px', color: creditos === 0 ? COLORS.red : COLORS.gold, fontWeight: 600 }}>
                                {creditos === 0 ? '⛔ Sem créditos disponíveis!' : `⚠️ Atenção: apenas ${creditos} usos restantes.`}
                            </p>
                        )}
                    </form>
                )}
            </main>
        </div>
    );
};
