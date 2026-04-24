import React from 'react'
import { useSubscription } from '../hooks/useSubscription'
import { useAuth } from '../contexts/AuthContext'
import { Navigate } from 'react-router-dom'

interface PlanoGuardProps {
  children: React.ReactNode
}

export function PlanoGuard({ children }: PlanoGuardProps) {
  const { user } = useAuth()
  const { subscription, loading } = useSubscription(user?.id)

  // Enquanto carrega os dados da assinatura, não mostra nada para evitar flashes
  if (loading) return null

  // Se não tiver assinatura ativa (ou expirou hoje/no passado), redireciona
  if (subscription === null || subscription === undefined) {
    return <Navigate to="/upgrade?novo=true" replace />
  }

  if (!subscription.ativo) {
    return <Navigate to="/upgrade?expirado=true" replace />
  }

  // Se estiver tudo OK, renderiza o conteúdo protegido
  return <>{children}</>
}
