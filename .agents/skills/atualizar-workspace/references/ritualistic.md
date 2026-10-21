# Ritualistic

- **Card:** `workspace/2026-10-17_ritualistic/` (id `ritualistic`).
- **Repository:** `E:\Claude Projects\Ritualistic`. Follow its `CLAUDE.md`; its `AGENTS.md` points to
  `E:\Codex Projects\Ritualistic`, which does not exist.
- **Tabs:** Painel, Roteiro, Entregas, Playtest, Pipeline, Decisões, Arquivo.

## Collector

`node workspace/_shared/engine/coletores/ritualistic.mjs "E:/Claude Projects/Ritualistic" workspace/2026-10-17_ritualistic`

It only reads the game repository and writes:

- `roteiro.json`: phases 0 to 13 of `Docs/Plan.md`; a phase is done when a `slice-f*` tag names it;
- `entregas.json`: one entry per tagged phase (thumbnails from `Docs/Progress/F<N>`) and one per day of commits after
  the tags;
- `playtest.json`: one finding per commit that cites PT codes (ranges expanded); cited in a commit means fixed;
  grouped by day, the newest iteration open;
- `decisoes.json`: the "Decisões técnicas" table of `Plan.md` and the DD codes cited in commits;
- `pipeline.json`: concept, Meshy, Blender and Unreal for the armours, creatures and the player, by whether the
  files exist on disk (uncommitted work counts; "feito" means the file exists, not that it was approved).

## After each run

Commits are in English. Rewrite in Portuguese the `titulo` and `resumo` of new deliveries (summary up to 280
characters), the `titulo` of new findings and of new DD decisions. The collector keeps those texts on later runs.
To close the open playtest iteration set `"aberta": false`; the collector respects it. New findings should go to
`docs/playtests/` in the game repository; once that folder exists the collector has to read it.
