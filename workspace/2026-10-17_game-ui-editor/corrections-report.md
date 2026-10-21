# Correções pós-teste — Game UI Editor 0.2.0

As 18 correções desta rodada foram implementadas. O card foi migrado para o padrão modular dos projetos ativos. P19, conectores Claude/Antigravity, permanece como trabalho futuro, conforme a recomendação de escopo. A instalação utilizada pelo usuário foi preservada.

## O que foi feito

| Item | Entrega |
| --- | --- |
| P01 | Selecionar não altera o documento. Navegação com alterações reais oferece Salvar, Descartar ou Cancelar. |
| P02 | Oito alças de redimensionamento; Shift conserva a proporção nos cantos; Escape cancela; um Desfazer por gesto. |
| P03 | Árvore compacta com indentação por profundidade e conectores de parentesco. |
| P04 | Movimentação de subárvores e ordem de camadas coerente; mudança de pai preserva a posição no layout livre. |
| P05 | No máximo uma guia X e uma Y, ambas reposicionáveis. |
| P06 | Grid com controle de espaçamento adjacente e snap. |
| P07 | Alinhamento com pai/irmãos; Alt ignora o snap durante o gesto. |
| P08 | Duplo clique/F2 abre o conteúdo de texto ou botão; Escape cancela; nome e ID continuam separados. |
| P09 | Seletor de cor, hexadecimal e opacidade. |
| P10 | Condições e conexões recolhíveis, preservando as regras. |
| P11 | Tour genérico em projeto de prática separado, progresso na sessão e retorno protegido ao projeto original. Ajuda bilíngue atualizada. |
| P12 | Conversa inferior expansível. |
| P13 | Ajuda local, conversa com o modelo e operações avançadas identificadas; contexto inclui árvore e rascunho atuais. |
| P14 | Até quatro imagens privadas por mensagem, com limites e validação; leitura pelo modelo sob demanda; fora dos assets/exportações da HUD. |
| P15 | Login gerenciado do Codex pelo navegador, com cancelamento e erros; conectar não inicia inferência nem usa chave de API como alternativa. |
| P16 | Projetos novos genéricos, catálogo portátil por projeto e descoberta assistida, local e somente leitura. Candidatos exigem revisão. |
| P17 | Vínculo opcional e privado com uma raiz de jogo; seletores Windows de imagem/fonte iniciam nela e lembram pastas separadas; cópias importadas portáteis. |
| P18 | Temas Sistema/Claro/Escuro e esquemas Neutro/Azul/Verde, preservando cores e imagens da HUD. |
| P19 | Adiado: somente o conector Codex é apresentado como disponível. |

Conversões de ordem/guias de documentos antigos exigem revisão e preservam o original. As fontes anteriores à rodada também foram guardadas em um snapshot privado. Nenhum código de simulação do GE foi alterado.

## Verificações

- 112/112 testes de código passaram.
- 60 casos de interface aprovados: 30 no navegador e 30 no Windows WebView2 isolado. A rodada final aprovou 58; os dois casos da ajuda passaram na repetição focada após corrigir uma expectativa textual antiga. O código e os binários do produto não mudaram entre as execuções.
- 41/41 comparações TypeScript/C# passaram: 20 de comportamento e 21 de validação visual.
- Quatro verificações de diálogos reais do Windows passaram: pasta Unicode, imagem, fonte e cancelamento.
- Instalador 0.2.0 e quatro ZIPs preparados; 212 arquivos conferidos pelos manifestos SHA-256. Sem caminhos privados nos pacotes.
- As seis abas do card foram verificadas em 1440, 768 e 390 px, nos temas claro e escuro, incluindo links, imagens, zoom e download. O registro detalhado está em [evidence-corrections.json](evidence-corrections.json).

Testes de assistente/login usam um peer determinístico. Não houve inferência real nesta rodada. As provas anteriores de Unity e do ciclo de instalação continuam históricas; não foram repetidas para a 0.2.0.

## Arquivos preparados

Pasta local da entrega:

`E:/MrMak/GameUIEditor/.local/releases/game-ui-editor-0.2.0-20261020T030058130Z`

- `Game UI Editor_0.2.0_x64-setup.exe`
- `portable-windows.zip`
- `editable-sources.zip`
- `unity-integration.zip` — adaptador existente do GE.
- `portable-ge-pilot.zip`
- `release.json` e `archive-verification.json` — tamanhos, hashes e conferência.

A entrega é local, sem assinatura ou publicação. Nenhum commit, push ou reinício da aplicação do usuário foi realizado.

## Pontos que exigem sua atenção

- **Instalação e aceite:** o pacote está pronto; a instalação utilizada por você continua na versão anterior. A 0.2.0 ainda precisa de seu teste e aceite.
- **Outros jogos:** a descoberta sugere dados e ações para revisar. Um catálogo não cria o adaptador runtime do jogo; o único adaptador nativo fornecido continua sendo o do GE.
- **Login:** o fluxo novo foi verificado por protocolo, sem deslogar sua conta real. O primeiro login real ainda precisa ser observado.
- **Integração GE:** não havia uma instância Unity disponível. Mudanças de estrutura/layout precisam de validação nativa isolada antes do aceite final. M4/M6 permanecem abertos; os marcos anteriores continuam em 4/6.
- **Provedores futuros:** Claude/Antigravity continuam fora desta entrega.

O [registro M6](m6.md), as [propostas originais](correction-proposals.md) e as provas históricas foram preservados.
