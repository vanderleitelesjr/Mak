# Revisão 0.2.1 — hierarquia, conteúdo e chat

Esta revisão atende aos relatos posteriores ao uso da 0.2.0. A instalação do usuário continua preservada. A renovação visual do chat está em uma [proposta navegável](chat-proposal.html), separada das correções funcionais.

## Correções implementadas

| Item | Mudança |
| --- | --- |
| F01 — arraste na hierarquia | Desativada a captura nativa de arquivos do Tauri na janela Windows, conforme o requisito documentado para o arraste HTML do WebView2. Alvos mostram antes/depois/dentro; ciclos e pais nativos inválidos são recusados. A subárvore, a posição em layout livre e o Desfazer continuam nas operações compartilhadas. |
| F02 — conectores da árvore | Colunas calculadas pela profundidade; os ramos encontram o ícone do pai e continuam pelos irmãos e descendentes corretos. |
| F03 — edição de conteúdo | Comando **Editar conteúdo (F2)**, indicação de edição, cursor e seleção espelhados no texto do canvas. A medição usa os glifos renderizados, respeitando fonte, zoom, quebra de linha e Unicode. Escape cancela e remove a indicação. |
| F04 — canvas sobre o chat | Limites independentes de layout, pintura e rolagem para área de autoria e chat. Canvas conserva o zoom pela largura e rola dentro do seu espaço; cabeçalho não encolhe sobre o tour e o dock cede espaço à edição. |

O relato de arraste não foi reproduzido pela automação CDP: ela já movia os elementos antes da correção nativa. O requisito da plataforma foi confirmado no código/documentação do Tauri e corrigido na janela real. A aceitação com arraste físico no Windows continua importante. O desalinhamento das linhas e a sobreposição do canvas foram reproduzidos por verificações automatizadas.

## Proposta de chat

A recomendação é combinar padrões familiares dessas ferramentas, preservando a organização inferior já escolhida:

- Conversa central com largura confortável, remetente e atividade discretos.
- Caixa única para mensagem, anexos e Enviar/Parar.
- Fichas de projeto, seleção e rascunho para deixar o contexto visível.
- Modelo/esforço compactos; conexão, histórico e recursos avançados recolhidos.
- Divisor de altura ajustável e revisão de alterações acessível pela resposta.

O [exemplo interativo](chat-proposal.html) permite variar a altura e abrir uma revisão ilustrativa. Ele não conecta um agente nem envia mensagens. O visual foi aceito como base em 20/10/2026, com eventuais refinamentos para depois. A implementação foi entregue depois, na [0.2.2](chat-0.2.2.md); este documento mantém a evidência histórica da 0.2.1.

## Verificação e entrega

Os resultados finais, capturas e caminhos do pacote estão em [evidence-followup-0.2.1.json](evidence-followup-0.2.1.json). Testes de assistente usam peer determinístico; nenhuma inferência real é necessária. A prova anterior de paridade TS/C# e a prova Unity permanecem históricas: esta revisão não altera o catálogo ou o adaptador nativo do GE.

As verificações novas cobrem arraste e ordem, Desfazer de subárvore, rejeição de ciclo, geometria dos ramos, cursor e seleção, texto vazio/Unicode, cancelamento e limites do chat conectado em 1440/850/768 px. Os marcos M4/M6 continuam abertos para validação nativa e aceite; a instalação ativa não foi substituída ou reiniciada.
