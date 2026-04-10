# OCR Free Fire — Regras de Parsing

## Modelo fixado
claude-haiku-4-5-20251001

## Campos extraídos e mapeamento
| Campo OCR JSON        | Campo Frontend        | Campo Banco           |
|-----------------------|-----------------------|-----------------------|
| posicao_squad         | matchData.colocacao   | colocacao             |
| mapa                  | matchData.mapa        | mapa                  |
| kills_squad           | matchData.kills       | kills_squad           |
| jogadores[].nome      | player.nome           | player                |
| jogadores[].kills     | player.kills          | kill                  |
| jogadores[].mortes    | player.morte          | morte                 |
| jogadores[].assists   | player.assistencias   | assistencia           |
| jogadores[].dano      | player.dano           | dano_causado          |
| jogadores[].derrubados| player.derrubados     | derrubados            |
| jogadores[].reviv     | player.revividos      | (campo a adicionar)   |

## Formato K/D/A no Free Fire
KILLS/MORTES/ASSISTS — exemplo: "4/1/2" = kills=4, mortes=1, assists=2
O número do MEIO é sempre MORTES — nunca usar como kills ou assists.

## Few-shot examples validados em 10/04/2026
| K/D/A   | kills | mortes | assists |
|---------|-------|--------|---------|
| 4/1/2   | 4     | 1      | 2       |
| 3/2/3   | 3     | 2      | 3       |
| 2/2/4   | 2     | 2      | 4       |
| 1/3/4   | 1     | 3      | 4       |

## Histórico de modelos
| Data       | Modelo                     | Status              |
|------------|----------------------------|---------------------|
| 10/04/2026 | claude-haiku-4-5-20251001  | ✅ ATIVO            |
| 09/04/2026 | claude-3-5-sonnet-20241022 | ❌ 404              |
| 09/04/2026 | claude-3-5-haiku-20241022  | ❌ deprecated       |
| 09/04/2026 | claude-3-haiku-20240307    | ❌ deprecated       |

## Fallback aprovado
claude-sonnet-4-6 — usar APENAS se receber erro 404 not_found_error no modelo ativo.

## Deploy
- SEMPRE via MCP do Supabase (ferramenta `deploy_edge_function`)
- NUNCA via CLI (causa 403 e reseta verify_jwt inadvertidamente)
- project_ref: idegcrfymkgkjphluuda
- verify_jwt: **true** (obrigatório desde v54)
