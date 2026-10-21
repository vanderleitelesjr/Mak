# Editor Global Empires — card do Workspace

Card dedicado ao aplicativo de autoria, separado do card do jogo. Conteúdo em português, usando o motor modular compartilhado.

Estado: implementação local; build técnico disponível; protótipo completo, migração integral, revisões e aceite humano ED86 ainda abertos.

As fontes editáveis são os JSONs e os arquivos `*-corpo.html`. Não editar o HTML gerado. `decisoes.json` preserva o texto integral ED1–ED86; `implementacao-dados.json` registra o estado por módulo; `evidencias.json` guarda resultados e hashes.

`fontes/` preserva snapshots de escopo, decisões, capacidades, execução e registros de artes. As fontes do projeto continuam na worktree `E:/ClaudeTemp/ge-editor`; evidências de runtime em `E:/ClaudeTemp/ge-editor-evidence`. A consolidação mais recente de resultados foi conferida diretamente nos TRX, pois o registro de implementação contém entradas históricas.

Artes conceituais em avaliação e prévias reais de viewport estão identificadas separadamente no Acervo. Não há screenshot validado da janela inteira.

Gerar: `node workspace/_shared/engine/gerar.mjs workspace/2026-10-21_global-empires-editor`

Validar sem gravar: acrescentar `--verificar`. Mídia: `node workspace/_shared/engine/conferir-media.mjs workspace/2026-10-21_global-empires-editor`.
