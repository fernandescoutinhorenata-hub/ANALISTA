import React, { useState, useEffect } from 'react'
import { useSubscription } from '../hooks/useSubscription'
import { useAuth } from '../contexts/AuthContext'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

interface PlanoGuardProps {
  children: React.ReactNode
}

export function PlanoGuard({ children }: PlanoGuardProps) {
  const { user } = useAuth()
  const { subscription, loading: loadingSub } = useSubscription(user?.id)
  const [usedCredits, setUsedCredits] = useState<number | null>(null)
  const [loadingCredits, setLoadingCredits] = useState(true)

  useEffect(() => {
    if (!user) return

    async function fetchCredits() {
      try {
        const { count } = await supabase
          .from('ocr_usage')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        
        setUsedCredits(count ?? 0)
      } catch (err) {
        console.error('Erro ao buscar créditos no PlanoGuard:', err)
        setUsedCredits(0)
      } finally {
        setLoadingCredits(false)
      }
    }

    fetchCredits()
  }, [user])

  // Enquanto estiver carregando assinatura OU créditos, mostra loading
  if (loadingSub || loadingCredits) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0F0F0F]">
        <div className="animate-spin h-8 w-8 border-4 border-[#5B5FFF]/30 border-t-[#5B5FFF] rounded-full" />
      </div>
    )
  }

  const hasActivePlan = subscription?.ativo === true
  const hasCredits = (usedCredits ?? 0) < 4

  // Liberar acesso se TEM plano OU TEM créditos
  if (hasActivePlan || hasCredits) {
    return <>{children}</>
  }

  // Se não tem nenhum dos dois, bloqueia
  // Se nunca teve plano, redireciona como novo
  if (!subscription) {
    return <Navigate to="/upgrade?novo=true&esgotado=true" replace />
  }

  // Se já teve plano mas expirou
  return <Navigate to="/upgrade?expirado=true&esgotado=true" replace />
}
