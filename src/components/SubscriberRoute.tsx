import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const SubscriberRoute = ({ children }: { children: React.ReactNode }) => {
    const { user, loading: authLoading, isSubscriber, subscriberLoading } = useAuth();
    const location = useLocation();

    // Se o carregamento terminou E o usuário não é assinante (ou não está logado), redireciona
    if (!authLoading && !subscriberLoading) {
        if (!user || !isSubscriber) {
            return (
                <Navigate
                    to="/planos"
                    state={{
                        from: location.pathname,
                        message: "Esta funcionalidade é exclusiva para assinantes. Assine um plano para ter acesso completo."
                    }}
                    replace
                />
            );
        }
    }

    // Em todos os outros casos (está carregando ou é assinante), mostra o conteúdo.
    // Isso elimina o "cadeado flash" porque a página não é bloqueada durante o loading.
    return <>{children}</>;
};
