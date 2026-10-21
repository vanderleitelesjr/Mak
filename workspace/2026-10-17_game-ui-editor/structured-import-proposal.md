# Importar a UI existente do jogo — proposta

**Objetivo:** conectar um projeto e trazer sua HUD e telas existentes como elementos editáveis, com as artes originais e uma simulação de seus comportamentos, sem precisar marcar uma captura como fundo.

Estado: proposta aprovada pelo usuário; implementação autorizada em 20/10/2026. Os temas adicionais continuam com decisão adiada. Primeira entrega local: 0.3.0; consulte [implementação, provas e limites](structured-import-0.3.0.md). A cobertura parcial não equivale a integração nativa universal.

## O que existe e o que falta

A aplicação já possui documento portátil, assets por hash, hierarquia, componentes, estados, regras, dados simulados e comparação com revisão/conflitos. O adaptador do GE já captura elementos reais da Unity. Entretanto, `CaptureVisualAuthoring()` representa os painéis conhecidos como blocos nativos e preserva seus controles internos no jogo; não importa recursivamente todos os botões, textos e artes como objetos independentes.

A análise da pasta vinculada atual procura candidatos a símbolos de dados/ações no código. Ela não enumera cenas, prefabs, árvores de UI e telas completas. O modelo visual atual também cobre apenas contêiner, texto, imagem e botão; controles como rolagem, máscaras e estilos de texto mais completos exigem extensões e migração compatível.

Fontes verificadas nesta discussão: `E:/MrMak/GameUIEditor/native/unity/GameHud.Visual.cs`, `native/unity/HudAuthoringBridge.Visual.cs`, `app/visual-document.ts`, `app/game-project.ts` e `app/game-catalog.ts`.

## Fluxo proposto

1. **Identificar engine e sistema de UI.** O vínculo aponta a raiz; um adaptador enumera documentos/telas/cenas/prefabs de UI. Na Unity, distinguir UI Toolkit, uGUI e implementação personalizada. A exportação usa APIs da engine; a varredura de nomes de métodos não substitui essa etapa.
2. **Extrair a definição e observar a montagem.** Ler fontes declarativas e componentes serializados para preservar regras de layout. Para UI montada em código, capturar a árvore criada e seus recursos em uma cena de inspeção controlada. Guardar medidas resultantes como evidência; preservar separadamente as regras de autoria.
3. **Trazer os recursos reais.** Copiar imagens/fontes e registrar sprites de atlas, regiões de textura, nine-slice, cores, texto, ordem e relações de origem. O recorte automático de um sprite no atlas é metadado do asset, sem marcação manual numa captura da tela. Original e região devem permanecer recuperáveis.
4. **Normalizar no documento existente.** Reconstruir pais/filhos, instâncias/componentes, âncoras, layout, telas e estados. Estender os tipos existentes apenas para recursos realmente necessários. Importação e reimportação usam o owner do projeto e suas validações; nenhum writer paralelo.
5. **Associar cenários e comportamentos.** Adaptadores declaram dados, coleções e ações reconhecidas. Fixtures oferecem contextos de amostra e estados de tela. A prévia simula esses vínculos com rastreio dos eventos. Ações com significado ainda desconhecido aparecem como pendentes de mapeamento.
6. **Comparar e ajustar.** Exibir cobertura por tela e por recurso, abrir o resultado para edição e conservar um mapa estável para reimportar ou aplicar mudanças revisadas à origem. Publicar alterações no jogo continua sendo uma ação explícita.

## Fontes de informação por engine

| Sistema | Leitura principal | Complemento necessário |
| --- | --- | --- |
| Unity UI Toolkit | UXML/USS, árvores `VisualElement`, estilos, assets e componentes conhecidos | Captura da construção procedural e declaração semântica de eventos/bindings do jogo. Primeiro alvo recomendado para GE. |
| Unity uGUI | Canvas/RectTransform, cenas/prefabs, Image, Button, TMP e referências serializadas | Exportação pela Unity para resolver atlas, fontes, layouts, overrides e componentes especiais corretamente. Segunda frente. |
| Unreal UMG | Widgets, árvores e propriedades por plugin da Unreal | Adaptador próprio para bindings, Slate personalizado e prévia de estados. Escopo posterior. |
| Godot Control | Cenas, nós Control, temas, sinais e recursos via plugin | Adaptador próprio para scripts e estados. Escopo posterior. |

Esses adaptadores devem compartilhar o formato portátil e a revisão existentes, expondo explicitamente o que conseguem extrair, simular e escrever de volta.

## Simulação de funções

| Elemento importado | Resultado na prévia |
| --- | --- |
| Texto de recurso, vida e progresso | Binding com dados de amostra editáveis e cenários coerentes. |
| Botão que abre/fecha uma tela | Transição entre as telas importadas quando o vínculo é conhecido. |
| Grade de comandos, inventário e listas | Templates e coleções com itens de amostra; preservar repetição, evitando congelar uma instância de cada item observado. |
| Treinar unidade, comprar, atacar | Registro/simulação da ação com parâmetros e condições reconhecidas. A lógica autoritativa continua no jogo. |
| Minimap, material ou controle personalizado | Adaptador específico ou elemento nativo preservado com limitação explícita. Não apresentar uma imagem estática como importação editável completa. |

Uma referência serializada pode revelar o destino de um evento. Lambdas, callbacks montados em código e lógica arbitrária exigem declaração pelo adaptador ou mapeamento revisado. A IA pode sugerir esses mapas, mas a extração normal deve funcionar sem inferência por elemento. Evitar executar comandos reais para descobrir o que um botão faz.

## Telas e estados que não aparecem no momento

Uma captura da árvore atual cobre apenas aquele estado. O adaptador deve reunir as definições de telas inativas e perfis de inspeção reproduzíveis: menu, HUD, pausa, seleção vazia/simples/múltipla, inventário vazio/cheio, vitória/derrota, por exemplo, conforme o jogo.

Os perfis usam dados e serviços de teste controlados para instanciar as árvores relevantes. Não se pode prometer descobrir todo código que cria uma tela condicional apenas observando um frame. O inventário de telas deve indicar o que foi encontrado em assets, observado em runtime ou declarado pelo adaptador e o que ainda não foi exercitado.

## Reimportação e preservação

Cada objeto precisa de identidade estável ligada à origem: identidade do asset/documento, objeto local ou ID semântico atribuído na construção procedural. Caminho visual e nome isolados não são suficientes. Guardar baseline importada e overrides locais permite comparar origem/base/edição, tratar remoções e reaplicar mudanças sem duplicar nós ou apagar personalizações.

Preservar os arquivos originais e recursos opacos. Levar ao pacote portátil os assets necessários e sua proveniência; caminhos absolutos do computador e conexão ficam privados. Antes de substituir um valor autorado, usar revisão/conflitos e salvamento transacional existentes. Escrita de volta é uma capacidade separada por adaptador; importação visual não garante round trip de qualquer componente.

## Entregas recomendadas

| Etapa | Entrega | Observação que comprova funcionamento |
| --- | --- | --- |
| A — piloto GE/UI Toolkit | Extração profunda de um painel representativo com botões, texto, imagens e coleção; relatório de cobertura | Importar sem captura de fundo, editar filhos e conferir artes/fontes/estados reais. Recursos não suportados listados, sem descarte silencioso. |
| B — HUD e telas do GE | Perfis para as telas principais, templates dinâmicos, mocks e revisão de ida/volta | Navegar entre telas, variar dados de amostra, preservar vínculos e comparar a renderização na Unity. |
| C — generalização Unity | Inventário e importador para UI Toolkit declarativa e uGUI em um segundo projeto | Importar um jogo sem IDs ou classes do GE. Reabrir de forma portátil e reimportar sem perder overrides. |
| Depois — outras engines | Plugins próprios para UMG e Godot, priorizados conforme uso | Prova específica em cada engine; não declarar suporte a partir da detecção da pasta. |

O caminho mais curto é aproveitar o adaptador GE existente como piloto e criar a extração comum ao redor do formato já usado. O minimapa e outros renderizadores especiais podem permanecer nativos enquanto os painéis compostos passam a expor seus filhos editáveis.

## Critério de “setup rápido”

A experiência desejada é: **vincular → reconhecer → importar → personalizar**. A instalação/conexão do adaptador e a preparação de perfis acontecem uma vez por integração. Usar índice de dependências, hashes e cache incremental nas importações seguintes. Medir tempo de importação inicial e atualização separadamente em projetos representativos; não prometer uma importação universal instantânea antes dessa prova.

O relatório de cobertura distingue: editável, parcialmente suportado, nativo preservado e vínculo pendente, incluindo quais telas/estados foram exercitados. Uma referência visual pode ser usada para comparar fidelidade, mas deixa de ser a base estrutural da UI.
