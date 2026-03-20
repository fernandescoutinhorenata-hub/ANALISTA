import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { base64Image, mediaType } = await req.json()

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': Deno.env.get('ANTHROPIC_API_KEY') ?? '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: base64Image }
            },
            {
              type: 'text',
              text: `Analise esta imagem de resultado de partida do Free Fire e retorne APENAS um JSON:
{
  "mapa": "BERMUDA",
  "colocacao": 10,
  "jogadores": [
    { "nome": "COACH7", "kills": 4, "mortes": 1, "assists": 2, "dano": 818, "derrubados": 4, "ressurgimentos": 1 }
  ]
}
KDA aparece como K/D/A abaixo do nome. Ex: 4/1/2 = kills:4, mortes:1, assists:2.
Retorne APENAS o JSON.`
            }
          ]
        }]
      })
    })

    const data = await response.json()
    const text = data.content?.[0]?.text || '{}'

    return new Response(JSON.stringify({ result: text }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
