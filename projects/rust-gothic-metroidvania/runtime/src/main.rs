use anyhow::{Context, Result, ensure};
use gilrs::{Axis, Button, Gilrs};
use rusted_proof::{
    assets::Assets,
    render::{Renderer, ViewMode},
    world::{Actions, STEP, World},
};
use std::{
    collections::HashSet,
    path::{Path, PathBuf},
    sync::Arc,
    time::Instant,
};
use winit::{
    application::ApplicationHandler,
    event::{ElementState, MouseButton, WindowEvent},
    event_loop::{ActiveEventLoop, ControlFlow, EventLoop},
    keyboard::{KeyCode, PhysicalKey},
    window::{Window, WindowId},
};

fn main() -> Result<()> {
    let args: Vec<String> = std::env::args().skip(1).collect();
    let mut root = std::env::current_exe()?
        .parent()
        .context("executable directory")?
        .join("assets");
    if !root.is_dir() {
        root = Path::new(env!("CARGO_MANIFEST_DIR")).join("assets");
    }
    let mut verify = None;
    let mut smoke = None;
    let mut index = 0;
    while index < args.len() {
        let value = || args.get(index + 1).context("option requires a path");
        match args[index].as_str() {
            "--assets" => {
                root = PathBuf::from(value()?);
                index += 2;
            }
            "--verify" => {
                verify = Some(PathBuf::from(value()?));
                index += 2;
            }
            "--smoke" => {
                smoke = Some(PathBuf::from(value()?));
                index += 2;
            }
            "--help" => {
                println!(
                    "Rusted rendering/runtime proof\n--assets PATH  asset directory\n--verify PATH  bounded GPU replay and evidence (no physical input)\n--smoke PATH   bounded native-window startup and capture\nControls: A/D or arrows; Space/right mouse or controller South to jump; L lights; N normals; F5 reload graph; Esc exit."
                );
                return Ok(());
            }
            other => anyhow::bail!("unknown argument {other}"),
        }
    }
    ensure!(
        verify.is_none() || smoke.is_none(),
        "choose --verify or --smoke"
    );
    let assets = Assets::load(&root)?;
    if let Some(output) = verify {
        return verify_gpu(&assets, &output);
    }
    let event_loop = EventLoop::new()?;
    event_loop.set_control_flow(ControlFlow::Poll);
    let world = World::new(assets.room.clone());
    let mut app = App {
        assets,
        world,
        renderer: None,
        window: None,
        input: Input::new(),
        lights: true,
        normals: false,
        last: Instant::now(),
        accumulator: 0.,
        frames: 0,
        smoke,
        error: None,
    };
    event_loop.run_app(&mut app)?;
    if let Some(error) = app.error {
        anyhow::bail!(error);
    }
    Ok(())
}

struct Input {
    held: HashSet<KeyCode>,
    mouse_jump: bool,
    jump_latched: bool,
    pad_was_down: bool,
    gilrs: Option<Gilrs>,
    focused: bool,
}
impl Input {
    fn new() -> Self {
        let gilrs = match Gilrs::new() {
            Ok(g) => Some(g),
            Err(e) => {
                eprintln!("Controller backend unavailable: {e}");
                None
            }
        };
        Self {
            held: HashSet::new(),
            mouse_jump: false,
            jump_latched: false,
            pad_was_down: false,
            gilrs,
            focused: true,
        }
    }
    fn sample(&mut self) -> Actions {
        let mut axis = 0.;
        let mut pad_down = false;
        if let Some(gilrs) = &mut self.gilrs {
            while gilrs.next_event().is_some() {}
            for (_, pad) in gilrs.gamepads() {
                if !pad.is_connected() {
                    continue;
                }
                let x = pad.value(Axis::LeftStickX);
                if x.is_finite() && x.abs() > 0.18 {
                    axis = x;
                }
                if pad.is_pressed(Button::DPadLeft) {
                    axis = -1.;
                }
                if pad.is_pressed(Button::DPadRight) {
                    axis = 1.;
                }
                pad_down |= pad.is_pressed(Button::South);
            }
        }
        self.jump_latched |= pad_down && !self.pad_was_down;
        let jump = self.jump_latched;
        self.pad_was_down = pad_down;
        if !self.focused {
            self.jump_latched = false;
            return Actions::default();
        }
        let left = self.held.contains(&KeyCode::KeyA) || self.held.contains(&KeyCode::ArrowLeft);
        let right = self.held.contains(&KeyCode::KeyD) || self.held.contains(&KeyCode::ArrowRight);
        if left || right {
            axis = right as u8 as f32 - left as u8 as f32;
        }
        Actions {
            horizontal: axis.clamp(-1., 1.),
            jump_pressed: jump,
        }
    }
}

struct App {
    assets: Assets,
    world: World,
    renderer: Option<Renderer>,
    window: Option<Arc<Window>>,
    input: Input,
    lights: bool,
    normals: bool,
    last: Instant,
    accumulator: f32,
    frames: u32,
    smoke: Option<PathBuf>,
    error: Option<String>,
}
impl App {
    fn fail(&mut self, event_loop: &ActiveEventLoop, error: impl std::fmt::Display) {
        self.error = Some(error.to_string());
        event_loop.exit();
    }
    fn reload_graph(&mut self) {
        let result = (|| -> Result<_> {
            let path = self.assets.root.join("movement.json");
            let graph: rusted_proof::graph::Graph = serde_json::from_slice(&std::fs::read(path)?)?;
            graph.validate(&self.assets.sprite.clips.keys().cloned().collect())?;
            Ok(graph.compile())
        })();
        match result {
            Ok(graph) => {
                self.assets.graph = graph;
                eprintln!("Movement graph reloaded");
            }
            Err(e) => {
                eprintln!("Graph reload rejected; keeping running graph: {e:#}");
            }
        }
    }
}
impl ApplicationHandler for App {
    fn resumed(&mut self, event_loop: &ActiveEventLoop) {
        if self.window.is_some() {
            return;
        }
        let result = (|| -> Result<_> {
            let window = Arc::new(
                event_loop.create_window(
                    Window::default_attributes()
                        .with_title("Rusted / first rendering proof")
                        .with_inner_size(winit::dpi::PhysicalSize::new(1280, 720)),
                )?,
            );
            let size = window.inner_size();
            let renderer = pollster::block_on(Renderer::new(
                Some(window.clone()),
                &self.assets,
                size.width.max(1),
                size.height.max(1),
            ))?;
            println!(
                "GPU: {} / {:?}",
                renderer.adapter_info.name, renderer.adapter_info.backend
            );
            Ok((window, renderer))
        })();
        match result {
            Ok((window, renderer)) => {
                self.window = Some(window);
                self.renderer = Some(renderer);
                self.last = Instant::now();
            }
            Err(e) => self.fail(event_loop, format!("{e:#}")),
        }
    }
    fn window_event(&mut self, event_loop: &ActiveEventLoop, _id: WindowId, event: WindowEvent) {
        match event {
            WindowEvent::CloseRequested => event_loop.exit(),
            WindowEvent::Focused(focused) => {
                self.input.focused = focused;
                if !focused {
                    self.input.held.clear();
                    self.input.jump_latched = false;
                    self.input.mouse_jump = false;
                }
            }
            WindowEvent::Resized(size) => {
                if let Some(r) = &mut self.renderer {
                    r.resize(size.width, size.height);
                }
            }
            WindowEvent::KeyboardInput { event, .. } => {
                if let PhysicalKey::Code(key) = event.physical_key {
                    if event.state == ElementState::Pressed {
                        if self.input.held.insert(key) && !event.repeat {
                            match key {
                                KeyCode::Escape => event_loop.exit(),
                                KeyCode::Space => self.input.jump_latched = true,
                                KeyCode::KeyL => self.lights = !self.lights,
                                KeyCode::KeyN => self.normals = !self.normals,
                                KeyCode::F5 => self.reload_graph(),
                                _ => {}
                            }
                        }
                    } else {
                        self.input.held.remove(&key);
                    }
                }
            }
            WindowEvent::MouseInput {
                state,
                button: MouseButton::Right,
                ..
            } => {
                let down = state == ElementState::Pressed;
                if down && !self.input.mouse_jump {
                    self.input.jump_latched = true;
                }
                self.input.mouse_jump = down;
            }
            WindowEvent::RedrawRequested => {
                let now = Instant::now();
                let dt = (now - self.last).as_secs_f32().min(0.1);
                self.last = now;
                self.accumulator += dt;
                let mut actions = self.input.sample();
                // Smoke input is explicit and never enters a physical device state.
                if self.smoke.is_some() {
                    actions = Actions {
                        horizontal: if self.frames < 75 { 1. } else { 0. },
                        jump_pressed: self.frames == 30,
                    };
                }
                while self.accumulator >= STEP {
                    if let Err(e) = self.world.step(&self.assets.graph, actions) {
                        self.fail(event_loop, e);
                        return;
                    }
                    actions.jump_pressed = false;
                    self.input.jump_latched = false;
                    self.accumulator -= STEP;
                }
                let Some(renderer) = &self.renderer else {
                    return;
                };
                renderer.prepare(
                    &self.world,
                    &self.assets,
                    self.lights,
                    if self.normals {
                        ViewMode::Normals
                    } else {
                        ViewMode::Lit
                    },
                );
                if let Err(e) = renderer.present() {
                    if let Some(error) = e.downcast_ref::<wgpu::SurfaceError>() {
                        match error {
                            wgpu::SurfaceError::Lost | wgpu::SurfaceError::Outdated => {
                                let (w, h) = (renderer.config.width, renderer.config.height);
                                self.renderer.as_mut().unwrap().resize(w, h);
                                return;
                            }
                            wgpu::SurfaceError::Timeout | wgpu::SurfaceError::Other => return,
                            wgpu::SurfaceError::OutOfMemory => {}
                        }
                    }
                    self.fail(event_loop, e);
                    return;
                }
                self.frames += 1;
                if let Some(output) = &self.smoke {
                    if self.frames == 120 {
                        let result = (|| -> Result<()> {
                            std::fs::create_dir_all(output)?;
                            renderer.save(&output.join("native-window.png"))?;
                            std::fs::write(
                                output.join("native-window.json"),
                                serde_json::to_vec_pretty(
                                    &serde_json::json!({"presented_frames":self.frames,"gpu":renderer.adapter_info.name,"backend":format!("{:?}",renderer.adapter_info.backend),"resolution":[renderer.config.width,renderer.config.height],"input":"scripted; physical devices not tested","capture":"same render pass as presented window, GPU readback"}),
                                )?,
                            )?;
                            Ok(())
                        })();
                        if let Err(e) = result {
                            self.fail(event_loop, e);
                        } else {
                            event_loop.exit();
                        }
                    }
                }
                if let Some(window) = &self.window {
                    window.set_title(&format!("Rusted proof | A/D move · Space/RMB jump · L light · N normals · F5 graph | {} | x {:0.1}",self.world.player.clip,self.world.player.position[0]));
                }
            }
            _ => {}
        }
    }
    fn about_to_wait(&mut self, _: &ActiveEventLoop) {
        if let Some(w) = &self.window {
            w.request_redraw();
        }
    }
}

fn verify_gpu(assets: &Assets, output: &Path) -> Result<()> {
    std::fs::create_dir_all(output)?;
    let renderer = pollster::block_on(Renderer::new(None, assets, 1280, 720))?;
    let mut world = World::new(assets.room.clone());
    // Matched A/B: identical position, frame, camera and time; only torch contribution changes.
    world.player.position = [-2.6, 0.];
    world.camera_x = -3.6;
    renderer.prepare(&world, assets, false, ViewMode::Lit);
    let off = renderer.capture()?;
    off.save(output.join("light-off.png"))?;
    renderer.prepare(&world, assets, true, ViewMode::Lit);
    let on = renderer.capture()?;
    on.save(output.join("light-on.png"))?;
    renderer.prepare(&world, assets, true, ViewMode::Normals);
    renderer.save(&output.join("normals.png"))?;
    renderer.prepare(&world, assets, true, ViewMode::SpriteMask);
    let mask = renderer.capture()?;
    let changed = off
        .pixels()
        .zip(on.pixels())
        .filter(|(a, b)| a.0[..3] != b.0[..3])
        .count();
    ensure!(changed > 500, "torch did not alter enough rendered pixels");
    // Only pixels written by the sprite count: background light response cannot pass this check.
    let sprite_changed = mask
        .pixels()
        .zip(off.pixels().zip(on.pixels()))
        .filter(|(mask, (a, b))| mask.0[0] > 128 && a != b)
        .count();
    ensure!(
        sprite_changed > 50,
        "no visible light response in character region"
    );
    let frames_directory = output.join("frames");
    std::fs::create_dir_all(&frames_directory)?;
    world = World::new(assets.room.clone());
    let start = Instant::now();
    let mut max_height = 0f32;
    let mut samples = vec![];
    for frame in 0..160 {
        for step in 0..6 {
            world.step(
                &assets.graph,
                Actions {
                    horizontal: if frame < 110 { 1. } else { -1. },
                    jump_pressed: step == 0 && (frame == 35 || frame == 75),
                },
            )?;
            max_height = max_height.max(world.player.position[1]);
        }
        renderer.prepare(&world, assets, true, ViewMode::Lit);
        let image = renderer.capture()?;
        if frame == 25 || frame == 45 || frame == 85 {
            image.save(output.join(format!("replay-{frame:03}.png")))?;
        }
        image.save(frames_directory.join(format!("{frame:04}.png")))?;
        if frame % 20 == 0 {
            samples.push(serde_json::json!({"frame":frame,"position":world.player.position,"clip":world.player.clip,"grounded":world.player.grounded}));
        }
    }
    ensure!(max_height > 1.0, "scripted jump did not execute");
    let report = serde_json::json!({
        "scope":"First rendering/runtime proof; agent verification, not owner visual acceptance",
        "gpu":renderer.adapter_info.name,"driver":renderer.adapter_info.driver_info,"backend":format!("{:?}",renderer.adapter_info.backend),
        "resolution":[1280,720],"replay_seconds":8,"fixed_step_hz":120,"captured_frames":160,
        "elapsed_replay_and_capture_seconds":start.elapsed().as_secs_f64(),"performance_limit":"Includes GPU readback and PNG encoding; not a frame-rate benchmark",
        "matched_lighting_changed_pixels":changed,"character_region_changed_pixels":sprite_changed,"max_jump_height":max_height,
        "physical_input":"Not exercised. Keyboard/mouse/controller mappings implemented; device playtest remains pending.",
        "asset_pipeline":"Actual Blender source -> unlit RGBA and linear world-normal atlases -> same wgpu shader as native window",
        "samples":samples,
    });
    std::fs::write(
        output.join("verification.json"),
        serde_json::to_vec_pretty(&report)?,
    )?;
    println!("{}", serde_json::to_string_pretty(&report)?);
    Ok(())
}
