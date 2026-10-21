# Lightkeeper

- **Card:** `workspace/2026-10-17_lightkeeper/` (id `lightkeeper`).
- **Repository:** `E:\Claude Projects\Lightkeeper` (remote Lightkeeper-v3).
- **Tabs:** Painel, Roteiro, Entregas, Decisões, Acervo, Arquivo. Playtest and Riscos join when the repository has
  those records.

## Collector

`node workspace/_shared/engine/coletores/lightkeeper.mjs "E:/Claude Projects/Lightkeeper" workspace/2026-10-17_lightkeeper`

It only reads the game repository and writes:

- `roteiro.json`: the 11 levels of the README table; level 0 holds the 5 stages of "Estado da fatia jogável" and
  the editor tracks, one task per PR (`Editor de mapas, etapa N`, `Editor de modelos, etapa N`, `modo fácil (item N)`);
- `entregas.json`: one entry per merged PR (merge commit or squash `(#N)`);
- `acervo.json`: `Concepts/` (`category_name_view.png`, views of one name form one item), `Docs/Marco1/capturas`
  (extra category Capturas) and the newest version of each track in `Audio/Musica`; 480 px WebP thumbnails through
  Pillow (`py`);
- `decisoes.json`: the decision table of `Docs/EditorModelos_Especificacao.md` and the review rule of `AGENTS.md`.

Titles, summaries and `olhar` written by hand are kept on the next run. `painel.json` and `projeto.json` are
written by hand: version from `VERSION`, main commit from git.
