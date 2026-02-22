import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const TIMEOUT_MS = 30 * 60 * 1000; // 30 minutos

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { session, loading, signOut } = useAuth();

    useEffect(() => {
        let timeoutId: number;

        const resetTimer = () => {
            clearTimeout(timeoutId);
            timeoutId = window.setTimeout(async () => {
                try {
                    console.warn('Sessão expirada por inatividade.');
                    await signOut();
                } catch (e) {
                    // silent escape
                }
            }, TIMEOUT_MS);
        };

        // Inicializa o temporizador
        resetTimer();

        // Eventos que contam como "atividade"
        window.addEventListener('mousemove', resetTimer);
        window.addEventListener('keydown', resetTimer);
        window.addEventListener('click', resetTimer);
        window.addEventListener('scroll', resetTimer);

        return () => {
            clearTimeout(timeoutId);
            window.removeEventListener('mousemove', resetTimer);
            window.removeEventListener('keydown', resetTimer);
            window.removeEventListener('click', resetTimer);
            window.removeEventListener('scroll', resetTimer);
        };
    }, [signOut]);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center" style={{ backgroundColor: '#0A0E17', color: '#FFFFFF' }}>
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin h-8 w-8 border-4 border-[#8A2BE2]/30 border-t-[#8A2BE2] rounded-full" />
                    <p className="font-bold tracking-widest text-[#8A2BE2] animate-pulse">VALIDANDO ACESSO...</p>
                </div>
            </div>
        );
    }

    if (!session) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};
