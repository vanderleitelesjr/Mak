# Gothic 2D Platformer - Implementation Plan

**Project:** Cursed Knight - A gothic 2D platformer in Godot 4
**Scope:** 3 linear levels + multi-phase cathedral guardian boss
**Target:** 30-45 min speedrun, 2-3 hours first play
**Style:** 16-bit pixel art (320x180), Dark Souls/Blasphemous religious grotesque aesthetic

---

## Decisions Summary

| Category | Decision |
|----------|----------|
| Engine | Godot 4 (GDScript) |
| Platform | Desktop (Win/Linux/macOS) |
| Resolution | 320x180 base, integer-scaled |
| Protagonist | Cursed knight: run, jump, double-jump, dash (i-frames), sword, parry |
| Enemies | 4 types: Grunt, Armored, Flyer, Projectile |
| Levels | Linear: Level 1 → Level 2 → Boss Level |
| Boss | Gothic Cathedral Guardian (3 phases) |
| Art | AI-generated (fal.ai) + cleanup pass |
| Audio | Free libraries (Freesound, Kenney) + custom SFX |
| Save | Auto-save at level start + checkpoint flags |
| Difficulty | Fair but demanding (Hollow Knight/Celeste) |
| Polish | Screenshake, hit pause, particles, parallax, weather, post-processing, animated UI |

---

## Phase 1: Project Setup & Core Systems (Week 1)

### 1.1 Godot Project Initialization
- [ ] Create Godot 4 project at `projects/gothic-platformer/`
- [ ] Configure project settings: 320x180 viewport, integer scaling, pixel snap
- [ ] Set up input map: move_left, move_right, jump, dash, attack, parry
- [ ] Create autoload singletons: `GameManager`, `AudioManager`, `SaveManager`

### 1.2 Player Character Controller
- [ ] KinematicCharacter2D with state machine (Idle, Run, Jump, Fall, Dash, Attack, Parry, Hurt, Death)
- [ ] Movement: acceleration/deceleration, coyote time, jump buffering
- [ ] Double-jump with visual feedback
- [ ] Dash: directional, i-frames, cooldown, dust particles
- [ ] Sword attack: committed animation, hitbox, cancel window into parry
- [ ] Parry: tight window (8-10 frames), perfect parry = no knockback + riposte, partial = reduced damage
- [ ] Health system (5-6 HP), knockback, invincibility frames

**Verification:** Player moves fluidly, dash feels responsive, parry window is learnable but tight

### 1.3 Camera & Level Framework
- [ ] Camera2D with smooth follow, deadzone, screenshake support
- [ ] Level scene template: TileMap (collision + visual layers), spawn point, checkpoint flags
- [ ] Scene transition system (fade in/out, level load/unload)
- [ ] Auto-save at level start + checkpoint interaction

**Verification:** Camera follows smoothly, transitions work, save/load persists position and state

---

## Phase 2: Combat & Enemy Systems (Week 2)

### 2.1 Enemy Base & Types
- [ ] Base `Enemy` class: state machine, patrol/chase/attack, hurt/death, knockback
- [ ] **Grunt**: Melee, walks back/forth, charges on sight, 2 HP
- [ ] **Armored**: Slow, high HP (5), shield blocks frontal attacks, vulnerable from behind/dash-through
- [ ] **Flyer**: Patrols air, swoops down, 1 HP, dies to parry/anti-air
- [ ] **Projectile**: Stationary or slow walk, fires arc/projectile, 2 HP

### 2.2 Combat Feedback
- [ ] Hit pause (8-12 frames on hit)
- [ ] Screenshake (magnitude by attack strength)
- [ ] Hit particles (blood/spark), death effects
- [ ] Hit flash shader (white flash on damage)
- [ ] Knockback direction based on attack

**Verification:** Each enemy type has distinct behavior, combat feels weighty, parry is rewarding

### 2.3 Damage Numbers & UI
- [ ] Floating damage numbers (player/enemy)
- [ ] Health bars for enemies (boss only) and player (persistent UI)
- [ ] Stamina/dash cooldown indicator

---

## Phase 3: Level 1 - Cathedral Approach (Week 3)

### 3.1 Level Design
- [ ] Layout: Outdoor cathedral grounds → cloister → bell tower
- [ ] Length: ~8-10 minutes first play
- [ ] Checkpoints: 3-4 flags
- [ ] Enemy placement: Intro grunts → mixed groups → armored introduction

### 3.2 Environment Art (AI + Cleanup)
- [ ] Tilesets: Stone bricks, gothic arches, stained glass windows, grass/cobble
- [ ] Props: Statues, candles, debris, fences, gates
- [ ] Parallax layers: Sky, distant spires, mid-ground architecture, foreground foliage
- [ ] Weather: Light fog, occasional rain particles

### 3.3 Polish
- [ ] Ambient sound: Wind, distant bells, footsteps
- [ ] Lighting: Global modulate + light occluders for torch/candle glow
- [ ] Post-process: CRT shader, vignette, color grading (muted golds/reds)

**Verification:** Level plays start-to-finish, checkpoints save, difficulty ramps fairly

---

## Phase 4: Level 2 - Crypts Below (Week 4)

### 4.1 Level Design
- [ ] Layout: Catacombs → flooded crypt → ossuary → vertical climb
- [ ] Length: ~10-12 minutes first play
- [ ] Checkpoints: 3-4 flags
- [ ] New mechanics: Water sections (slowed movement), spike traps, falling platforms
- [ ] Enemy placement: Flyers introduced, projectile enemies, armored in tight corridors

### 4.2 Environment Art
- [ ] Tilesets: Bone walls, mossy stone, water, chains, coffins
- [ ] Parallax: Deep darkness, bioluminescent fungi, dripping water
- [ ] Weather: Heavy fog, water drips, particle motes

### 4.3 Mid-Boss (Optional)
- [ ] Mini-boss: Animated Sarcophagus (teaches multi-phase pattern)

**Verification:** Level introduces new mechanics naturally, difficulty steps up, atmosphere distinct from Level 1

---

## Phase 5: Level 3 - Cathedral Guardian Boss (Week 5)

### 5.1 Boss Design: Cathedral Guardian
**Phase 1 - Stone Sentinel (Grounded)**
- Slow walk, overhead slam (telegraphed, parryable), shockwave
- Summons 2 grunts at 60% HP
- Transitions at 40% HP

**Phase 2 - Awakened (Faster, Aerial)**
- Dash attacks (parryable), wing gust pushback
- Stained glass projectile rain (pattern-memorization)
- Transitions at 15% HP

**Phase 3 - Desperation (Enraged)**
- Speed up, combo attacks, arena hazards (falling debris)
- Final parry window for execution cinematic

### 5.2 Boss Arena
- [ ] Multi-tier arena with platforms
- [ ] Visual progression: Intact → Cracked → Ruined
- [ ] Music shift per phase (handled via AudioManager)

### 5.3 Boss Polish
- [ ] Health bar with phase markers
- [ ] Screen-wide effects on phase transitions
- [ ] Death sequence: Slow-mo, particle burst, cathedral collapse cutscene (static images)

**Verification:** Boss is challenging but fair, each phase teaches new pattern, execution feels earned

---

## Phase 6: Polish & Systems Completion (Week 6)

### 6.1 Visual Polish
- [ ] Parallax system with 4-5 layers per level
- [ ] Weather system: Rain, fog, snow (per level config)
- [ ] Post-processing stack: CRT, vignette, bloom, color grading
- [ ] Particle systems: Dust, blood, magic, debris, weather
- [ ] Animated UI: Health pips, dash icon, menu transitions

### 6.2 Audio Polish
- [ ] Music tracks: Level 1, Level 2, Boss (3 phases)
- [ ] SFX set: Player (footsteps, dash, attack, parry, hurt, death), Enemies, Environment, UI
- [ ] Dynamic volume: Duck music on pause, boss music intensity

### 6.3 Menus & Flow
- [ ] Main menu: New Game, Continue, Options, Quit
- [ ] Pause menu: Resume, Restart Checkpoint, Restart Level, Quit
- [ ] Options: Volume, fullscreen, vsync, key rebind
- [ ] Game over / Victory screens

### 6.4 Quality of Life
- [ ] Coyote time + jump buffer tuning
- [ ] Input buffering for dash/attack
- [ ] Accessibility: Flash toggle, screenshake slider, difficulty assists (optional)
- [ ] Credits screen

---

## Phase 7: Build & Delivery (Week 7)

### 7.1 Testing
- [ ] Full playthrough on all 3 desktop targets
- [ ] Verify saves work across sessions
- [ ] Check performance at 4K integer scaling
- [ ] Boss fight consistency test (10+ runs)

### 7.2 Builds
- [ ] Export templates: Windows (64-bit), Linux (x86_64), macOS (universal)
- [ ] Itch.io page preparation: Screenshots, GIFs, description
- [ ] Version 1.0 release

### 7.3 Post-Launch Buffer
- [ ] Hotfix window (1 week)
- [ ] Devlog / retrospective writeup

---

## Asset Generation Prompts (fal.ai)

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

---

## Technical Architecture

```
scenes/
  player/
    Player.tscn          # KinematicCharacter2D + state machine
    SwordHitbox.tscn     # Area2D, collision layer: enemy
    ParryHitbox.tscn     # Area2D, collision layer: enemy_projectile
  enemies/
    EnemyBase.gd         # Base class
    Grunt.tscn
    Armored.tscn
    Flyer.tscn
    Projectile.tscn
    Boss/
      Guardian.tscn      # Multi-phase state machine
      BossHealthBar.tscn
  levels/
    LevelTemplate.tscn   # TileMap, Camera2D, Checkpoints, Spawn
    Level1.tscn
    Level2.tscn
    BossLevel.tscn
  ui/
    HUD.tscn             # Health, dash cooldown
    PauseMenu.tscn
    MainMenu.tscn
    GameOver.tscn
    Victory.tscn
  systems/
    Camera.tscn          # Follow, screenshake, deadzone
    ParticlePool.tscn    # Reusable particle systems
    Weather.tscn         # Rain, fog, snow controllers

autoload/
  GameManager.gd         # Game state, level transitions, save/load
  AudioManager.gd        # Music, SFX, dynamic mixing
  SaveManager.gd         # JSON save/load, checkpoint data
  InputManager.gd        # Input buffering, rebind support
```

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| AI art inconsistency | Batch generate, single cleanup pass, reference sheet |
| Scope creep (polish) | Timebox each polish feature, cut if over |
| Boss difficulty tuning | Playtest early, expose tuning vars in inspector |
| Animation cancel bugs | State machine with explicit transitions, unit test states |
| Save/load edge cases | Test: mid-dash, mid-air, during boss, after death |

---

## Success Criteria

- [ ] All 3 levels playable start-to-finish
- [ ] Boss defeatable without damage (mastery possible)
- [ ] 60 FPS at 4K integer scale on 5-year-old hardware
- [ ] Save/load works across sessions and crashes
- [ ] Game feels "finished" not "prototype" - menus, pause, options, credits
- [ ] Total dev time ≤ 7 weeks (adjust scope if needed)

---

## Next Steps

1. Initialize Godot project and push to git
2. Build player controller (Phase 1.2) - highest risk, test feel first
3. Set up asset generation pipeline (fal.ai) in parallel
4. Proceed through phases sequentially

**Ready to start Phase 1?**