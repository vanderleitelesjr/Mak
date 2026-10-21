use crate::graph::ExecutableGraph;
use anyhow::{Result, ensure};
use serde::{Deserialize, Serialize};

pub const STEP: f32 = 1.0 / 120.0;
pub const HALF_WIDTH: f32 = 0.23;
pub const HEIGHT: f32 = 1.95;

#[derive(Default, Debug, Clone, Copy)]
pub struct Actions {
    pub horizontal: f32,
    pub jump_pressed: bool,
}

#[derive(Clone, Debug, Serialize)]
pub struct Player {
    pub position: [f32; 2],
    pub velocity: [f32; 2],
    pub grounded: bool,
    pub facing: f32,
    pub clip: String,
    pub animation_time: f32,
}
impl Player {
    pub fn new(position: [f32; 2]) -> Self {
        Self {
            position,
            velocity: [0.0; 2],
            grounded: true,
            facing: 1.0,
            clip: "idle".into(),
            animation_time: 0.0,
        }
    }
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Platform {
    pub min: [f32; 2],
    pub max: [f32; 2],
    pub depth: f32,
}
#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Room {
    pub name: String,
    pub spawn: [f32; 2],
    pub bounds: [f32; 2],
    pub platforms: Vec<Platform>,
}
impl Room {
    pub fn validate(&self) -> Result<()> {
        ensure!(
            self.bounds
                .iter()
                .chain(self.spawn.iter())
                .all(|x| x.is_finite()),
            "non-finite room coordinate"
        );
        ensure!(
            self.bounds[1] > self.bounds[0] && self.platforms.len() <= 512,
            "invalid room bounds/platform count"
        );
        ensure!(
            self.spawn[0] > self.bounds[0] && self.spawn[0] < self.bounds[1],
            "spawn outside room"
        );
        for p in &self.platforms {
            ensure!(
                p.min.iter().chain(p.max.iter()).all(|x| x.is_finite()) && p.depth.is_finite(),
                "non-finite platform"
            );
            ensure!(
                p.min[0] < p.max[0] && p.min[1] < p.max[1] && p.depth > 0.0,
                "inverted platform"
            );
        }
        Ok(())
    }
}

pub struct World {
    pub room: Room,
    pub player: Player,
    pub time: f32,
    pub camera_x: f32,
}
impl World {
    pub fn new(room: Room) -> Self {
        Self {
            player: Player::new(room.spawn),
            camera_x: room.spawn[0],
            room,
            time: 0.0,
        }
    }
    pub fn step(&mut self, graph: &ExecutableGraph, actions: Actions) -> Result<()> {
        let old_clip = self.player.clip.clone();
        graph.tick(actions, &mut self.player)?;
        if old_clip != self.player.clip {
            self.player.animation_time = 0.0;
        }
        let p = &mut self.player;
        p.velocity[1] -= 18.0 * STEP;
        // Axis-separated swept intervals; fixed dt prevents frame-rate-dependent tunneling.
        let old = p.position;
        p.position[0] += p.velocity[0] * STEP;
        for solid in &self.room.platforms {
            if old[1] < solid.max[1] - 0.001 && old[1] + HEIGHT > solid.min[1] + 0.001 {
                if p.velocity[0] > 0.0
                    && old[0] + HALF_WIDTH <= solid.min[0]
                    && p.position[0] + HALF_WIDTH > solid.min[0]
                {
                    p.position[0] = solid.min[0] - HALF_WIDTH;
                } else if p.velocity[0] < 0.0
                    && old[0] - HALF_WIDTH >= solid.max[0]
                    && p.position[0] - HALF_WIDTH < solid.max[0]
                {
                    p.position[0] = solid.max[0] + HALF_WIDTH;
                }
            }
        }
        p.position[0] = p.position[0].clamp(
            self.room.bounds[0] + HALF_WIDTH,
            self.room.bounds[1] - HALF_WIDTH,
        );
        p.position[1] += p.velocity[1] * STEP;
        p.grounded = false;
        for solid in &self.room.platforms {
            if p.position[0] + HALF_WIDTH > solid.min[0]
                && p.position[0] - HALF_WIDTH < solid.max[0]
            {
                if p.velocity[1] <= 0.0
                    && old[1] >= solid.max[1] - 0.001
                    && p.position[1] <= solid.max[1]
                {
                    p.position[1] = solid.max[1];
                    p.velocity[1] = 0.0;
                    p.grounded = true;
                } else if p.velocity[1] > 0.0
                    && old[1] + HEIGHT <= solid.min[1]
                    && p.position[1] + HEIGHT >= solid.min[1]
                {
                    p.position[1] = solid.min[1] - HEIGHT;
                    p.velocity[1] = 0.0;
                }
            }
        }
        if p.position[1] < -8.0 {
            *p = Player::new(self.room.spawn);
        }
        p.animation_time += STEP;
        self.time += STEP;
        let target = p.position[0].clamp(-4.4, 4.4);
        self.camera_x += (target - self.camera_x) * (1.0 - (-5.0 * STEP).exp());
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::graph::Graph;
    fn setup() -> (World, ExecutableGraph) {
        let room = serde_json::from_str(include_str!("../assets/room.json")).unwrap();
        let graph: Graph = serde_json::from_str(include_str!("../assets/movement.json")).unwrap();
        (World::new(room), graph.compile())
    }
    #[test]
    fn standing_on_floor_and_side_collision_are_stable() {
        let (mut world, graph) = setup();
        for _ in 0..800 {
            world
                .step(
                    &graph,
                    Actions {
                        horizontal: 1.0,
                        jump_pressed: false,
                    },
                )
                .unwrap();
        }
        assert!((world.player.position[0] - (0.5 - HALF_WIDTH)).abs() < 0.002);
        assert_eq!(world.player.position[1], 0.0);
        assert!(world.player.grounded);
    }
    #[test]
    fn jump_lands_on_authored_platform_without_mutating_room() {
        let (mut world, graph) = setup();
        world.player.position = [-0.3, 0.0];
        let authored = serde_json::to_string(&world.room).unwrap();
        for step in 0..120 {
            world
                .step(
                    &graph,
                    Actions {
                        horizontal: if step < 65 { 1.0 } else { 0.0 },
                        jump_pressed: step == 0,
                    },
                )
                .unwrap();
        }
        assert!((world.player.position[1] - 0.6).abs() < 0.001);
        assert!(world.player.grounded);
        assert_eq!(serde_json::to_string(&world.room).unwrap(), authored);
    }
}
