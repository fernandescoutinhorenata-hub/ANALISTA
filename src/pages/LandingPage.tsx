import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const LandingPage: React.FC = () => {
    const { session, loading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading && session) {
            navigate('/', { replace: true });
        } else if (!loading && !session) {
            // Se não estiver logado, redireciona o navegador para a página estática
            // Consideramos que o servidor serve a pasta 'landing/' estaticamente
            // Usamos location.replace para não sujar o histórico com o componente ponte
            window.location.replace('/landing/index.html');
        }
    }, [session, loading, navigate]);

    // Spinner sutil enquanto decide o redirecionamento
    return (
        <div className="flex h-screen items-center justify-center bg-[#08080f]">
            <div className="animate-spin h-8 w-8 border-4 border-[#7c3aed]/30 border-t-[#7c3aed] rounded-full" />
        </div>
    );
};
