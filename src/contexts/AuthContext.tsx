import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Session, User } from '@supabase/supabase-js';

const CACHE_KEY = 'isSubscriber';

interface AuthContextType {
    session: Session | null;
    user: User | null;
    loading: boolean;
    isSubscriber: boolean;
    subscriberLoading: boolean;
    signOut: () => Promise<void>;
    refreshSubscription: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Lê o cache do sessionStorage de forma segura
const getCachedSubscriber = (): boolean | null => {
    try {
        const cached = sessionStorage.getItem(CACHE_KEY);
        return cached !== null ? JSON.parse(cached) : null;
    } catch {
        return null;
    }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // Inicializa isSubscriber com o cache — sem flash na troca de rota
    const cached = getCachedSubscriber();
    const [isSubscriber, setIsSubscriber] = useState<boolean>(cached ?? false);
    const [subscriberLoading, setSubscriberLoading] = useState<boolean>(cached === null);

    const checkSubscription = async (userId: string) => {
        // Se já temos cache, não mostra loading (verificação em background)
        const hasCached = getCachedSubscriber() !== null;
        if (!hasCached) setSubscriberLoading(true);

        try {
            const { data, error } = await supabase
                .from('subscriptions')
                .select('*')
                .eq('user_id', userId)
                .eq('status', 'ativo')
                .gt('data_fim', new Date().toISOString())
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (error) throw error;

            const result = !!data;
            setIsSubscriber(result);
            // Salva resultado no cache da sessão
            sessionStorage.setItem(CACHE_KEY, JSON.stringify(result));
        } catch (err) {
            console.error('Erro ao validar assinatura:', err);
            // Em caso de erro, mantém o cache anterior se existir
            if (getCachedSubscriber() === null) {
                setIsSubscriber(false);
                sessionStorage.setItem(CACHE_KEY, JSON.stringify(false));
            }
        } finally {
            setSubscriberLoading(false);
        }
    };

    const refreshSubscription = async () => {
        if (user) {
            // Força re-verificação limpando o cache primeiro
            sessionStorage.removeItem(CACHE_KEY);
            setSubscriberLoading(true);
            await checkSubscription(user.id);
        }
    };

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            setLoading(false);

            if (currentUser) {
                checkSubscription(currentUser.id);
            } else {
                // Sem usuário: limpar cache e estado
                sessionStorage.removeItem(CACHE_KEY);
                setIsSubscriber(false);
                setSubscriberLoading(false);
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            setSession(session);
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            setLoading(false);

            if (event === 'SIGNED_OUT') {
                // Logout: limpar cache e estado
                sessionStorage.removeItem(CACHE_KEY);
                setIsSubscriber(false);
                setSubscriberLoading(false);
            } else if (event === 'SIGNED_IN' && currentUser) {
                // Novo login: verificar assinatura (cache ainda vazio)
                checkSubscription(currentUser.id);
            } else if (event === 'TOKEN_REFRESHED') {
                // Refresh silencioso: manter estado atual, apenas garantir que loading=false
                setSubscriberLoading(false);
            }
            // Outros eventos (INITIAL_SESSION, USER_UPDATED) não alteram o estado
        });

        return () => subscription.unsubscribe();
    }, []);

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    const value = {
        session,
        user,
        loading,
        isSubscriber,
        subscriberLoading,
        signOut,
        refreshSubscription
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
