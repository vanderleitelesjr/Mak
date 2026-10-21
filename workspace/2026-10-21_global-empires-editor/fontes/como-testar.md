# Editor GE — execução do build técnico

O build de desenvolvimento está em `E:\ClaudeTemp\ge-editor-evidence\windows\GlobalEmpiresEditor.exe`. Ele inclui o runtime Unity e não exige instalar a Unity para usar o aplicativo. Ainda está em implementação; os limites e as evidências estão em [implementacao.md](implementacao.md).

## Janela e missão

- Abrir o executável inicia a missão de exemplo como projeto de autoria não salvo.
- `Arquivo` contém a pasta do projeto, abrir/salvar, recuperação, conflitos externos, exportação, sessão e diagnóstico local. A pasta `source/` guarda XML/UTF-8 por documento e definição, com a base de regras fixada.
- `Mapa`: seleção, materiais, passagem/água, altura, suavização, área jogável, entidades, props visuais, regiões, pontos, kits e consulta de rota. Unidades são livres; áreas de estruturas/obstáculos/recursos seguem a grade.
- `Objetos`: criar variante de base oficial/local, editar campos/capacidades/referências, ver origem/usos e restaurar herança. Alterações em definições compartilhadas atingem seus usuários; estado de uma colocação pertence ao inspetor da colocação.
- `Missão`: participantes/times, visão/abastecimento, escoltas, pontos e perfis. No exemplo, o humano é 1, o comboio aliado 2 e a emboscada 3.
- `Lógica`: grafos por evento, nós, conexões de saída/alternativa, extração de subgrafo, breakpoints e inspeção. Arrastar o título move um nó. A extração inicial requer uma entrada e no máximo uma continuação externa; cria portas explícitas de dados.
- `Câmeras`: capturar quadros da câmera do mapa e editar sequência/ticks/congelamento/conclusão. A timeline inicial contém somente câmera e eventos.
- `Diagnóstico`: problemas, histórico do teste e documentos avançados. Projetos incompletos podem ser salvos; erros impeditivos bloqueiam teste e exportação.

`F5` inicia um teste com conteúdo congelado; alterações de autoria só valem no próximo. Clique em unidades humanas para selecionar, Shift para seleção múltipla; clique direito move e Shift+direito emite ataque em movimento. A roda aproxima/afasta; o botão central move a câmera quando ela não está suspensa. `Pular sequência` permanece disponível durante cinematográficas.

O exemplo vence quando **o comboio específico** entra na região de destino e perde por sua morte. A escolta precisa de tropas humanas próximas, pausa durante combate próximo e espera se não houver chegada real à rota.

Os arquivos exportados ficam em `exports/`, sem publicação ou envio. Para jogar uma missão exportada fora da autoria:

```powershell
& 'E:\ClaudeTemp\ge-editor-evidence\windows\GlobalEmpiresEditor.exe' -geMission 'E:\caminho\mission.gemission'
```

`-geProject <pasta>` abre um projeto existente. Uma sessão `.gesession` é retomada pelo menu Arquivo, usando suas fontes congeladas; editar o projeto atual não altera o conteúdo desse save.

## Automação sem computer use

O servidor MCP stdio usa a mesma biblioteca de operações, histórico e validação da interface. Não é um servidor de leitura apenas: alterações são limitadas ao projeto informado na inicialização.

```powershell
dotnet build sim/dotnet/GE.Editor.Cli/GE.Editor.Cli.csproj --configuration Release
dotnet sim/dotnet/GE.Editor.Cli/bin/Release/net8.0/GE.Editor.Cli.dll create E:\ProjetosGE\Escolta --example
dotnet sim/dotnet/GE.Editor.Cli/bin/Release/net8.0/GE.Editor.Cli.dll validate E:\ProjetosGE\Escolta
dotnet sim/dotnet/GE.Editor.Cli/bin/Release/net8.0/GE.Editor.Cli.dll serve E:\ProjetosGE\Escolta
```

Exemplo de configuração MCP a ser usado pelo cliente autorizado (não foi instalado globalmente nesta etapa):

```json
{
  "mcpServers": {
    "ge-editor": {
      "command": "dotnet",
      "args": [
        "E:\\ClaudeTemp\\ge-editor\\sim\\dotnet\\GE.Editor.Cli\\bin\\Release\\net8.0\\GE.Editor.Cli.dll",
        "serve",
        "E:\\ProjetosGE\\Escolta"
      ]
    }
  }
}
```

As 19 ferramentas cobrem estado/leitura, lote com revisão esperada, colocação validada, pintura, undo/redo, salvar/recuperação, conflitos/conciliação, iniciar/avançar/inspecionar teste, comandos, pular, missão, sessão e diagnóstico. `editor_edit` pode gravar rascunhos; `editor_place` recusa área inválida atomicamente. Operações desatualizadas são recusadas pela revisão esperada.

Os formatos são experimentais: projeto de autoria v2, pacote v1, estado v44 e replay REP5. Versões incompatíveis são recusadas e os arquivos anteriores permanecem preservados. Não há conversão automática nem execução de C# autoral nesta entrega.

## Aceite ainda necessário

A prova técnica de testes, exportação e retomada não substitui o ciclo humano ED86: criar/editar, salvar/reabrir, testar e jogar a exportação sem escrever C#. A interface ainda precisa de verificação visual; capturas ocultas não demonstraram o layout. CI e revisões exigidas pelo `AGENTS.md` permanecem pendentes.
