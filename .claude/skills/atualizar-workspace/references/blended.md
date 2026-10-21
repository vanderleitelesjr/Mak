# Blended

- **Card:** `workspace/2026-10-17_blended/` (id `blended`).
- **Repository:** `E:\MrMak\Blended` (`PLANO.md`, `DECISOES.md`, `PENDENCIAS.md`, `testes/capturas/`).
- **Tabs:** Painel, Roteiro, Entregas, Playtest, Decisões, Acervo, Arquivo.
- **Who updates:** the Blended Coordinator after a merge, a review round, a user decision or a test report.
- No collector: every JSON is written by hand. The old generator and its `blended.json` are in
  `E:\Backups\Workspace\blended\card-antigo\`.

## Sources per tab

| Tab | File | Notes |
|---|---|---|
| Roteiro | `roteiro.json` | M1 with the 16 tasks (`T1`…`T16`) and their dependencies; M2 to M4 future. A task is `feito` at merge, `em-andamento` in review, `a-fazer` when released, `bloqueado` while it waits for a dependency. `resumo` carries the note and `PR #N` |
| Pendências | `roteiro.json` | Open items of `PENDENCIAS.md` go in the `pendencias[]` of their source task (CI and infrastructure in T1, prefixed `CI:`) as `title · quando: ... · origem: ...`. After the Reviewer changes `PENDENCIAS.md`, update the lists and the "Pendências abertas" number in the Painel |
| Entregas | `entregas.json` | One entry per PR: `id` `pr-N-subject`, `titulo` `PR #N · ...`, `area` editor, ci or documentos, `estado` PR aberto or main, `refs` `PR #N` and `TN`, review rounds in `olhar` |
| Playtest | `playtest.json` | Iterations with achados `PT-AAAA-MM-DD-NN`; the summary says what was fixed and what is pending |
| Decisões | `decisoes.json` | By hand (`DECISOES.md` is a log without codes). Card codes per theme: PE, DS, PC, PT, ES, AU, TA, SG, EX, CB, IC, PV, RC; do not renumber |
| Acervo | `acervo.json` | Category `interface`; the family is the editor screen; Simples/Completo, themes and angles are views of the same item |

## Specific to this card

- **New capture:** a PNG from `testes/capturas/` becomes a 480 px WebP (Pillow, `quality=80`) named
  `media/interface/<family>/<item>-v01[-<view>].webp`. When a screen changes, add `-v02` and move the old version
  to `historico`. `original` is the PNG path in the repository.
- **Main commit for the Painel:** `git -C E:\MrMak\Blended rev-parse --short main`.
