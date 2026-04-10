import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function parseFreeFire(fullText: string): any {
  const lines = fullText.split("\n").map((l: string) => l.trim()).filter(Boolean);
  console.log("[OCR] Linhas extraídas:", lines.length);
  console.log("[OCR] Preview:", lines.slice(0, 15).join(" | "));

  // Colocação: #5/12 → 5
  let posicao_squad = 0;
  for (const line of lines) {
    const match = line.match(/#(\d+)\s*\/\s*\d+/);
    if (match) { posicao_squad = parseInt(match[1]); break; }
  }

  // Mapa: linha após "BATTLE ROYALE"
  let mapa = "";
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].toUpperCase().includes("BATTLE ROYALE") && lines[i + 1]) {
      mapa = lines[i + 1].trim();
      break;
    }
  }

  // Jogadores via padrão K/D/A ex: "4/1/2"
  const jogadores: any[] = [];
  const kdaPattern = /^(\d+)\/(\d+)\/(\d+)$/;

  for (let i = 0; i < lines.length; i++) {
    const kdaMatch = lines[i].match(kdaPattern);
    if (!kdaMatch) continue;

    const kills   = parseInt(kdaMatch[1]);
    // kdaMatch[2] = mortes — ignorar
    const assists = parseInt(kdaMatch[3]);

    // Nome: linha anterior ao KDA
    let nome = lines[i - 1] ?? "Jogador";
    nome = nome.trim();

    // Números após KDA: dano, derrubados, reviv
    const numeros: number[] = [];
    for (let j = i + 1; j < Math.min(i + 15, lines.length); j++) {
      const num = parseInt(lines[j]);
      if (!isNaN(num) && num >= 0) numeros.push(num);
      if (numeros.length >= 6) break;
    }

    // dano = primeiro número >= 500
    const dano = numeros.find(n => n >= 500) ?? 0;
    // derrubados = primeiro número entre 0-20 após dano
    const derrubados = numeros.find(n => n <= 20 && n !== dano) ?? 0;
    // reviv = número pequeno (0-5) após derrubados
    const reviv = numeros.filter(n => n <= 5).slice(-1)[0] ?? 0;

    jogadores.push({ nome, kills, assists, derrubados, dano, reviv });

    if (jogadores.length >= 4) break;
  }

  const kills_squad = jogadores.reduce((sum, j) => sum + j.kills, 0);

  return { mapa, posicao_squad, kills_squad, jogadores };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const imageData = body.image ?? body.base64Image;

    if (!imageData) {
      return new Response(
        JSON.stringify({ error: "Image is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Rate limit
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_ANON_KEY") ?? "",
        { global: { headers: { Authorization: authHeader } } }
      );
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        console.log("[OCR] User:", user.id);
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        const { count } = await supabase
          .from("ocr_usage")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .gte("created_at", oneHourAgo);
        if ((count ?? 0) >= 20) {
          return new Response(
            JSON.stringify({ error: "Rate limit exceeded. Máximo 20 leituras por hora." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        await supabase.from("ocr_usage").insert({ user_id: user.id });
      }
    }

    // Google Cloud Vision API
    const VISION_KEY = Deno.env.get("GOOGLE_VISION_API_KEY");
    const visionUrl = `https://vision.googleapis.com/v1/images:annotate?key=${VISION_KEY}`;

    const visionResponse = await fetch(visionUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: [{
          image: { content: imageData },
          features: [{ type: "TEXT_DETECTION", maxResults: 1 }]
        }]
      })
    });

    if (!visionResponse.ok) {
      const errText = await visionResponse.text();
      console.error("[OCR] Erro Vision API:", errText);
      throw new Error(`Vision API error: ${visionResponse.status}`);
    }

    const visionData = await visionResponse.json();
    const textAnnotations = visionData.responses?.[0]?.textAnnotations;

    if (!textAnnotations || textAnnotations.length === 0) {
      return new Response(
        JSON.stringify({ jogadores: [], erro: "Nenhum texto detectado na imagem" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const fullText = textAnnotations[0]?.description ?? "";
    console.log("[OCR] Texto bruto Vision:", fullText.substring(0, 300));

    const result = parseFreeFire(fullText);
    console.log("[OCR] Resultado:", JSON.stringify(result));

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("[OCR] Erro interno:", error.message);
    return new Response(
      JSON.stringify({ error: "OCR processing failed", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
