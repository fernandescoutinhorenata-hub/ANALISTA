# Regras de Parsing OCR — Free Fire Screenshot

Este documento define as regras de extração de dados para a Edge Function de OCR (**v17+**). Estas regras existem para evitar o mapeamento incorreto de estatísticas da partida.

## Hierarquia Visual da Imagem
A screenshot de resultados do Free Fire apresenta os dados do jogador em duas camadas principais na mesma linha:

1. **Camada de Identificação (Esquerda)**:
   - **Nickname**: Texto em destaque (ex: `7RS Mgking`). 
   - **K/D/A**: Texto menor localizado **LOGO ABAIXO** do nickname no formato `Abates/Mortes/Assistências` (ex: `10/1/3`).
   
2. **Camada de Estatísticas (Tabela à Direita)**:
   - Uma sequência de colunas numéricas independentes.

## Mapeamento de Campos (Prompts)

| Campo | Fonte na Imagem | Observação |
| :--- | :--- | :--- |
| **Nome** | Nickname (Remover Clã) | "RST.pepeu10" → "pepeu10" |
| **Kills** | 1º número do K/D/A | **NUNCA** usar a primeira coluna da tabela. |
| **Mortes** | 2º número do K/D/A | Representado pela letra 'D' (Deaths). |
| **Assists** | 3º número do K/D/A | Representado pela letra 'A' (Assists). |
| **Dano (DMG)** | 1ª Coluna da Tabela | Valores altos, geralmente > 1500. |
| **Dano Real** | 2ª Coluna da Tabela | Estatística secundária de dano. |
| **Derrubados** | 3ª Coluna da Tabela | **NÃO** confundir com Kills ou Cura. |
| **Cura** | 4ª Coluna da Tabela | Ignorada no JSON final (estatística irrelevante). |
| **Ressurgimento** | 6ª Coluna da Tabela | Geralmente valores 0, 1 ou 2. |

---

## Dados de Referência (Test Case)
Se o parser estiver correto, os dados abaixo devem ser extraídos exatamente assim:

### Caso 1 (PterBot)
- **Visual**: Nick `PterBot` com `10/1/3` abaixo. Colunas: `4126 | 2510 | 9 | 1200 | 0 | 3`
- **Output**:
  ```json
  {
    "nome": "PterBot",
    "kills": 10,
    "mortes": 1,
    "assists": 3,
    "dano": 4126,
    "derrubados": 9,
    "ressurgimentos": 3
  }
  ```

### Caso 2 (Japa)
- **Visual**: Nick `Japa` com `3/1/8` abaixo. Colunas: `1811 | 910 | 4 | 500 | 0 | 0`
- **Output**:
  ```json
  {
    "nome": "Japa",
    "kills": 3,
    "mortes": 1,
    "assists": 8,
    "dano": 1811,
    "derrubados": 4,
    "ressurgimentos": 0
  }
  ```

---

## Prevenção de Regressão
Ao atualizar o prompt no arquivo `supabase/functions/ocr/index.ts`, mantenha sempre a instrução de que o **K/D/A é um campo composto** e que a primeira coluna da tabela é o **Dano (DMG)**, não o número de abates.
