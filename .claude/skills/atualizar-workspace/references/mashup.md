# Mashup

- **Card:** `workspace/2026-10-17_mashup/` (id `mashup`).
- **Repository:** `E:\Claude Projects\Mashup` (`PLANO.md`, `DECISOES.md`, `PENDENCIAS.md`, `docs/criterios/`,
  `docs/pesquisa/`, `docs/playtests/`). No remote.
- **Tabs:** Painel, Roteiro, Entregas, Playtest, Decisões, Riscos, Métricas, Arquivo.
- No collector: every JSON is written by hand.

## Sources per tab

| Tab | File | Notes |
|---|---|---|
| Roteiro | `roteiro.json` | Phases F0 to F13 of `PLANO.md`; tasks of the current phase. A new phase becomes `atual` with its tasks listed |
| Entregas | `entregas.json` | `id` `AAAA-MM-DD-subject`; `area` código, ensaio, design, arte, áudio, playtest, ferramentas; `estado` main, branch, em revisão. Every delivery with a visible result gets screenshots, with no limit (WebP 480 px, `quality=72`, in `media/AAAA-MM/`) |
| Playtest | `playtest.json` | Mirrors `docs/playtests/`; one open iteration at a time |
| Decisões | `decisoes.json` | By hand (`DECISOES.md` is a log). Card codes per theme: PJ, PR, MV, RD, VD, JG, MX; do not renumber. Pending decisions of `PENDENCIAS.md` enter as `Pendente`; what the user must review also goes to `espera` |
| Riscos | `riscos.json` | Mirrors the Riscos section of `PENDENCIAS.md`. A closed risk stays with `estado: "fechado"` and the date in its text. `fase` is the first phase that handles it. Severity is assigned in the card and the user may correct it |
| Métricas | `metricas.json` | Packaged-build values per milestone, with the target beside it (`sentido` maior or menor). A new measurement is a new milestone; keep the old ones |
