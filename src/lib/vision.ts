/**
 * Google Cloud Vision API — OCR para screenshots de partidas Free Fire
 */
export async function readScreenshot(base64Image: string): Promise<string> {
    const apiKey = import.meta.env.VITE_GOOGLE_VISION_API_KEY;

    if (!apiKey) {
        throw new Error('Chave da API do Google Vision não configurada. Defina VITE_GOOGLE_VISION_API_KEY no .env');
    }

    const response = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                requests: [{
                    image: { content: base64Image },
                    features: [{ type: 'TEXT_DETECTION', maxResults: 1 }]
                }]
            })
        }
    );

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.error?.message || `Erro HTTP ${response.status} na API do Vision`);
    }

    const data = await response.json();
    return data.responses?.[0]?.fullTextAnnotation?.text || '';
}
