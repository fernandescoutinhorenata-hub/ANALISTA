import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export function useAdminAuth() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function checkAdminStatus() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          setIsAdmin(false);
          setLoading(false);
          navigate('/login');
          return;
        }

        // Chama a Edge Function para validação no servidor
        const { data, error } = await supabase.functions.invoke('check-admin');

        if (error || !data?.isAdmin) {
          console.error('Acesso administrativo negado:', error);
          setIsAdmin(false);
          // Redireciona para home se não for admin
          navigate('/');
        } else {
          setIsAdmin(true);
        }
      } catch (err) {
        console.error('Erro ao verificar status de admin:', err);
        setIsAdmin(false);
        navigate('/');
      } finally {
        setLoading(false);
      }
    }

    checkAdminStatus();
  }, [navigate]);

  return { isAdmin, loading };
}
