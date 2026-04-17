import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const token = authHeader.replace(/^Bearer\s+/i, '')
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    // Cliente para validar o usuário
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Cliente admin para checar role e logs
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // 3. Buscar role do usuário na tabela perfis
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('perfis')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 4. Se role = 'admin':
    if (profile.role === 'admin') {
      // Verificar se o usuário já tem MFA habilitado
      const { data: { factors }, error: mfaError } = await supabase.auth.mfa.listFactors()
      
      const hasVerifiedMFA = factors?.some(f => f.status === 'verified');

      if (!hasVerifiedMFA) {
        // Registro na tabela audit_logs: Admin tenta acessar sem MFA
        await supabaseAdmin.from('audit_logs').insert({
          user_id: user.id,
          action: 'MFA_BLOCKED',
          table_name: 'perfis',
          record_id: user.id,
          new_data: { role: 'admin', reason: 'Missing verified MFA factors' }
        })

        return new Response(JSON.stringify({ 
          error: 'mfa_required', 
          message: 'Admins devem ativar MFA para acessar o sistema' 
        }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      return new Response(JSON.stringify({ mfa_enabled: true, role: 'admin' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 5. Se role != 'admin':
    return new Response(JSON.stringify({ mfa_enabled: false, role: profile.role }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
