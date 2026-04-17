import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Shield, CheckCircle, AlertCircle, RefreshCcw, ArrowRight, Lock } from 'lucide-react';

export const SetupMFA: React.FC = () => {
    const [step, setStep] = useState<'intro' | 'qr' | 'verify' | 'success'>('intro');
    const [qrCode, setQrCode] = useState<string>('');
    const [factorId, setFactorId] = useState<string>('');
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const startEnroll = async () => {
        setLoading(true);
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
            setError(err.message || 'Erro ao iniciar configuração de MFA');
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (code.length !== 6) throw new Error('O código deve ter 6 dígitos');

            const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
                factorId
            });

            if (challengeError) throw challengeError;

            const { error: verifyError } = await supabase.auth.mfa.verify({
                factorId,
                challengeId: challengeData.id,
                code
            });

            if (verifyError) throw verifyError;

            setStep('success');
            setTimeout(() => navigate('/'), 2000);
        } catch (err: any) {
            setError(err.message || 'Código inválido. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center p-6">
            <div className="bg-[#141416] w-full max-w-md p-8 rounded-3xl border border-white/5 shadow-2xl animate-reveal">
                
                {/* Header */}
                <div className="flex flex-col items-center text-center mb-8">
                    <div className="p-4 rounded-2xl bg-[#7C3AED]/10 text-[#7C3AED] mb-6">
                        <Shield size={32} />
                    </div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">
                        {step === 'success' ? 'Verificado!' : 'Segurança em 2 Fatores'}
                    </h2>
                    <p className="text-zinc-400 mt-2 font-medium">
                        {step === 'intro' && 'Como administrador, você precisa ativar o MFA para acessar o sistema.'}
                        {step === 'qr' && 'Escaneie o QR Code abaixo com seu Google Authenticator ou Authy.'}
                        {step === 'verify' && 'Insira o código de 6 dígitos gerado pelo seu aplicativo.'}
                        {step === 'success' && 'Sua conta está protegida. Redirecionando...'}
                    </p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex gap-3 items-start animate-reveal text-red-500 text-sm font-medium">
                        <AlertCircle size={18} className="shrink-0 mt-0.5" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Steps */}
                {step === 'intro' && (
                    <button
                        onClick={startEnroll}
                        disabled={loading}
                        className="w-full py-4 rounded-xl bg-[#7C3AED] hover:bg-[#6D31CE] text-white font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                        {loading ? <RefreshCcw size={20} className="animate-spin" /> : <>Configurar Agora <ArrowRight size={18} /></>}
                    </button>
                )}

                {step === 'qr' && (
                    <div className="flex flex-col items-center gap-6">
                        <div className="bg-white p-3 rounded-2xl">
                            <img src={qrCode} alt="MFA QR Code" className="w-52 h-52" />
                        </div>
                        <button
                            onClick={() => setStep('verify')}
                            className="w-full py-4 rounded-xl bg-[#7C3AED] hover:bg-[#6D31CE] text-white font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                        >
                            Já escaneei <ArrowRight size={18} />
                        </button>
                    </div>
                )}

                {step === 'verify' && (
                    <form onSubmit={handleVerify} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs uppercase tracking-widest text-zinc-500 font-bold">Código de 6 dígitos</label>
                            <input
                                type="text"
                                maxLength={6}
                                value={code}
                                onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                                placeholder="000000"
                                className="w-full bg-[#0F0F0F] border border-white/10 rounded-xl px-4 py-4 text-center text-2xl tracking-[0.5em] font-bold text-white outline-none focus:border-[#7C3AED]/50 transition-all"
                                autoFocus
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading || code.length !== 6}
                            className="w-full py-4 rounded-xl bg-[#7C3AED] hover:bg-[#6D31CE] text-white font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
                        >
                            {loading ? <RefreshCcw size={20} className="animate-spin" /> : 'Verificar e Ativar'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setStep('qr')}
                            className="w-full py-2 text-zinc-500 hover:text-white text-sm transition-colors"
                        >
                            Voltar para o QR Code
                        </button>
                    </form>
                )}

                {step === 'success' && (
                    <div className="flex justify-center py-8">
                        <div className="text-green-500 animate-bounce">
                            <CheckCircle size={64} />
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-center gap-2 text-zinc-600 text-[10px] font-black uppercase tracking-[0.3em]">
                    <Lock size={12} /> Proteção Celo Tracker
                </div>

            </div>
        </div>
    );
};
