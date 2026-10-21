# Card Mashup: como atualizar

O card é gerado pelo motor compartilhado (`workspace/_shared/engine/`, especificação em `docs/workspace-template.md`). Aqui só há JSON e `media/`; **nenhum HTML se edita à mão**. Fontes do projeto: `E:\Claude Projects\Mashup` (`PLANO.md`, `DECISOES.md`, `PENDENCIAS.md`, `docs/criterios/`, `docs/pesquisa/`, `docs/playtests/`).

Abas e arquivos: Painel (`painel.json`), Roteiro (`roteiro.json`), Entregas e Arquivo (`entregas.json`), Playtest (`playtest.json`), Decisões (`decisoes.json`), Riscos (`riscos.json`), Métricas (`metricas.json`). A lista e a ordem das abas ficam em `projeto.json`.

## A cada entrega
1. **Entregas:** acrescente **no fim** de `entregas.json` uma entrada por entrega (não por commit): `id` (`AAAA-MM-DD-assunto`), `data`, `area` (`código`, `ensaio`, `design`, `arte`, `áudio`, `playtest`, `ferramentas`), `titulo`, `resumo` (até 280 caracteres), `olhar` (opcional), `estado` (`main`, `branch`, `em revisão`), `refs[]`, `miniaturas[]`. Quando uma entrega muda de estado, atualize a entrada existente.
2. **Captura:** toda entrega com resultado visível leva captura, sem limite de quantidade. WebP de até 480 px e 150 KB em `media/AAAA-MM/` (Pillow: `thumbnail((480, 480))`, `quality=72`); o original fica no repositório do jogo. `links` só aceita PDF.
3. **Roteiro:** marque a tarefa como `feito` em `roteiro.json`. Fase nova: troque a atual para `feita`, a próxima para `atual` e liste as tarefas dela (`id`, `titulo`, `estado`, `depende[]`, `pendencias[]`). O progresso é calculado.
4. **Painel:** reescreva `painel.json` (`estado`, `agora`, `comVoce`, números). Os números com `@` são calculados; não digite contagens que o motor calcula.
5. **Gerar:** na raiz do repositório Mak, `node workspace/_shared/engine/gerar.mjs workspace/2026-10-17_mashup`. Ele valida tudo, refaz as abas e atualiza o card em `workspace/workspace.json` (data, abas, capa, progresso e fase). Se der erro, corrija o JSON; não contorne a validação. `--verificar` só valida.
6. **Mídia:** `node workspace/_shared/engine/conferir-media.mjs workspace/2026-10-17_mashup` acusa referência quebrada, arquivo grande e órfão; `--limpar --confirmar` move os órfãos para `E:\Backups\Workspace\mashup\`.

## Quando as fontes mudarem
- **Decisões** (`decisoes.json`, montado à mão: `DECISOES.md` não tem códigos nem estado): só o que vale hoje, por tema. Linha que substitui outra troca o item. Códigos do card por tema (`PJ`, `PR`, `MV`, `RD`, `VD`, `JG`, `MX`); não renumere os existentes. Decisões pendentes de `PENDENCIAS.md` entram com `estado: "Pendente"`; o que o usuário precisa revisar vai também em `espera`.
- **Riscos** (`riscos.json`): espelha a seção Riscos de `PENDENCIAS.md`. Risco encerrado fica com `estado: "fechado"` e a data na descrição. `fase` é a primeira fase em que o risco é tratado (vira o título do grupo). A severidade não está em `PENDENCIAS.md`: foi atribuída no card e pode ser corrigida pelo usuário.
- **Playtest** (`playtest.json`): espelha `docs/playtests/`. Uma iteração aberta por vez; ao fechar, `aberta: false` e ela vai para o Arquivo.
- **Métricas** (`metricas.json`): valores do build empacotado, por marco, com a meta ao lado quando houver (`sentido` `maior` ou `menor`). Medição nova vira marco novo; não apague os antigos.

## Regras
- Card em português. Sem links, a não ser para PDF. Sem base64. Sem mídia pesada.
- Confira as abas alteradas em 390, 768 e 1280 px, no claro e no escuro.
- O card antigo (gerador próprio, `mashup.css` e páginas escritas à mão) está em `E:\Backups\Workspace\mashup\card-antigo\`.
