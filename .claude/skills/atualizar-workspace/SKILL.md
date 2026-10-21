---
name: atualizar-workspace
description: Update a game project's card in the Mr. Mak Workspace (Global Empires, Blended, Mashup, Lightkeeper, Ritualistic) after a delivery, merge, review round, playtest, decision or new asset, through the shared card engine and without letting the card grow.
---

# Update a Workspace project card

Every project card is built by the shared engine in
`E:\MrMak\Mak\workspace\_shared\engine\` from JSON files in the card folder.
The data contract for each tab is in `E:\MrMak\Mak\docs\workspace-template.md`
("Arquitetura do motor") and at the top of each `modulos/<name>.mjs`.

First read the project's sheet in [references/](references/). It gives the
card folder, the game repository, where each tab's data comes from and what
is special about that project:

| Project | Sheet |
|---|---|
| Global Empires | [global-empires.md](references/global-empires.md) |
| Blended | [blended.md](references/blended.md) |
| Mashup | [mashup.md](references/mashup.md) |
| Lightkeeper | [lightkeeper.md](references/lightkeeper.md) |
| Ritualistic | [ritualistic.md](references/ritualistic.md) |

## Rules

- Edit only the JSON files and `media/`. Every `.html` is generated ("Gerado —
  não edite à mão") except a hand-written page of a `livre` tab, which its
  sheet names.
- Card content stays in Brazilian Portuguese (a recorded exception to the
  English default of the Workspace).
- Only the project's coordinator writes in the card; other bots hand their
  delivery to it.
- No links except to PDF files; PR and commit numbers go in `refs` as text.
  No base64 media and no heavy originals: WebP previews up to 150 KB, GLB up
  to 3 MB, with the original path recorded.
- The engine writes the card's `updated`, `steps`, `cover`, `progress` and
  `phase` in `workspace/workspace.json`. Do not edit those fields by hand.
- The Painel holds the state of now and fits one screen: rewrite it, never
  append history. Numbers the engine can compute use references such as
  `@roteiro.progresso`, `@entregas.total`, `@decisoes.pendentes`,
  `@playtest.abertos` or `@riscos.abertos` (full list in
  `nucleo/calculos.mjs`).
- Media that is orphaned or replaced is moved to
  `E:\Backups\Workspace\<card id>\` by the media check, never deleted.

## What changes on each event

| Event | Files |
|---|---|
| Delivery reached the main branch | Append to `entregas.json` (one entry per delivery, not per commit, at the end of the list); mark the task `feito` in `roteiro.json`; rewrite `painel.json` |
| PR opened or a review round opened or closed | The existing entry's `estado`, `olhar` or `refs`; the task `em-andamento`; `painel.json`. Change the entry when the state changes instead of adding another |
| Phase or milestone closed | In `roteiro.json` the phase becomes `feita` and the next one `atual`, with its tasks |
| Playtest opened, updated or closed | `playtest.json`: only the iteration with `"aberta": true` is shown. On close set `"aberta": false` (it moves to the Arquivo tab), record its summary as a delivery and open the next one. Add the Playtest tab to `projeto.json` the first time a project is tested |
| Decision made or changed | `decisoes.json`, through the project's collector or by hand as the sheet says. A decision that replaces another replaces the item; pending ones also go to `espera` |
| New or changed asset | `acervo.json`: a new version raises `versao` and moves the previous one to `historico`; names follow `media/<categoria>/<familia>/<item>-vNN[-vista].webp` |

Delivery fields: `id`, `data`, `area` (one of the project's areas in
`projeto.json`), `titulo`, `resumo` (up to 280 characters), `olhar`
(optional), `estado` (one of `estadosEntrega`), `refs`, `miniaturas`.
Deliveries older than `janelaDias` (30) move to the Arquivo tab by themselves.

## Steps

Run from `E:\MrMak\Mak`.

1. For a project with a collector (see its sheet), run the collector first. It
   rewrites the collected files and keeps texts already written by hand.
2. Edit the JSON files the event changes (table above) and save them as UTF-8.
3. Validate and generate:
   `node workspace/_shared/engine/gerar.mjs workspace/<card folder> --verificar`,
   then the same command without `--verificar`. Fix errors in the JSON; never
   work around the validation.
4. Check the media:
   `node workspace/_shared/engine/conferir-media.mjs workspace/<card folder>`
   must end with "tudo em ordem". `--limpar` shows what would move to the
   backup and `--limpar --confirmar` moves it.
5. Open the changed tabs at 390, 768 and 1280 px, in light and dark (the
   Global Empires theme is always dark). Report what you checked and what you
   could not check.

## A new project card

Create `workspace/AAAA-MM-DD_<id>/` with `projeto.json` and `painel.json`
(the contract is in `docs/workspace-template.md`), add one entry to
`workspace/workspace.json` (`id`, `title`, `description`, `type: "group"`,
`category`, `created`, `folder`, `status: "active"`, `pinned`), run the engine,
and add a sheet in `references/` plus its row in the table above. Keep the
sheet short: paths, sources per tab, commands and what differs from this
skill.

## Do not

- Create a new card for a round, a phase or a bot: everything fits the tabs.
- Keep history in the Painel, Playtest or Decisões; an old asset version goes
  to `historico`, not to a new item.
- Commit, push, stash or check out in `E:\MrMak\Mak` unless the user asks:
  other sessions share the working tree.
- Restart the Workspace app or stop agent sessions because of a card.
