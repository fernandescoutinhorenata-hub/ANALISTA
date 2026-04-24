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
  const [ocrCredits, setOcrCredits] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    async function fetchData() {
      try {
        // 1. Buscar assinatura
        const { data: subData } = await supabase
          .from('subscriptions')
          .select('plano, status, data_fim')
          .eq('user_id', userId)
          .order('data_fim', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (subData) {
          const ativo = subData.status === 'ativo' && new Date(subData.data_fim) > new Date()
          setSubscription({ ...subData, ativo })
        } else {
          setSubscription(null)
        }

        // 2. Buscar créditos OCR (RPC ou Select Count)
        const { data: creditsData } = await supabase.rpc('get_ocr_credits_remaining', {
          p_user_id: userId
        });
        
        setOcrCredits(creditsData ?? 0)

      } catch (err) {
        console.error('Erro no useSubscription:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [userId])

  return { subscription, ocrCredits, loading }
}
