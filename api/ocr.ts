import type { VercelRequest, VercelResponse } from '@vercel/node';

// Configuração vital: Aumentamos o limite de tempo para 60 segundos
// disponível para Serverless Functions em projetos Pro/Hobby na Vercel.
export const maxDuration = 60; 

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Filtro de método: Apenas POST é permitido
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { base64Image, mediaType, prompt } = req.body;
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.error('[OCR-API] ANTHROPIC_API_KEY não configurada no ambiente Vercel');
    return res.status(500).json({ error: 'Erro de configuração: Variável ANTHROPIC_API_KEY não encontrada.' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
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
              text: prompt || 'Extraia os dados da partida do Free Fire em JSON conforme as regras padrão.'
            }
          ]
        }]
      })
    });

    if (!response.ok) {
      const errorMsg = await response.text();
      console.error(`[OCR-API] Anthropic Error: ${response.status} - ${errorMsg}`);
      return res.status(response.status).json({ error: `Erro na API Anthropic: ${response.status}` });
    }

    const data = await response.json();
    const result = data.content?.[0]?.text || '{}';

    return res.status(200).json({ result });
  } catch (error: any) {
    console.error('[OCR-API] Erro Crítico:', error.message);
    return res.status(500).json({ error: error.message });
  }
}
