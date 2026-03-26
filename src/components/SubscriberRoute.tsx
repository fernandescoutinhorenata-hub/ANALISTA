import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Loader2 } from 'lucide-react';

export const SubscriberRoute = ({ children }: { children: React.ReactNode }) => {
    const { user, loading: authLoading } = useAuth();
    const [isSubscriber, setIsSubscriber] = useState<boolean | null>(null);
    const location = useLocation();

    useEffect(() => {
        if (!user) {
            if (!authLoading) setIsSubscriber(false);
            return;
        }

        const checkSubscription = async () => {
            try {
                const { data, error } = await supabase
                    .from('subscriptions')
                    .select('*')
                    .eq('user_id', user.id)
                    .eq('status', 'ativo')
                    .gt('data_fim', new Date().toISOString())
                    .maybeSingle();

                if (error) throw error;
                setIsSubscriber(!!data);
            } catch (err) {
                console.error('Erro ao validar assinatura:', err);
                setIsSubscriber(false);
            }
        };

        checkSubscription();
    }, [user, authLoading]);

    if (authLoading || isSubscriber === null) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#0A0E17]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-[#8A2BE2]" />
                    <p className="font-black tracking-widest text-[#8A2BE2] animate-pulse uppercase text-xs">Validando Assinatura PRO...</p>
                </div>
            </div>
        );
    }

    if (!isSubscriber) {
        // Redireciona para planos com estado de mensagem
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
