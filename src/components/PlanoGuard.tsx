import React from 'react'
import { useSubscription } from '../hooks/useSubscription'
import { useAuth } from '../contexts/AuthContext'
import { Navigate } from 'react-router-dom'

interface PlanoGuardProps {
  children: React.ReactNode
}

export function PlanoGuard({ children }: PlanoGuardProps) {
  const { user } = useAuth()
  const { subscription, ocrCredits, loading } = useSubscription(user?.id)

  if (loading) return null

  const hasActivePlan = subscription?.ativo === true
  const hasCredits = ocrCredits > 0

  // Bloqueia apenas se não tiver plano ativo E não tiver créditos
  if (!hasActivePlan && !hasCredits) {
    // Se nunca teve plano, é novo
    if (!subscription) {
      return <Navigate to="/upgrade?novo=true&esgotado=true" replace />
    }
    // Se já teve plano mas expirou (e agora acabaram os créditos)
    return <Navigate to="/upgrade?expirado=true&esgotado=true" replace />
  }

  return <>{children}</>
}
