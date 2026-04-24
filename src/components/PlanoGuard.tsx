import React from 'react'

interface PlanoGuardProps {
  children: React.ReactNode
}

export function PlanoGuard({ children }: PlanoGuardProps) {
  // Acesso ao dashboard agora é liberado para todos os usuários
  return <>{children}</>
}
