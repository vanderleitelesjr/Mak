# Editor GE — escopo consolidado do primeiro protótipo

Data: 2026-10-21. Registro oficial: [decisoes.md](decisoes.md), ED1–ED86. Termos: [glossario.md](glossario.md).

**Estado:** 86 decisões confirmadas em 18 rodadas; entendimento final confirmado e implementação autorizada por Vanderlei em 2026-10-21. O documento especifica o produto a construir; os recursos descritos ainda precisam de implementação e validação. Trabalho isolado na branch `codex/editor-ge`, worktree `E:\ClaudeTemp\ge-editor`, base `970b43b`.

## Objetivo e alcance

Aplicativo independente em Unity/C#, Windows primeiro, sem exigir que seu usuário instale a Unity. Uso interno inicialmente; disponibilização aos jogadores posteriormente. O produto completo permitirá criar mapas, missões, campanhas, unidades e regras dentro da base RTS do GE. A prioridade de usabilidade é autoria de missões e campanhas sem exigir C#. A autoria por agentes deve usar as mesmas operações e validações da interface. (ED1–ED9)

**O primeiro protótipo já inclui a reforma da base de entidades do GE:** todos os tipos e seus comportamentos/capacidades atuais devem migrar para o modelo modular antes da entrega. Etapas internas podem converter famílias gradualmente, mas representantes isolados não cumprem o escopo final. As regras oficiais e seu comportamento precisam ser preservados. (ED47, ED50)

A prova de autoria será uma missão de escolta em mapa pequeno e inédito, usando assets existentes: criar, editar, salvar, reabrir, testar e exportar para jogar pelo GE fora da interface de autoria. A entrega depende da validação humana desse ciclo, além das verificações técnicas. (ED7, ED16–ED18, ED78, ED81, ED86)

## Entidades, variantes e autoridade dos dados

- Definição genérica de entidade com capacidades combináveis para unidades, estruturas, recursos, obstáculos, props e demais famílias existentes. A organização interna das classes e dos sistemas deve servir a esse modelo; a entrevista não fixa uma classe C# por tipo nem uma implementação específica de ECS. Props puramente visuais mantêm a responsabilidade de apresentação. (ED22, ED47, ED50)
- Criar variantes locais para personalizações, preservando a base e outros projetos/campanhas. Cada variante tem uma única base, que pode ser outra variante; mostrar origem por campo e permitir restaurar o valor herdado. Referências e ciclos devem ser validados. A base do projeto é mantida até uma atualização explicitamente revisada e aceita. (ED11, ED48, ED84)
- Definições de armas e capacidades podem ser compartilhadas entre tipos; variantes personalizam diferenças. Mostrar os usos e o impacto de uma edição. Munição, cooldowns e outros estados de execução continuam individuais. (ED51)
- Na unidade colocada, editar posição, orientação, dono e estado inicial, como vida restante. Atributos de tipo, como dano e velocidade-base, pertencem à variante. Efeitos normais de pesquisas, combate e outras regras de gameplay continuam válidos durante a partida. (ED49)
- Projeto como pasta com arquivos legíveis separados por conteúdo, favorável a Git e trabalho paralelo. A extensão física dos arquivos e o transporte da automação serão escolhas técnicas dentro desse contrato. (ED4, ED10)
- `regras.txt` permanece como fonte da base oficial; valores personalizados pertencem às definições/variantes locais. Resolver tudo em um catálogo efetivo único, com identidades, origem e precedência explícitas. Consumidores usam esse resultado, preservando inteiros/Fix, validação e ordem canônica. Identidade, significado e conteúdo autoritativo necessários à reprodução entram no contrato de estado/hash/replay. AJ4/AJ13 foram complementados por essa decisão. (ED85)
- Conteúdo de autoria do protótipo é experimental, sem compromisso de migração para futuras versões. Fontes e arquivos antigos são preservados. Isso não autoriza perda de trabalho nem implica compatibilidade automática de sessões. (ED15)

## Mapa, paletas e posicionamento

- Pintura de materiais; ferramentas separadas para terreno/passagem; edição de altura com relevo suave e platôs/degraus. Textura e aparência não criam bloqueio ou efeito tático automaticamente. Altura não aprova novos bônus de combate, visão ou navegação. (ED20, ED21, ED25)
- Água por célula, preservando o modelo atual do GE, inclusive possível inclinação. Vaus e pontes estáticas retangulares, com passagem explícita. Não inclui construção/destruição de pontes nessa entrega. (ED26, ED27)
- Área jogável de forma livre desenhada/pintada, com contorno visual e limites de câmera correspondentes. Diagnóstico de passagem por tipo de unidade e consulta de rota distinguem chegada real de aproximação ao ponto acessível. (ED28, ED29)
- Antes de colocar, escolher item com comportamento explícito: visual, obstáculo ou recurso. Construções, recursos e obstáculos ajustados à grade; unidades e decoração com posicionamento livre. Colocação inválida de construção/obstáculo é recusada, mostrando área e causa. (ED22–ED24)
- Regiões retangulares, circulares e poligonais livres, editadas no mapa. Presença de uma unidade é determinada por seu centro. (ED45, ED46)
- Kits de cenário reutilizáveis geram instâncias independentes ao colocar; editar o kit não atualiza suas colocações anteriores. Os tipos/capacidades usados continuam compartilháveis. (ED80)

## Participantes, missão e IA

- Missão de referência com humano, aliado e inimigo como participantes distintos. Relações por times, simétricas e fixadas antes do teste; controle de unidades individual e visão compartilhada configurável. Não inclui mudança de lado pelo grafo inicialmente. (ED30, ED31, ED34, ED38)
- Autor define unidades, recursos e condições iniciais. A abertura econômica GE é um modelo opcional; missões podem existir sem bases ou centros urbanos obrigatórios. Preservar o modelo próprio da escaramuça. (ED32)
- Alvo protegido pertence ao aliado e segue uma rota de pontos editada no mapa; grafo inicia, pausa e retoma. Só avança com unidades humanas próximas, com distância configurável; pausa durante combate próximo. Sem caminho, espera e emite evento para o grafo, que determina a consequência. (ED35, ED40–ED43)
- Vitória quando o alvo protegido específico chega à região de destino; sua morte causa derrota. A escolta pode sofrer baixas. São condições da missão de referência, sem substituir a política da escaramuça oficial. (ED16, ED33)
- Inimigos usam defensores, patrulhas e emboscadas preparados pelo autor. Editor de IA inicial usa perfis prontos parametrizáveis, ativados pelo grafo. (ED36, ED37)
- Economia e redes logísticas separadas. Fontes abastecidas podem atender aliados conforme a permissão; depósitos de donos diferentes não formam uma cadeia mista. Dono da fonte paga a manutenção existente, sem taxa adicional por atender aliados. (ED39, ED44, ED77)

## Lógica visual, depuração e C#

- Vários grafos menores por objetivo/acontecimento, com eventos, condições, ações e variáveis. Subgrafos reutilizáveis possuem entradas e saídas explícitas e podem ser extraídos de trechos existentes. (ED53–ED55)
- Cada fluxo define como receber novos eventos enquanto uma ativação está esperando: execuções independentes, fila ou descarte de repetições. Contextos ficam separados e identificáveis, com ordem determinística na simulação. (ED56)
- Pontos de parada por nó, passo a passo e inspeção de valores. Erro de execução pausa o teste e localiza o nó responsável. Histórico e reinício com a mesma semente; sem retorno interativo no tempo na primeira entrega. A semente sozinha não reproduz entradas diferentes do jogador. (ED57–ED59)
- Grafo chama funções C# prontas na primeira entrega. Código da equipe/agentes é revisado e confiável. Edição/execução de C# autoral entra na entrega seguinte; produto final deve permitir chamadas a funções C# editáveis com entradas/saídas explícitas. Não há compromisso de converter código arbitrário de volta em grafo. (ED8, ED12, ED13, ED19)

## Câmeras e cinematográficas

- Capturar enquadramentos; acionar cortes/transições pelo grafo; timeline de câmera com quadros-chave. Outras trilhas de mídia ou movimento/combate de atores não foram aprovadas como parte dessa timeline inicial. (ED61)
- Além de sequências com gameplay em andamento, oferecer congelamento cinematográfico: todas as unidades e os fluxos/temporizadores normais de gameplay ficam congelados; câmera e eventos/tempos da sequência avançam. Não há exceções para atores selecionados nesse modo inicial. (ED62, ED63, ED67)
- Bloquear ordens de gameplay e câmera manual; sempre permitir pular. Ao terminar/pular, restaurar o enquadramento anterior e devolver os controles suspensos pela sequência, preservando bloqueios independentes. (ED64–ED66)
- Bloco de conclusão comum define o estado de saída e executa uma única vez no término natural ou ao pular. Pular não dispara automaticamente os eventos intermediários restantes nem desfaz efeitos já aplicados. Efeitos essenciais à saída devem estar na conclusão comum. (ED68)
- Congelamento cinematográfico e pausa de depuração são estados distintos: a pausa do teste deve permitir inspecionar sem a sequência continuar avançando. Eventos autoritativos usam tempo determinístico, sem depender da conclusão de animações ou do relógio local da apresentação. (ED58, ED62, ED67)

## Interface, histórico e colaboração

- Janela única com painéis redimensionáveis. Seleção compartilhada entre mapa, objetos, grafo e timeline; inspetor fixável para comparação. Busca global, filtros, favoritos e edição múltipla de campos compatíveis, mostrando valores diferentes e preservando campos não alterados. (ED69, ED70, ED79)
- Undo/redo de conteúdo unificado na sessão, com uma ação por gesto/operação em lote. É distinto do log da partida e não promete persistência da pilha após reabrir o aplicativo. (ED71)
- Permitir salvar definições incompletas como rascunhos, com problemas visíveis; bloquear teste enquanto houver erros impeditivos. Salvamento explícito do projeto e cópias automáticas de recuperação separadas, sem sobrescrita silenciosa. (ED52, ED72)
- Detectar mudanças externas, mostrar diferenças e conciliar explicitamente, preservando trabalho local. Agentes podem editar, salvar, validar e iniciar testes no projeto autorizado pela mesma base de operações da interface, com histórico/desfazer. (ED5, ED73, ED74)

## Teste, exportação e continuidade

- Teste jogável dentro do editor, com grafo/inspetor ao lado, e exportação para jogar pelo GE fora da interface de autoria. Cada teste usa conteúdo congelado; edições autoradas valem no próximo teste e acontecimentos da partida não são gravados automaticamente no projeto. (ED14, ED60, ED81)
- Salvar/retomar a sessão com mundo, fluxos/esperas e controladores de IA de missão necessários à continuidade. Preservar junto ao save o conteúdo congelado necessário e validar dependências/versões para retomar com aplicativo compatível, mesmo que o projeto tenha sido editado. (ED75, ED83)
- Exportar localmente diagnóstico com conteúdo/versões utilizados, semente, comandos e erros necessários à reprodução. Exportar não autoriza envio/publicação. (ED76)
- Novos formatos versionados; rejeitar incompatíveis com explicação e preservar arquivos anteriores. Não entregar conversão automática dos saves/replays atuais do GE. (ED82)

## Fronteira da primeira entrega

| Entra no primeiro protótipo | Fica para depois ou permanece fora deste fechamento |
|---|---|
| Migração integral dos tipos/capacidades existentes, com editor modular | Comportamentos inteiramente novos sem implementação de suporte |
| Uma missão de escolta completa e exportável | Encadeamento de campanha: entrega seguinte (ED18) |
| Grafo com funções prontas e subgrafos | C# autoral executável: entrega seguinte (ED19) |
| Perfis de IA de missão parametrizáveis | Montagem livre de decisões de IA e autoria econômica completa (ED36/ED37) |
| Timeline de câmera e congelamento cinematográfico | Trilhas de atores em movimento durante esse congelamento (ED63) |
| Assets GE existentes e kits com colocações independentes | Importação externa, kits vinculados, docking livre e múltiplas janelas (ED69/ED78/ED80) |
| Sessão salva e diagnóstico reproduzível | Retorno interativo no tempo e migração de formatos antigos (ED59/ED82) |

A política pública de execução de scripts, outras plataformas e a decisão J23 sobre memória/hospedagem da IA econômica não foram resolvidas por esta entrevista. A migração das entidades deve preservar o jogo existente; limitar a autoria inicial de IA não autoriza remover sua IA econômica atual.

## Impacto aprovado da evolução numérica

Antes: `regras.txt` como fonte única e catálogo de campos/índices conhecidos. Depois: o arquivo mantém a base oficial; definições/variantes locais resolvem um catálogo efetivo único, com identidade e significado vinculados à sessão e à reprodução. Direção aprovada em ED85; esta etapa altera a documentação, com código dependente ainda a implementar.

Levantamento somente leitura no HEAD `970b43b`: 537 correspondências em 87 arquivos, incluindo 44 arquivos de testes. A busca é um inventário para triagem, não uma lista de 87 alterações. Este recorte trata da fonte numérica; a migração comportamental integral de ED50 requer inventário e provas próprios antes das alterações correspondentes.

| Grupo | Constatação e ação de implementação |
|---|---|
| Valores oficiais | Preservar `sim/com.globalempires.sim/Rules/regras.txt` e seus números/códigos de decisão. |
| Consumidores de regras resolvidas | `AiTuning`, `MatchStart` e `ShownRules` já consomem regras da partida; preservar uma autoridade efetiva única para esses consumidores. |
| Catálogo/leitura | Revisar `RuleCatalog`, `RulesFile` e `GameRules`: schema/contagem fixos, chaves conhecidas e digest somente de valores não representam todas as novas definições. |
| Ligação aos tipos | Revisar `RuleTable` e `EntityTypeTable` para resolver valores das definições, preservando os valores oficiais. |
| Estado/replay/sessão | Revisar `SimWorld`, `Replay` e `SimSession` para incluir identidade/conteúdo resolvido e versões necessários à reprodução. |
| Entrada/geração | Revisar carga no `SimRunner` e geração na CLI `Tuning`/`Program`, mantendo geração da base oficial e acrescentando contexto de projeto no player. |
| Índices/proveniência | Revisar `Command`, `SimWorld.Tuning`, `TuningPanelModel`, `TuningReport` e `TuningTool`; patches locais precisam atingir a origem correta. |
| Testes/docs | Contratos diretamente afetados em `RulesFileTests`, `TuningTests`, `ReplayTests` e `TuningReportTests`. Triar os demais; preservar testes de valores oficiais/cultura/Fix. ED11/ED85, AJ4/AJ13 e glossário foram alinhados nesta consolidação. |

A implementação dessa evolução exige revisão `code-review high` e `guarda-determinismo`, conforme o AGENTS.md. Atualização de hashes dourados deve explicar mudanças de formato e demonstrar preservação do comportamento, em vez de ocultar regressões.

## Proposta de ordem técnica

Esta ordem organiza a implementação; não muda o escopo confirmado nem autoriza entregar apenas uma parte como protótipo completo.

1. Inventariar os tipos/capacidades atuais e registrar referências de comportamento e desempenho antes da migração.
2. Construir resolução/validação de definições e variantes, catálogo efetivo, identidades e contratos versionados.
3. Migrar integralmente as entidades e seus consumidores, preservando responsabilidades dos sistemas existentes, estado e reprodução.
4. Implementar documentos/operações de autoria compartilhados pela interface e automação, com histórico, recuperação e conflitos externos.
5. Integrar mapa/paletas, participantes, perfis de IA, objetivos e grafo com esperas/estado explícitos; acrescentar depuração e câmeras com os dois modos de tempo.
6. Fechar interface, teste integrado, salvamento de sessão, exportação/reprodução e carregamento pelo GE fora da autoria.
7. Executar as verificações técnicas e a sessão humana de aceite do ciclo completo.

Backend do grafo, transporte local da automação, formatos físicos e organização interna de classes serão escolhidos por adequação ao código e às dependências existentes. O contrato exige responsabilidades claras e funções prontas no primeiro runtime; não exige compilação dinâmica de C# nessa etapa.

## Critérios de aceite

| Prova | Resultado necessário |
|---|---|
| Migração integral | Inventário de todos os tipos/capacidades existentes coberto; valores e comportamento oficial preservados, com regressões verificadas nos sistemas responsáveis. |
| Autoria humana | Vanderlei cria/edita, salva, reabre e joga a missão sem escrever C#, conforme ED86. |
| Interface e automação | Operações equivalentes respeitam as mesmas validações e resultados; alterações possuem histórico e não contornam regras de conteúdo. |
| Mapa e missão | Terreno/passagem coerentes por classe; escolta obedece rota, proximidade, combate, bloqueio e condições de vitória/derrota. |
| Variantes e recuperação | Base preservada, origem/restauração por campo, referências/ciclos validados; rascunhos, undo e conflitos externos não causam sobrescrita silenciosa. |
| Eventos/depuração | Reativação respeita cada política; esperas mantêm contextos; breakpoints/erros localizam o nó e pausam corretamente. |
| Cinematográfica | Congelamento preserva gameplay/temporizadores; sequência avança; pular funciona, conclusão executa uma vez e câmera/controles retornam. |
| Sessão salva | Retomada durante espera, IA de missão e cinematográfica continua corretamente por vários ticks, com os mesmos comandos; comparar somente o instante do load é insuficiente. |
| Reprodução/exportação | Missão exportada roda pelo GE; pacote de diagnóstico permite reproduzir o teste com conteúdo compatível; incompatibilidades são recusadas com explicação. |
| Qualidade técnica | Testes apropriados, CI e revisões exigidas pelo AGENTS.md; medir quadro/tick/memória nos cenários de referência e informar limites comprovados. |

Documentação, arte conceitual, um teste verde ou demonstração do agente não substituem a validação humana da autoria nem provam isoladamente a integração completa.

## Referências e limites da pesquisa

- [Estudo de WC3 e arquitetura GE](<../../../reports/Arquitetura do editor Global Empires.md>).
- [Pesquisa de autoria WC3](<../../../research_notes/Arquitetura do editor Global Empires/autoria.md>).
- [Acesso estruturado ao SC2](<../../../Entregas_Codex/StarCraft_II_Acesso_v01_2026-10-21/README.md>).
- [Artes conceituais e revisões](<../../../Entregas_Codex/Editor_GE_Conceitos_v01_2026-10-21/README.md>).

Os estudos acessaram arquivos/dados e código; não constituem validação integral da interface/runtime dos editores Blizzard. As artes são direção de produto. O registro de decisões distingue o que foi confirmado das propostas técnicas de implementação.
