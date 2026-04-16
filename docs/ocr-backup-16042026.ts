// ============================================
// BACKUP Edge Function OCR — 16/04/2026
// Modelo: claude-haiku-4-5-20251001
// Status: FUNCIONANDO — 19/19 campos corretos
// Motivo do backup: antes de migrar para sonnet
// Para restaurar: copiar conteúdo para supabase/functions/ocr/index.ts
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Anthropic from "npm:@anthropic-ai/sdk";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

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
        console.log("[OCR] Chamando Anthropic — user:", user.id, "model: claude-haiku-4-5-20251001");
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

    const client = new Anthropic();

    // MODELO FIXADO — NÃO ALTERAR SEM AUTORIZAÇÃO DO CELO
    // Última validação: 10/04/2026 — 19/19 campos corretos
    // Modelo: claude-haiku-4-5-20251001
    // Trocar modelo APENAS se receber erro 404 not_found_error
    // Novo modelo aprovado: claude-sonnet-4-6 (fallback)
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [{
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: "image/jpeg", data: imageData }
          },
          {
            type: "text",
            text: `Analise esta imagem de resultado de partida do Free Fire e retorne APENAS um JSON válido, sem texto adicional, sem markdown, sem blocos de código.

ESTRUTURA DA TELA:
- Topo: colocação em destaque com "#" (ex: "#1/14", "#5/12")
- Abaixo: nome do mapa (ex: PURGATÓRIO, BERMUDA, KALAHARI)
- Tabela com 4 jogadores

CADA LINHA DA TABELA SEGUE ESTA ORDEM DE COLUNAS:
[ÍCONE AVATAR] [ÍCONES/BADGES] [NOME] | [K/D/A] | [DMG] | [DANO REAL] | [DERRUBADOS] | [CURA] | [LEVANTADOS] | [RESSURGIMENTO] | [% CABEÇA]

REGRA 1 — COLOCAÇÃO (posicao_squad):
Número APÓS o "#" no TOPO da tela. Ignorar "#" nos nomes dos jogadores.
"#1/14" → posicao_squad = 1
"#5/12" → posicao_squad = 5

REGRA 2 — NOME DO JOGADOR:
IGNORAR completamente quaisquer ícones, badges, símbolos ou emblemas visuais que apareçam ANTES ou DEPOIS do nome.
Isso inclui: ícone de MVP, ícone de capitão, ícone de clã, coroas, estrelas, medalhas.
Remover prefixo de clã (texto antes do espaço se houver tag de clã).
Remover "#" do início do nick.
EXEMPLOS:
[ícone MVP] RUSH PterBot → "PterBot"
[ícone] #H → "H"
[ícone] #D → "D"
[ícone] #J → "J"
VG Strox7 → "Strox7"
#brayan → "brayan"

REGRA 3 — K/D/A (CRÍTICO — LER COM MÁXIMA ATENÇÃO):
O K/D/A aparece como três números separados por "/" logo após o nome.
IGNORAR qualquer ícone visual que apareça na mesma linha antes do K/D/A.
Formato: KILLS/MORTES/ASSISTS
KILLS = PRIMEIRO número
MORTES = SEGUNDO número → campo "mortes"
ASSISTS = TERCEIRO número → campo "assists"

ATENÇÃO ESPECIAL: Quando houver ícone de MVP ou badge na linha,
focar APENAS nos três números no formato X/Y/Z após o nome.
NÃO confundir o número de posição do squad com K/D/A.

EXEMPLOS REAIS (memorizar este padrão):
"7/1/1" → kills=7, mortes=1, assists=1
"4/0/6" → kills=4, mortes=0, assists=6
"4/0/8" → kills=4, mortes=0, assists=8
"1/1/5" → kills=1, mortes=1, assists=5
"4/1/2" → kills=4, mortes=1, assists=2
"0/4/1" → kills=0, mortes=4, assists=1

REGRA 4 — DMG (dano):
Primeira coluna numérica grande após K/D/A. Valores típicos: 500–8000.
Ignorar as barras de porcentagem coloridas abaixo dos números.

REGRA 5 — DERRUBADOS:
Terceira coluna numérica após K/D/A. Valores: 0–15.

REGRA 6 — RESSURGIMENTO (reviv):
Coluna RESSURGIMENTO — penúltima coluna antes de "% ACERTO NA CABEÇA".
NÃO confundir com LEVANTADOS (coluna anterior).
Valores típicos: 0, 1 ou 2.

REGRA 7 — KILLS DO SQUAD (kills_squad):
Somar os kills de todos os 4 jogadores.

REGRA 8 — VALIDAÇÃO FINAL:
Antes de retornar o JSON, verificar:
- Cada jogador tem exatamente 3 valores de K/D/A distintos
- kills_squad = soma de kills dos 4 jogadores
- Nenhum valor de K/D/A foi trocado com valores de outras colunas

FORMATO DE RETORNO:
{
  "mapa": "NOME_DO_MAPA",
  "posicao_squad": NUMBER,
  "kills_squad": NUMBER,
  "jogadores": [
    { "nome": "string", "kills": NUMBER, "mortes": NUMBER, "assists": NUMBER, "derrubados": NUMBER, "dano": NUMBER, "reviv": NUMBER },
    { "nome": "string", "kills": NUMBER, "mortes": NUMBER, "assists": NUMBER, "derrubados": NUMBER, "dano": NUMBER, "reviv": NUMBER },
    { "nome": "string", "kills": NUMBER, "mortes": NUMBER, "assists": NUMBER, "derrubados": NUMBER, "dano": NUMBER, "reviv": NUMBER },
    { "nome": "string", "kills": NUMBER, "mortes": NUMBER, "assists": NUMBER, "derrubados": NUMBER, "dano": NUMBER, "reviv": NUMBER }
  ]
}

Retorne APENAS o JSON. Nenhum texto antes ou depois.`
          }
        ]
      }]
    });

    const content = response.content[0];
    if (content.type !== "text") throw new Error("Unexpected response type");

    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in response");

    const parsedData = JSON.parse(jsonMatch[0]);
    console.log("[OCR] Sucesso — jogadores:", parsedData.jogadores?.length ?? 0);

    return new Response(JSON.stringify(parsedData), {
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
