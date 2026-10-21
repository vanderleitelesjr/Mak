# Card Blended: como atualizar

O card é gerado pelo motor compartilhado (`workspace/_shared/engine/`, especificação em `docs/workspace-template.md`). Aqui só há JSON e `media/`; **nenhum HTML se edita à mão**. Fontes do projeto: `E:\MrMak\Blended` (`PLANO.md`, `DECISOES.md`, `PENDENCIAS.md`, `testes/capturas/`). Só o Coordenador escreve no card.

Abas e arquivos: Painel (`painel.json`), Roteiro (`roteiro.json`), Entregas e Arquivo (`entregas.json`), Decisões (`decisoes.json`), Acervo (`acervo.json`). A lista e a ordem das abas ficam em `projeto.json`. Playtest fica de fora até o primeiro teste; nesse dia, crie `playtest.json` e acrescente `{ "modulo": "playtest", "nome": "Playtest" }` em `abas`, depois de Entregas.

## A cada evento
1. **PR aberto ou mergeado** (`entregas.json`): uma entrada por PR, acrescentada **no fim**: `id` (`pr-N-assunto`), `data` local, `area` (`editor`, `ci`, `documentos`), `titulo` (`PR #N · ...`), `resumo` (até 280 caracteres), `olhar` (rodadas de revisão e notas), `estado` (`PR aberto` ou `main`), `refs` (`PR #N`, `TN`), `miniaturas[]`. No merge, troque o estado da entrada existente; não crie outra.
2. **Roteiro** (`roteiro.json`): a tarefa vira `feito` no merge e `em-andamento` em revisão; as liberadas são `a-fazer`, as que esperam dependência, `bloqueado`. O `resumo` leva a observação e o `PR #N`. As pendências abertas de `PENDENCIAS.md` ficam em `pendencias[]` da tarefa de origem (CI e infraestrutura na T1, com o prefixo `CI:`), no formato `título · quando: ... · origem: ...`. Depois que o Revisor mexer em `PENDENCIAS.md`, ajuste as listas e o número "Pendências abertas" do Painel.
3. **Captura nova** (`acervo.json`): PNG de `testes/capturas/` convertido para WebP de 480 px (Pillow, `py -I`: `resize` para 480 de largura, `quality=80`). Nome `media/interface/<família>/<item>-v01[-<vista>].webp`; a família é a tela do editor, e Simples/Completo, temas e ângulos são vistas do mesmo item. Tela que mudou: versão nova (`-v02`), com a anterior em `historico`. `original` aponta para o PNG no repositório.
4. **Decisão** (`decisoes.json`, montado à mão: `DECISOES.md` é um log sem códigos): só o que vale hoje, por tema. Linha que substitui outra troca o item. Códigos do card por tema (`PE`, `DS`, `PC`, `PT`, `ES`, `AU`, `TA`, `SG`, `EX`, `CB`, `IC`, `PV`, `RC`); não renumere os existentes. O que espera o usuário vai em `espera`.
5. **Painel** (`painel.json`): reescreva `estado`, `agora`, `comVoce` e os números digitados (main, PRs em revisão, pendências). Os com `@` são calculados.
6. **Gerar:** na raiz do repositório Mak, `node workspace/_shared/engine/gerar.mjs workspace/2026-10-17_blended`. Valida, refaz as abas e atualiza o card em `workspace/workspace.json`. Se der erro, corrija o JSON. `--verificar` só valida.
7. **Mídia:** `node workspace/_shared/engine/conferir-media.mjs workspace/2026-10-17_blended`; `--limpar --confirmar` move órfãos para `E:\Backups\Workspace\blended\`.

## Regras
- Card em português. Sem links, a não ser para PDF. Sem base64. Sem mídia pesada.
- Confira as abas alteradas em 390, 768 e 1280 px, no claro e no escuro.
- O card antigo (`blended.json`, `gerar.mjs`, `conferir.mjs`, `blended.css` e as páginas) está em `E:\Backups\Workspace\blended\card-antigo\`; as capturas antigas, em `E:\Backups\Workspace\blended\media\`.
