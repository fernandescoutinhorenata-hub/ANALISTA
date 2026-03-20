/**
 * Anthropic Claude Vision — OCR para screenshots de partidas Free Fire
 * Substitui a integração anterior com Google Vision API.
 */
export async function readScreenshot(base64Image: string, mediaType: string): Promise<string> {
    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 1024,
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'image',
                            source: {
                                type: 'base64',
                                media_type: mediaType,
                                data: base64Image,
                            },
                        },
                        {
                            type: 'text',
                            text: `Analise esta imagem de resultado de partida do Free Fire e retorne APENAS um JSON com este formato exato:
{
  "mapa": "BERMUDA",
  "colocacao": 10,
  "jogadores": [
    {
      "nome": "COACH7",
      "kills": 4,
      "mortes": 1,
      "assists": 2,
      "dano": 818,
      "derrubados": 4,
      "ressurgimentos": 1
    }
  ]
}
O KDA aparece como K/D/A abaixo do nome do jogador. Ex: 4/1/2 = kills:4, mortes:1, assists:2.
Retorne APENAS o JSON, sem texto adicional.`
                        }
                    ]
                }
            ]
        })
    });

    const data = await response.json();
    return data.content?.[0]?.text || '{}';
}
