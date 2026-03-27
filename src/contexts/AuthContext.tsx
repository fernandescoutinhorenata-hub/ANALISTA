import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Session, User } from '@supabase/supabase-js';

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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSubscriber, setIsSubscriber] = useState<boolean>(false);
    const [subscriberLoading, setSubscriberLoading] = useState(true);

    const checkSubscription = async (userId: string) => {
        setSubscriberLoading(true);
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
            setIsSubscriber(!!data);
        } catch (err) {
            console.error('Erro ao validar assinatura:', err);
            setIsSubscriber(false);
        } finally {
            setSubscriberLoading(false);
        }
    };

    const refreshSubscription = async () => {
        if (user) await checkSubscription(user.id);
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
                setSubscriberLoading(false);
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            setSession(session);
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            setLoading(false);

            if (event === 'SIGNED_OUT') {
                // Logout: limpar tudo
                setIsSubscriber(false);
                setSubscriberLoading(false);
            } else if (event === 'SIGNED_IN' && currentUser) {
                // Novo login: verificar assinatura
                checkSubscription(currentUser.id);
            } else if (event === 'TOKEN_REFRESHED') {
                // Refresh de token: NÃO re-verificar assinatura
                // O estado já está correto do getSession() inicial
                setSubscriberLoading(false);
            }
            // Outros eventos (INITIAL_SESSION, USER_UPDATED) não alteram loading
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
