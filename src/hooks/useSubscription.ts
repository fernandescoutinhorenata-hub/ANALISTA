import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export interface Subscription {
  plano: string
  status: string
  data_fim: string
  ativo: boolean
}

export function useSubscription(userId: string | undefined) {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [trialExpiresAt, setTrialExpiresAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    async function fetchData() {
      try {
        // 1. Buscar assinatura e dados do perfil (trial) em paralelo
        const [subRes, perfilRes] = await Promise.all([
          supabase
            .from('subscriptions')
            .select('plano, status, data_fim')
            .eq('user_id', userId)
            .order('data_fim', { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase
            .from('perfis')
            .select('trial_expires_at')
            .eq('id', userId)
            .maybeSingle()
        ]);

        if (subRes.data) {
          const ativo = subRes.data.status === 'ativo' && new Date(subRes.data.data_fim) > new Date()
          setSubscription({ ...subRes.data, ativo })
        } else {
          setSubscription(null)
        }

        if (perfilRes.data) {
          setTrialExpiresAt(perfilRes.data.trial_expires_at)
        }

      } catch (err) {
        console.error('Erro no useSubscription:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [userId])

  return { subscription, trialExpiresAt, loading }
}
