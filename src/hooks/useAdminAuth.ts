import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const CACHE_KEY = 'celo_master_admin';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

function getCachedAdmin(): boolean {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return false;
    const { value, expires } = JSON.parse(raw);
    if (Date.now() > expires) {
      sessionStorage.removeItem(CACHE_KEY);
      return false;
    }
    return value === true;
  } catch {
    return false;
  }
}

function setCachedAdmin() {
  sessionStorage.setItem(
    CACHE_KEY,
    JSON.stringify({ value: true, expires: Date.now() + CACHE_TTL })
  );
}

export function useAdminAuth() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Evita re-query em navegações internas dentro do /celo-master
    if (getCachedAdmin()) {
      setIsAdmin(true);
      setLoading(false);
      return;
    }

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

        setCachedAdmin();
        setIsAdmin(true);
      } catch (err) {
        console.error('Erro ao verificar permissão de admin:', err);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, []); // navigate excluído da dep array — recriado a cada mudança de rota causando loop

  return { isAdmin, loading };
}
