# Card Ritualistic: como atualizar

O card é gerado pelo motor compartilhado (`workspace/_shared/engine/`, especificação em `docs/workspace-template.md`). Aqui só há JSON e `media/`; **nenhum HTML se edita à mão**. Repositório do jogo: `E:\Claude Projects\Ritualistic`. Vale o `CLAUDE.md` de lá: o `AGENTS.md` aponta para `E:\Codex Projects\Ritualistic`, que não existe.

Abas: Painel (`painel.json`, à mão), Roteiro, Entregas e Arquivo, Playtest, Pipeline e Decisões (os cinco do coletor). A lista e a ordem das abas ficam em `projeto.json`.

## A cada atualização
1. **Coletar:** na raiz do repositório Mak, `node workspace/_shared/engine/coletores/ritualistic.mjs "E:/Claude Projects/Ritualistic" workspace/2026-10-17_ritualistic`. Ele lê:
   - `Docs/Plan.md` (fases e decisões técnicas);
   - as tags `slice-f*` (fases feitas);
   - os commits: entregas por fase e por dia, achados PT-nnn e decisões DD-nnn;
   - `Docs/Progress/F<N>` (miniaturas);
   - a existência de arquivos em `Art/` e no `Content` do Unreal (Pipeline).
2. **Português:** os commits são em inglês. Depois de cada coleta, reescreva em português o título e o resumo das entregas novas, o título dos achados novos e o das decisões DD novas. Esses textos ficam preservados nas próximas coletas (a regra está em `coletores/comum.mjs`). O resumo tem até 280 caracteres.
3. **Playtest:** um achado por commit que cita códigos PT; citado num commit conta como corrigido. A iteração mais recente fica aberta; para fechá-la, ponha `"aberta": false` nela (o coletor respeita). Achados novos devem ir para `docs/playtests/` no repositório; quando a pasta existir, o coletor precisa passar a lê-la.
4. **Painel:** reescreva `painel.json` (estado, `agora`, `comVoce` e a main do git).
5. **Gerar:** `node workspace/_shared/engine/gerar.mjs workspace/2026-10-17_ritualistic`. Valida, refaz as abas e atualiza o card em `workspace/workspace.json`.
6. **Mídia:** `node workspace/_shared/engine/conferir-media.mjs workspace/2026-10-17_ritualistic`; `--limpar --confirmar` move órfãos para `E:\Backups\Workspace\ritualistic\`.

## Regras
- O coletor só lê o repositório do jogo; nunca grava nele. Pipeline "feito" quer dizer que o arquivo existe no disco (inclui mudanças sem commit), não que foi aprovado.
- Card em português. Sem links, a não ser para PDF. Sem base64. Sem mídia pesada.
- Confira as abas alteradas em 390, 768 e 1280 px, no claro e no escuro.
