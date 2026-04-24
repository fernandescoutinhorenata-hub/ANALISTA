import React from 'react'

interface PlanoGuardProps {
  children: React.ReactNode
}

export function PlanoGuard({ children }: PlanoGuardProps) {
  const { user } = useAuth()
  const { subscription, trialExpiresAt, loading } = useSubscription(user?.id)

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0F0F0F]">
        <div className="animate-spin h-8 w-8 border-4 border-[#5B5FFF]/30 border-t-[#5B5FFF] rounded-full" />
      </div>
    )
  }

  const hasActivePlan = subscription?.ativo === true
  const trialValid = trialExpiresAt 
    ? new Date(trialExpiresAt) > new Date() 
    : false

  // Liberar acesso se TEM plano OU TRIAL é válido
  if (hasActivePlan || trialValid) {
    return <>{children}</>
  }

  // Se não tem nenhum dos dois, bloqueia
  return <Navigate to="/upgrade?expirado=true" replace />
}
