import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Shield, Lock, CheckCircle, Smartphone, AlertCircle, RefreshCcw, ArrowRight, XCircle } from 'lucide-react';

export const SecurityTab: React.FC = () => {
    const [factors, setFactors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [enrollLoading, setEnrollLoading] = useState(false);
    const [step, setStep] = useState<'status' | 'qr' | 'verify'>('status');
    const [qrCode, setQrCode] = useState('');
    const [factorId, setFactorId] = useState('');
    const [code, setCode] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadFactors();
    }, []);

    const loadFactors = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.auth.mfa.listFactors();
            if (error) throw error;
            setFactors(data.all || []);
        } catch (err) {
            console.error('Erro ao carregar fatores MFA:', err);
        } finally {
            setLoading(false);
        }
    };

    const startEnroll = async () => {
        setEnrollLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase.auth.mfa.enroll({
                factorType: 'totp',
                issuer: 'Celo Tracker',
                friendlyName: 'Autenticador'
            });

            if (error) throw error;

            setFactorId(data.id);
            setQrCode(data.totp.qr_code);
            setStep('qr');
        } catch (err: any) {
            setError(err.message || 'Erro ao iniciar configuração');
        } finally {
            setEnrollLoading(false);
        }
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setEnrollLoading(true);
        setError(null);

        try {
            const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
            if (challengeError) throw challengeError;

            const { error: verifyError } = await supabase.auth.mfa.verify({
                factorId,
                challengeId: challengeData.id,
                code
            });

            if (verifyError) throw verifyError;

            setStep('status');
            loadFactors();
        } catch (err: any) {
            setError(err.message || 'Código inválido.');
        } finally {
            setEnrollLoading(false);
        }
    };

    const unenrollFactor = async (id: string) => {
        if (!confirm('Tem certeza que deseja desativar o MFA? Sua conta ficará menos protegida.')) return;
        
        setLoading(true);
        try {
            const { error } = await supabase.auth.mfa.unenroll({ factorId: id });
            if (error) throw error;
            loadFactors();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    const isMfaActive = factors.some(f => f.status === 'verified');

    if (loading && step === 'status') {
        return (
            <div className="flex flex-col items-center justify-center py-20 animate-reveal">
                <RefreshCcw size={32} className="text-[#7C3AED] animate-spin mb-4" />
                <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Carregando segurança...</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 animate-reveal">
            
            <header className="mb-10">
                <div className="flex items-center gap-3 mb-2">
                    <Shield className="text-[#7C3AED]" size={24} />
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight">Segurança da Conta</h2>
                </div>
                <p className="text-zinc-500 text-sm font-medium">Gerencie sua proteção e métodos de autenticação.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                
                {/* Status MFA */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-[#141416] border border-white/5 rounded-3xl p-8 shadow-xl">
                        <div className="flex items-start justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <div className={`p-4 rounded-2xl ${isMfaActive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                    <Smartphone size={24} />
                                </div>
                                <div>
                                    <h3 className="text-white font-bold text-lg">Autenticação em dois fatores (MFA)</h3>
                                    <p className="text-zinc-500 text-sm mt-1">Status: {isMfaActive ? 'Ativado ✓' : 'Desativado'}</p>
                                </div>
                            </div>
                            {isMfaActive && (
                                <span className="bg-green-500/20 text-green-500 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Ativo</span>
                            )}
                        </div>

                        {error && (
                            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm flex gap-2">
                                <AlertCircle size={16} className="shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        {step === 'status' && (
                            <div className="space-y-6">
                                <p className="text-zinc-400 text-sm leading-relaxed">
                                    O MFA adiciona uma camada extra de segurança. Ao entrar, além da senha, você precisará de um código do seu celular.
                                </p>
                                
                                {isMfaActive ? (
                                    <div className="space-y-4">
                                        {factors.map(f => (
                                            <div key={f.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                                                <div className="flex items-center gap-3">
                                                    <CheckCircle size={16} className="text-green-500" />
                                                    <span className="text-white font-medium">{f.friendly_name || 'Autenticador'}</span>
                                                </div>
                                                <button 
                                                    onClick={() => unenrollFactor(f.id)}
                                                    className="text-xs text-red-500 font-bold hover:underline"
                                                >
                                                    Remover
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <button
                                        onClick={startEnroll}
                                        disabled={enrollLoading}
                                        className="btn-primary flex items-center justify-center gap-2 py-4 px-8"
                                    >
                                        {enrollLoading ? <RefreshCcw size={18} className="animate-spin" /> : <>Ativar Autenticação Agora <ArrowRight size={18}/></>}
                                    </button>
                                )}
                            </div>
                        )}

                        {step === 'qr' && (
                            <div className="flex flex-col items-center gap-6 animate-reveal">
                                <div className="bg-white p-2 rounded-xl">
                                    <img src={qrCode} alt="TOTP QR Code" className="w-48 h-48" />
                                </div>
                                <div className="text-center">
                                    <p className="text-white text-sm font-bold mb-2">Escaneie com Google Authenticator ou Authy</p>
                                    <p className="text-zinc-500 text-xs">Depois de escanear, clique no botão abaixo para verificar.</p>
                                </div>
                                <button
                                    onClick={() => setStep('verify')}
                                    className="btn-primary w-full py-4 text-sm"
                                >
                                    Já escaneei e quero verificar
                                </button>
                                <button onClick={() => setStep('status')} className="text-zinc-500 hover:text-white text-xs">Cancelar</button>
                            </div>
                        )}

                        {step === 'verify' && (
                            <form onSubmit={handleVerify} className="space-y-6 animate-reveal">
                                <div className="space-y-2">
                                    <label className="text-xs uppercase tracking-widest text-zinc-500 font-bold">Código de 6 dígitos</label>
                                    <input
                                        type="text"
                                        maxLength={6}
                                        value={code}
                                        onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                                        className="w-full bg-[#0F0F0F] border border-white/10 rounded-xl py-4 text-center text-2xl tracking-[0.4em] font-black text-white"
                                        placeholder="000000"
                                        autoFocus
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={enrollLoading || code.length !== 6}
                                    className="btn-primary w-full py-4 flex items-center justify-center gap-2"
                                >
                                    {enrollLoading ? <RefreshCcw size={18} className="animate-spin" /> : 'Confirmar e Ativar'}
                                </button>
                                <button onClick={() => setStep('qr')} className="text-zinc-500 hover:text-white text-xs w-full text-center">Voltar ao QR Code</button>
                            </form>
                        )}
                    </div>
                </div>

                {/* Dicas de Segurança */}
                <div className="space-y-6">
                    <div className="bg-[#7C3AED]/5 border border-[#7C3AED]/10 rounded-3xl p-6">
                        <Lock className="text-[#7C3AED] mb-4" size={20} />
                        <h4 className="text-white font-bold text-sm mb-2 uppercase tracking-wide">Dicas de Segurança</h4>
                        <ul className="space-y-3">
                            <li className="text-zinc-500 text-xs leading-relaxed">• Não reuse senhas de outros serviços.</li>
                            <li className="text-zinc-500 text-xs leading-relaxed">• Use um gerenciador de senhas (1Password, Bitwarden).</li>
                            <li className="text-zinc-500 text-xs leading-relaxed">• Mantenha o MFA sempre ativo para proteção máxima.</li>
                        </ul>
                    </div>
                </div>

            </div>
        </div>
    );
};
