import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft, CheckCircle, AlertCircle, XCircle,
    Wallet, Play, Target, Activity, Shield, Hash, Map, Trophy, HelpCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const MAPAS = ['Bermuda', 'Purgatório', 'Alpine', 'Bermuda Remastered', 'Outro'];
const MODOS = ['Campeonato', 'Ranqueado', 'Casual', 'Treino'];
const RESULTADOS_QUEBRA = ['GANHOU', 'PERDEU', '-'];

// ─── Input Técnico ──────────────────────────────────────────────────────────
const InputField: React.FC<any> = ({ label, id, type = 'text', value, onChange, required, min, placeholder, icon: Icon }) => {
    const [focused, setFocused] = useState(false);
    return (
        <div className="flex flex-col gap-1.5 animate-reveal">
            <label htmlFor={id} className="text-[9px] uppercase tracking-[0.2em] font-black text-zinc-500 flex items-center gap-1.5">
                {Icon && <Icon size={10} className={focused ? 'text-[#06B6D4]' : 'text-zinc-600'} />}
                {label} {required && <span className="text-rose-500">*</span>}
            </label>
            <div className="relative">
                <input
                    id={id}
                    type={type}
                    value={value}
                    min={min}
                    placeholder={placeholder}
                    onChange={e => onChange(e.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    className={`w-full bg-[#1A1A1C] border ${focused ? 'border-[#06B6D4] ring-1 ring-[#06B6D4]/30' : 'border-[#2D2D30]'} rounded-sm py-2.5 px-4 text-xs text-white placeholder:text-zinc-700 placeholder:font-bold transition-all outline-none font-medium`}
                />
            </div>
        </div>
    );
};

// ─── Select Técnico ──────────────────────────────────────────────────────────
const SelectField: React.FC<any> = ({ label, id, value, onChange, options, required, icon: Icon }) => {
    const [focused, setFocused] = useState(false);
    return (
        <div className="flex flex-col gap-1.5 animate-reveal">
            <label htmlFor={id} className="text-[9px] uppercase tracking-[0.2em] font-black text-zinc-500 flex items-center gap-1.5">
                {Icon && <Icon size={10} className={focused ? 'text-[#06B6D4]' : 'text-zinc-600'} />}
                {label} {required && <span className="text-rose-500">*</span>}
            </label>
            <select
                id={id}
                value={value}
                onChange={e => onChange(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                className={`w-full bg-[#1A1A1C] border ${focused ? 'border-[#06B6D4]' : 'border-[#2D2D30]'} rounded-sm py-2.5 px-4 text-xs ${value ? 'text-white' : 'text-zinc-600'} transition-all outline-none cursor-pointer font-bold appearance-none`}
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2371717A' stroke-width='3'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5' /%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '0.75rem' }}
            >
                <option value="">SELECIONAR</option>
                {options.map((o: any) => <option key={o} value={o}>{o.toUpperCase()}</option>)}
            </select>
        </div>
    );
};

// ─── Switch Estilizado ───────────────────────────────────────────────────────
const ToggleField: React.FC<any> = ({ label, checked, onChange }) => (
    <button
        type="button"
        onClick={() => onChange(!checked)}
        className="flex items-center justify-between w-full p-4 bg-[#1A1A1C] border border-[#2D2D30] rounded-sm group hover:border-zinc-500 transition-all animate-reveal"
    >
        <span className="text-[10px] uppercase tracking-[0.15em] font-black text-zinc-400">{label}</span>
        <div className={`w-10 h-5 rounded-full relative transition-all ${checked ? 'bg-[#10B981]' : 'bg-[#2D2D30]'}`}>
            <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${checked ? 'left-6' : 'left-1'}`} />
        </div>
    </button>
);

const Toast: React.FC<any> = ({ message, type }) => {
    const config = {
        success: { bg: '#10B98110', border: '#10B98130', color: '#10B981', Icon: CheckCircle },
        error: { bg: '#F43F5E10', border: '#F43F5E30', color: '#F43F5E', Icon: XCircle },
        warning: { bg: '#F59E0B10', border: '#F59E0B30', color: '#F59E0B', Icon: AlertCircle },
    }[type as 'success' | 'error' | 'warning'];
    return (
        <div className="fixed top-6 right-6 z-[9999] flex items-center gap-3 px-5 py-3.5 bg-[#161618] border rounded-sm animate-reveal shadow-2xl" style={{ borderColor: config.border }}>
            <config.Icon size={18} color={config.color} />
            <span className="text-white text-xs font-black uppercase tracking-widest">{message}</span>
        </div>
    );
};

const PONTOS_POR_COLOCACAO: Record<number, number> = { 1: 12, 2: 9, 3: 8, 4: 7, 5: 6, 6: 5, 7: 4, 8: 3, 9: 2, 10: 1, 11: 0, 12: 0 };
const getPontosColocacao = (colocacao: string): number => {
    const pos = parseInt(colocacao);
    return PONTOS_POR_COLOCACAO[pos] ?? 0;
};

export const InputData: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'geral' | 'performance'>('geral');
    const [geralForm, setGeralForm] = useState<any>({ data: '', campeonato: '', rodada: '', mapa: '', equipe: '', colocacao: '', kill: '0', pontos_posicao: '0', booyah: false, quebra_de_call: false, resultado_quebra: '-' });
    const [perfForm, setPerfForm] = useState<any>({ data: '', equipe: '', modo: '', mapa: '', posicao: '', player: '', kill: '0', morte: '0', assistencia: '0', queda: '0', dano_causado: '0', derrubados: '0', ressurgimento: '0' });
    const [creditos, setCreditos] = useState<number | null>(null);
    const [nomeUsuario, setNomeUsuario] = useState<string>('');
    const [loading, setSaving] = useState(false);
    const [toast, setToast] = useState<any>(null);

    useEffect(() => {
        if (!user) return;
        const fetchPerfil = async () => {
            const { data } = await supabase.from('perfis').select('usos_restantes, nome, email').eq('id', user.id).single();
            if (data) { setCreditos(data.usos_restantes); setNomeUsuario(data.nome || data.email || user.email || ''); }
        };
        fetchPerfil();
    }, [user]);

    const showToast = (message: string, type: string) => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    useEffect(() => {
        if (!geralForm.colocacao) return;
        const pts = getPontosColocacao(geralForm.colocacao);
        setGeralForm((prev: any) => ({ ...prev, pontos_posicao: String(pts) }));
    }, [geralForm.colocacao]);

    const salvarGeral = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || loading) return;
        setSaving(true);
        try {
            const pontos_total = (parseInt(geralForm.kill) || 0) + (parseInt(geralForm.pontos_posicao) || 0);
            const { error } = await supabase.from('partidas_geral').insert({
                user_id: user.id, ...geralForm,
                rodada: parseInt(geralForm.rodada), colocacao: parseInt(geralForm.colocacao),
                kill: parseInt(geralForm.kill), pontos_posicao: parseInt(geralForm.pontos_posicao),
                pontos_total, resultado_quebra: geralForm.quebra_de_call ? geralForm.resultado_quebra : '-'
            });
            if (error) throw error;
            showToast('Sincronização Concluída', 'success');
            setGeralForm({ ...geralForm, kill: '0', colocacao: '', booyah: false });
        } catch (err: any) { showToast(err.message, 'error'); } finally { setSaving(false); }
    };

    const salvarPerformance = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || loading) return;
        setSaving(true);
        try {
            const { error } = await supabase.from('performance_jogadores').insert({
                user_id: user.id, ...perfForm,
                posicao: parseInt(perfForm.posicao), kill: parseInt(perfForm.kill),
                morte: parseInt(perfForm.morte), assistencia: parseInt(perfForm.assistencia),
                queda: parseInt(perfForm.queda), dano_causado: parseInt(perfForm.dano_causado),
                derrubados: parseInt(perfForm.derrubados), ressurgimento: parseInt(perfForm.ressurgimento)
            });
            if (error) throw error;
            showToast('Métricas Injetadas', 'success');
            setPerfForm({ ...perfForm, player: '', kill: '0', morte: '0', dano_causado: '0' });
        } catch (err: any) { showToast(err.message, 'error'); } finally { setSaving(false); }
    };

    const gSet = (k: string, v: any) => setGeralForm((p: any) => ({ ...p, [k]: v }));
    const pSet = (k: string, v: any) => setPerfForm((p: any) => ({ ...p, [k]: v }));

    return (
        <div className="min-h-screen bg-[#0B0B0C] text-white font-['Inter',sans-serif]">
            {toast && <Toast message={toast.message} type={toast.type} />}

            {/* Tactical Header */}
            <header className="sticky top-0 z-50 bg-[#0B0B0CEE] backdrop-blur-xl border-b border-[#2D2D30]">
                <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button onClick={() => navigate('/')} className="p-2 border border-[#2D2D30] rounded-sm hover:bg-[#1A1A1C] transition-colors">
                            <ChevronLeft size={18} className="text-zinc-400" />
                        </button>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#06B6D4]">Control Center</span>
                            <span className="text-xs font-bold text-zinc-500 uppercase">Input Terminal</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex flex-col items-end">
                            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600">Operator</span>
                            <span className="text-xs font-bold">{nomeUsuario}</span>
                        </div>
                        <div className="h-10 border-l border-[#2D2D30]" />
                        <div className="flex items-center gap-3 px-4 py-2 bg-[#1A1A1C] border border-[#2D2D30] rounded-sm">
                            <Wallet size={14} className="text-amber-500" />
                            <span className="text-xs font-black">{creditos ?? '--'} CR</span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-12">
                <div className="flex flex-col md:flex-row gap-12">

                    {/* Navigation Sidebar-style */}
                    <div className="w-full md:w-64 space-y-6">
                        <div className="space-y-1">
                            <h1 className="text-3xl font-black tracking-tight leading-none mb-4">ENTRADA<br />DE DADOS</h1>
                            <p className="text-xs font-medium text-zinc-500 leading-relaxed uppercase tracking-tighter">Selecione o protocolo para persistência de métricas.</p>
                        </div>

                        <div className="flex flex-col gap-2 pt-8">
                            {[
                                { id: 'geral', label: 'Monitor Geral', icon: Activity },
                                { id: 'performance', label: 'Métricas de Elite', icon: Target }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex items-center gap-4 px-5 py-4 rounded-sm border transition-all text-left ${activeTab === tab.id ? 'bg-white text-black border-white' : 'bg-transparent border-[#2D2D30] text-zinc-500 hover:border-zinc-500'}`}
                                >
                                    <tab.icon size={18} />
                                    <span className="text-[11px] font-black uppercase tracking-widest">{tab.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Form Container */}
                    <div className="flex-1">
                        {activeTab === 'geral' ? (
                            <form onSubmit={salvarGeral} className="space-y-8 animate-reveal">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8 p-10 bg-[#161618] border border-[#2D2D30] relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                                        <Shield size={120} />
                                    </div>

                                    <InputField label="Data" id="g-data" type="date" value={geralForm.data} onChange={(v: any) => gSet('data', v)} required icon={Play} />
                                    <InputField label="Campeonato" id="g-camp" value={geralForm.campeonato} onChange={(v: any) => gSet('campeonato', v)} placeholder="LBFF / ESL" required icon={Trophy} />
                                    <InputField label="Rodada" id="g-rod" type="number" value={geralForm.rodada} onChange={(v: any) => gSet('rodada', v)} required icon={Hash} />
                                    <SelectField label="Mapa" id="g-mapa" value={geralForm.mapa} onChange={(v: any) => gSet('mapa', v)} options={MAPAS} required icon={Map} />
                                    <InputField label="Equipe" id="g-eq" value={geralForm.equipe} onChange={(v: any) => gSet('equipe', v)} required icon={Shield} />
                                    <InputField label="Colocação" id="g-col" type="number" value={geralForm.colocacao} onChange={(v: any) => gSet('colocacao', v)} required icon={Trophy} />
                                    <InputField label="Kills" id="g-kill" type="number" value={geralForm.kill} onChange={(v: any) => gSet('kill', v)} icon={Target} />

                                    <div className="md:col-span-2 pt-6 flex flex-col gap-6">
                                        <div className="flex gap-4">
                                            <div className="flex-1"><ToggleField label="Booyah?" checked={geralForm.booyah} onChange={(v: any) => gSet('booyah', v)} /></div>
                                            <div className="flex-1"><ToggleField label="Quebra de Call?" checked={geralForm.quebra_de_call} onChange={(v: any) => gSet('quebra_de_call', v)} /></div>
                                        </div>
                                        {geralForm.quebra_de_call && (
                                            <SelectField label="Resultado Quebra" options={RESULTADOS_QUEBRA} value={geralForm.resultado_quebra} onChange={(v: any) => gSet('resultado_quebra', v)} icon={HelpCircle} />
                                        )}
                                    </div>
                                </div>

                                <button type="submit" disabled={loading} className="w-full bg-[#06B6D4] text-black py-5 font-black text-sm uppercase tracking-[0.4em] hover:bg-white transition-all disabled:opacity-30">
                                    {loading ? 'SINCRONIZANDO...' : 'EXECUTAR PERSISTÊNCIA'}
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={salvarPerformance} className="space-y-8 animate-reveal">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8 p-10 bg-[#161618] border border-[#2D2D30]">
                                    <InputField label="Data" type="date" value={perfForm.data} onChange={(v: any) => pSet('data', v)} required icon={Play} />
                                    <InputField label="Player Name" value={perfForm.player} onChange={(v: any) => pSet('player', v)} required icon={Target} />
                                    <SelectField label="Modo" value={perfForm.modo} onChange={(v: any) => pSet('modo', v)} options={MODOS} required icon={Activity} />
                                    <SelectField label="Mapa" value={perfForm.mapa} onChange={(v: any) => pSet('mapa', v)} options={MAPAS} required icon={Map} />

                                    <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-8 border-t border-[#2D2D30]">
                                        {[
                                            { l: 'Kills', k: 'kill' }, { l: 'Mortes', k: 'morte' },
                                            { l: 'Assis.', k: 'assistencia' }, { l: 'Dano', k: 'dano_causado' }
                                        ].map(s => (
                                            <InputField key={s.k} label={s.l} type="number" value={perfForm[s.k]} onChange={(v: any) => pSet(s.k, v)} />
                                        ))}
                                    </div>
                                </div>
                                <button type="submit" disabled={loading} className="w-full bg-[#10B981] text-black py-5 font-black text-sm uppercase tracking-[0.4em] hover:bg-white transition-all disabled:opacity-30">
                                    {loading ? 'INJETANDO...' : 'SALVAR MÉTRICAS'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};
