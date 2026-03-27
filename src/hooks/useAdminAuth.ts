import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase'; // Ajustado para o caminho correto do projeto

export function useAdminAuth() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          navigate('/login');
          return;
        }

        const { data: profile, error } = await supabase
          .from('perfis')
          .select('role')
          .eq('id', user.id)
          .single();

        if (error || profile?.role !== 'admin') {
          console.error('Acesso administrativo negado ou perfil não encontrado.');
          navigate('/');
          return;
        }

        setIsAdmin(true);
      } catch (err) {
        console.error('Erro ao verificar permissão de admin:', err);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, [navigate]);

  return { isAdmin, loading };
}
