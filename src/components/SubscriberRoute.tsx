import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const getCachedSubscriber = (): boolean | null => {
    try {
        const cached = sessionStorage.getItem('isSubscriber');
        return cached !== null ? JSON.parse(cached) : null;
    } catch {
        return null;
    }
};

export const SubscriberRoute = ({ children }: { children: React.ReactNode }) => {
    const { user, loading: authLoading, isSubscriber, subscriberLoading } = useAuth();
    const location = useLocation();

    // Usar cache para decisão instantânea — sem flash de loading
    const cached = getCachedSubscriber();
    const effectiveSubscriber = cached !== null ? cached : isSubscriber;
    const isStillLoading = authLoading || (cached === null && subscriberLoading);

    // Só mostra spinner se não temos cache E ainda estamos carregando
    if (isStillLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#0A0E17]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-[#8A2BE2]" />
                    <p className="font-black tracking-widest text-[#8A2BE2] animate-pulse uppercase text-xs">Validando Assinatura PRO...</p>
                </div>
            </div>
        );
    }

    // Redireciona com base no valor mais atualizado disponível
    if (!user || !effectiveSubscriber) {
        return <Navigate
            to="/planos"
            state={{
                from: location.pathname,
                message: "Esta funcionalidade é exclusiva para assinantes. Assine um plano para ter acesso completo."
            }}
            replace
        />;
    }

    return <>{children}</>;
};
