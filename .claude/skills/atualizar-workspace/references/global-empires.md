# Global Empires

- **Card:** `workspace/2026-10-14_global-empires/` (id `global-empires`).
- **Game repository:** `E:\Claude Projects\GlobalEmpires\GE-game`.
- **Tabs:** Painel, Roteiro, Editor, Entregas, Playtest, Mapa, Decisões, Acervo, Arquivo.
- **Who updates:** the coordinator calls this skill from `coordenador-entregas`. A PostToolUse hook in
  `E:\Claude Projects\GlobalEmpires\.claude\hooks\lembrete-workspace.mjs` (and the `.codex` copy) reminds the bot
  after a `git merge` or `git commit` in the main GE-game checkout.

## Sources per tab

| Tab | File | Notes |
|---|---|---|
| Roteiro | `roteiro.json` | Eras, milestones and iterations; one phase `atual` |
| Editor, Mapa | `editor.json`, `mapa.json` | `livre` tabs. The page bodies `editor-corpo.html` and `mapa-corpo.html` are hand-written by the editor and map sessions; the Editor card itself is `workspace/2026-10-21_global-empires-editor/` |
| Entregas | `entregas.json` | `area`: código, arte, áudio, design, playtest, ferramentas. `estado`: main, main local, branch local, PR aberto |
| Decisões | `decisoes.json` | Collected from `GE-game/docs/specs/decisoes.md`. By hand only `coletor.agrupamento` (theme, code prefixes, "what holds today" summary) and `notas` |
| Acervo | `acervo.json` | Extra category `civilizacoes` |

Decisions collector:
`node workspace/_shared/engine/coletores/decisoes-md.mjs "E:/Claude Projects/GlobalEmpires/GE-game/docs/specs/decisoes.md" workspace/2026-10-14_global-empires/decisoes.json`.
If it warns about a prefix without a theme, add the prefix to a theme in `coletor.agrupamento` and run it again.

## Specific to this card

- **Theme:** its own dark theme (`"tema": "custom"`, `tema.css`, taken from the game HUD: dark green, gold,
  parchment). The theme and cover change only when the user asks. Area and number icons are names drawn from
  `media/tema/icone-*.webp`; a new icon is cut from `icones_hud.png` and gets a `.mk-i-<name>` rule in `tema.css`.
- **Delivery thumbnails:** WebP up to 480 px, `quality=72`, in `media/AAAA-MM/`.
- **3D models (approved and on main only):** convert with the Blender on D: without the interface:
  `"D:\Program Files\Blender Foundation\Blender 5.2\blender.exe" -b --python-exit-code 1 --python para_glb.py -- <fbx> <out>.glb [<color>.png] [<normal>.png]`
  (LOD0 only, 1K JPEG textures, up to 3 MB) and put it in the item's `modelo3d`.
- **Audio:** game OGG at 96 kbps; effects in WAV, one variation per sound.
- **PDF links** point to `https://github.com/vanderleitelesjr/GE-game/blob/main/<file>.pdf`.
- **Full review on request:** in the card folder, `node verificar.mjs` lists what changed since the last review
  (main commits, art, models, music, decisions, project memories). Update the right JSON for each change, run the
  engine and the media check, then `node verificar.mjs --registrar` to save the new starting point in
  `varredura.json`.
