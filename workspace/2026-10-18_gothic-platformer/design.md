# Cursed Knight: design and decisions

A gothic 2D platformer in Godot 4. Cursed knight with sword, dash, double-jump and parry fights through three linear levels to defeat a multi-phase Cathedral Guardian. 16-bit pixel art (320×180), Dark Souls/Blasphemous religious grotesque aesthetic.

**Status:** 16 individual choices confirmed on October 18, 2026. Interview closed. Implementation plan ready.

## Confirmed decisions

All entries below have status **Confirmed**, dated **2026-10-18**. The original question number and selected option are retained for traceability.

### Engine & Platform

- **CK-01 / 1A:** Godot 4 (GDScript) — free, open-source, great for 2D, lightweight export
- **CK-02 / 1A:** Desktop (Windows/Linux/macOS) — standard PC release, simplest deployment

### Visual Style & Protagonist

- **CK-03 / 1A:** Pixel art (16-bit / 320×180) — classic gothic feel, manageable asset scope
- **CK-04 / 2C:** Cursed knight (sword + dash) — melee focus, movement-heavy
  - Expanded in next round: run, jump, double-jump, dash (i-frames), sword, parry

### Core Mechanics

- **CK-05 / 1A:** Run, jump, double-jump, dash (invincible), sword swing, parry
  - Parry: tight window (8–10 frames), perfect = no knockback + riposte, partial = reduced damage
  - Dash: directional, i-frames, cooldown, dust particles
  - Movement: acceleration/deceleration, coyote time, jump buffering

### Enemies

- **CK-06 / 1A:** 3–4 types (grunt, armored, flyer, projectile) — manageable scope, clear roles
  - Grunt: melee, walks back/forth, charges on sight, 2 HP
  - Armored: slow, high HP (5), shield blocks frontal attacks, vulnerable from behind/dash-through
  - Flyer: patrols air, swoops down, 1 HP, dies to parry/anti-air
  - Projectile: stationary or slow walk, fires arc/projectile, 2 HP

### Level Structure

- **CK-07 / 1A:** Linear stages (Level 1 → Level 2 → Boss Level) — classic arcade flow
- **CK-08 / 1A:** Gothic cathedral guardian (multi-phase) — fits theme, clear phases, memorable fight

### Art & Audio Pipeline

- **CK-09 / 1A:** AI-generated (fal.ai/Midjourney) + cleanup pass — fast iteration, consistent style
- **CK-10 / 1A:** Free libraries (Freesound, Kenney) + simple SFX — zero cost, functional

### Progression & Scope

- **CK-11 / 1A:** Auto-save at level start + checkpoint flags — respects player time, simple
- **CK-12 / 2B:** 30–45 min speedrun, 2–3 hours first play — meatier, more content, risk managed

### Difficulty & Polish

- **CK-13 / 1A:** Fair but demanding (Hollow Knight / Celeste) — tight windows, clear telegraphs
- **CK-14 / 2B:** Screenshake, hit pause, particles, parallax, weather, post-processing, animations — atmosphere-heavy

### Aesthetic Direction

- **CK-15 / 2B:** Dark Souls / Blasphemous (religious grotesque) — penitence, gold/red palette, iconic silhouettes

### Architecture Principle

- **CK-16 / —:** Extensible architecture for future expansion beyond 3 levels — modular scenes, data-driven level config, plugin-ready systems

## Proposed operating flow

1. **Phase 1 (Week 1):** Godot project setup, player controller (state machine), camera, save system
2. **Phase 2 (Week 2):** Enemy base class + 4 types, combat feedback (hit pause, screenshake, particles)
3. **Phase 3 (Week 3):** Level 1 — Cathedral Approach (outdoor → cloister → bell tower)
4. **Phase 4 (Week 4):** Level 2 — Crypts Below (catacombs → flooded crypt → ossuary → vertical climb)
5. **Phase 5 (Week 5):** Boss Level — Cathedral Guardian (3 phases, evolving arena)
6. **Phase 6 (Week 6):** Polish — parallax, weather, post-process, menus, music, QoL
7. **Phase 7 (Week 7):** Build, test, export, itch.io page, v1.0 release

## Technical architecture (extensible by design)

```
scenes/
  player/
    Player.tscn              # KinematicCharacter2D + state machine (extensible states)
    SwordHitbox.tscn         # Area2D, collision layer: enemy
    ParryHitbox.tscn         # Area2D, collision layer: enemy_projectile
  enemies/
    EnemyBase.gd             # Abstract base — new types inherit, configure via Resource
    Grunt.tscn
    Armored.tscn
    Flyer.tscn
    Projectile.tscn
    Boss/
      Guardian.tscn          # Multi-phase state machine, phase data in Resource
      BossHealthBar.tscn
  levels/
    LevelTemplate.tscn       # TileMap, Camera2D, Checkpoints, Spawn — all levels inherit
    Level1.tscn
    Level2.tscn
    BossLevel.tscn
    LevelData.tres           # Resource: level config (enemy spawns, checkpoints, music, parallax)
  ui/
    HUD.tscn
    PauseMenu.tscn
    MainMenu.tscn
    GameOver.tscn
    Victory.tscn
  systems/
    Camera.tscn              # Follow, screenshake, deadzone, cinematic zones
    ParticlePool.tscn        # Reusable particle systems (object pooling)
    Weather.tscn             # Rain, fog, snow controllers (per-level config)
autoload/
  GameManager.gd             # Game state, level transitions, save/load
  AudioManager.gd            # Music, SFX, dynamic mixing
  SaveManager.gd             # JSON save/load, checkpoint data
  InputManager.gd            # Input buffering, rebind support
  LevelRegistry.gd           # Data-driven level list — add levels without code changes
```

## Extensibility anchors

| Extension Point | Mechanism |
|-----------------|-----------|
| New levels | Add `LevelData.tres` + scene, register in `LevelRegistry` — no code changes |
| New enemy types | Inherit `EnemyBase`, configure via `EnemyData` Resource, add to spawn tables |
| New player abilities | Add state to `PlayerStateMachine`, expose via `AbilityData` Resource |
| New boss phases | Phase data in `BossPhaseData` Resource, state machine handles transitions |
| New weather/parallax | Configure per-level in `LevelData`, `Weather`/`Camera` systems read it |
| New power-ups | `PickupData` Resource, `PickupManager` handles effects via event bus |

## Asset generation prompts (fal.ai)

### Tilesets
- `gothic cathedral stone tileset, 16-bit pixel art, 16x16 tiles, dark fantasy, religious grotesque, muted gold and crimson accents, Blasphemous style`
- `crypt bone tileset, 16-bit pixel art, 16x16, mossy skulls, chains, dripping water, green-blue palette`
- `cathedral interior tileset, stained glass windows, stone pillars, candlelight, gothic architecture`

### Characters
- `cursed knight sprite sheet, 16-bit, 32x32, tattered cape, rusted sword, glowing runes, Dark Souls aesthetic, idle/run/jump/dash/attack/parry/hurt/death animations`
- `grunt enemy, hollow armor, 16-bit, 24x32, spear, idle/patrol/charge/hurt/death`
- `armored knight, great shield, 16-bit, 32x48, slow, shield block, vulnerable back`
- `flyer enemy, gargoyle, 16-bit, 24x24, wings, swoop, idle/patrol/swoop/hurt/death`
- `projectile enemy, stationary caster, 16-bit, 24x32, staff, cast/attack/hurt/death`
- `cathedral guardian boss, massive stone statue, 16-bit, 96x128, 3 phases: intact/cracked/glowing runes, wings unfold phase 2`

### Effects
- `blood particle, pixel art, red, various sizes`
- `dash dust, pixel art, gray-white`
- `parry spark, gold-white, sharp`
- `hit pause flash, white`
- `rain/fog/snow overlays, seamless looping`

## Risk mitigation

| Risk | Mitigation |
|------|------------|
| AI art inconsistency | Batch generate, single cleanup pass, reference sheet |
| Scope creep (polish) | Timebox each polish feature, cut if over |
| Boss difficulty tuning | Playtest early, expose tuning vars in inspector |
| Animation cancel bugs | State machine with explicit transitions, unit test states |
| Save/load edge cases | Test: mid-dash, mid-air, during boss, after death |
| Architecture rigidity | All config in Resources, systems read data not code |

## Success criteria

- [ ] All 3 levels playable start-to-finish
- [ ] Boss defeatable without damage (mastery possible)
- [ ] 60 FPS at 4K integer scale on 5-year-old hardware
- [ ] Save/load works across sessions and crashes
- [ ] Game feels "finished" not "prototype" — menus, pause, options, credits
- [ ] Total dev time ≤ 7 weeks (adjust scope if needed)
- [ ] New level/enemy/ability can be added in < 1 day without touching core systems

## Next step

Proceed to Phase 1 implementation: Godot project initialization and player controller.