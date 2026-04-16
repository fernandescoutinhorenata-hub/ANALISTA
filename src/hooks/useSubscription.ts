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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    async function fetchSubscription() {
      try {
        const { data, error } = await supabase
          .from('subscriptions')
          .select('plano, status, data_fim')
          .eq('user_id', userId)
          .order('data_fim', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error || !data) {
          setSubscription(null)
        } else {
          // Validação em duas camadas: Status precisa ser ativo E a data_fim precisa ser futura
          const ativo =
            data.status === 'ativo' &&
            new Date(data.data_fim) > new Date()

          setSubscription({ ...data, ativo })
        }
      } catch (err) {
        console.error('Erro no useSubscription:', err)
        setSubscription(null)
      } finally {
        setLoading(false)
      }
    }

    fetchSubscription()
  }, [userId])

  return { subscription, loading }
}
