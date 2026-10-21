# Card Lightkeeper: como atualizar

O card é gerado pelo motor compartilhado (`workspace/_shared/engine/`, especificação em `docs/workspace-template.md`). Aqui só há JSON e `media/`; **nenhum HTML se edita à mão**. Repositório do jogo: `E:\Claude Projects\Lightkeeper`.

Abas: Painel (`painel.json`, à mão), Roteiro, Entregas e Arquivo, Decisões e Acervo (os quatro do coletor). A lista e a ordem das abas ficam em `projeto.json`. Playtest e Riscos entram quando o repositório tiver esses registros.

## A cada atualização
1. **Coletar:** na raiz do repositório Mak, `node workspace/_shared/engine/coletores/lightkeeper.mjs "E:/Claude Projects/Lightkeeper" workspace/2026-10-17_lightkeeper`. Ele lê:
   - o README (níveis e etapas da fatia);
   - os PRs do git (entregas e as trilhas dos editores no Roteiro);
   - `Concepts/`, `Docs/Marco1/capturas` e `Audio/Musica` (Acervo, com miniaturas WebP de 480 px feitas pelo Pillow do `py`);
   - a tabela de decisões de `Docs/EditorModelos_Especificacao.md` e o `AGENTS.md`.
2. **Textos:** título, resumo e "olhar" de entrega, título e nota de decisão escritos à mão ficam preservados nas próximas coletas (a regra está em `coletores/comum.mjs`).
3. **Painel:** reescreva `painel.json` (estado, `agora`, `comVoce`, versão de `VERSION` e a main do git).
4. **Gerar:** `node workspace/_shared/engine/gerar.mjs workspace/2026-10-17_lightkeeper`. Valida, refaz as abas e atualiza o card em `workspace/workspace.json`.
5. **Mídia:** `node workspace/_shared/engine/conferir-media.mjs workspace/2026-10-17_lightkeeper`; `--limpar --confirmar` move órfãos para `E:\Backups\Workspace\lightkeeper\`.

## Regras
- O coletor só lê o repositório do jogo; nunca grava nele.
- Card em português. Sem links, a não ser para PDF. Sem base64. A música entra só na versão mais nova (as outras ficam no repositório).
- Confira as abas alteradas em 390, 768 e 1280 px, no claro e no escuro.
