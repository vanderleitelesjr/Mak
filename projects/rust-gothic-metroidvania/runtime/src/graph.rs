use anyhow::{Result, bail, ensure};
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};

use crate::world::{Actions, Player};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Graph {
    pub entry: String,
    pub nodes: Vec<Node>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Node {
    pub id: String,
    #[serde(flatten)]
    pub op: Op,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "op", rename_all = "snake_case", deny_unknown_fields)]
pub enum Op {
    Horizontal {
        speed: f32,
        next: String,
    },
    Branch {
        condition: Condition,
        yes: String,
        no: String,
    },
    VerticalImpulse {
        value: f32,
        next: String,
    },
    Animate {
        clip: String,
        next: String,
    },
    Halt,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Condition {
    JumpPressed,
    Grounded,
    Moving,
}

impl Graph {
    pub fn validate(&self, clips: &HashSet<String>) -> Result<()> {
        ensure!(
            !self.nodes.is_empty() && self.nodes.len() <= 128,
            "graph needs 1..128 nodes"
        );
        let mut ids = HashSet::new();
        for node in &self.nodes {
            ensure!(
                !node.id.is_empty() && ids.insert(node.id.as_str()),
                "duplicate/empty graph node {}",
                node.id
            );
        }
        ensure!(
            ids.contains(self.entry.as_str()),
            "missing graph entry {}",
            self.entry
        );
        for node in &self.nodes {
            let nexts: Vec<&str> = match &node.op {
                Op::Horizontal { speed, next } => {
                    ensure!(
                        speed.is_finite() && (0.0..=20.0).contains(speed),
                        "node {}: invalid speed",
                        node.id
                    );
                    vec![next]
                }
                Op::VerticalImpulse { value, next } => {
                    ensure!(
                        value.is_finite() && (0.0..=20.0).contains(value),
                        "node {}: invalid impulse",
                        node.id
                    );
                    vec![next]
                }
                Op::Animate { clip, next } => {
                    ensure!(
                        clips.contains(clip),
                        "node {}: unknown clip {}",
                        node.id,
                        clip
                    );
                    vec![next]
                }
                Op::Branch { yes, no, .. } => vec![yes, no],
                Op::Halt => vec![],
            };
            for next in nexts {
                ensure!(
                    ids.contains(next),
                    "node {}: missing target {}",
                    node.id,
                    next
                );
            }
        }
        Ok(())
    }

    pub fn compile(&self) -> ExecutableGraph {
        ExecutableGraph {
            graph: self.clone(),
            indices: self
                .nodes
                .iter()
                .enumerate()
                .map(|(i, n)| (n.id.clone(), i))
                .collect(),
        }
    }
}

pub struct ExecutableGraph {
    graph: Graph,
    indices: HashMap<String, usize>,
}

impl ExecutableGraph {
    pub fn tick(&self, actions: Actions, player: &mut Player) -> Result<()> {
        // Commit only a completed tick: an invalid cycle cannot partially mutate the player.
        let mut proposed = player.clone();
        let mut id = self.graph.entry.as_str();
        for _ in 0..128 {
            let Some(index) = self.indices.get(id) else {
                bail!("graph: missing node {id}")
            };
            let node = &self.graph.nodes[*index];
            id = match &node.op {
                Op::Horizontal { speed, next } => {
                    proposed.velocity[0] = actions.horizontal.clamp(-1.0, 1.0) * speed;
                    if actions.horizontal.abs() > 0.05 {
                        proposed.facing = actions.horizontal.signum();
                    }
                    next
                }
                Op::VerticalImpulse { value, next } => {
                    proposed.velocity[1] = *value;
                    proposed.grounded = false;
                    next
                }
                Op::Animate { clip, next } => {
                    proposed.clip.clone_from(clip);
                    next
                }
                Op::Branch { condition, yes, no } => {
                    let pass = match condition {
                        Condition::JumpPressed => actions.jump_pressed,
                        Condition::Grounded => proposed.grounded,
                        Condition::Moving => actions.horizontal.abs() > 0.05,
                    };
                    if pass { yes } else { no }
                }
                Op::Halt => {
                    *player = proposed;
                    return Ok(());
                }
            };
        }
        bail!("graph budget exhausted at node {id} (128 operations)")
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    fn graph() -> Graph {
        serde_json::from_str(include_str!("../assets/movement.json")).unwrap()
    }
    fn clips() -> HashSet<String> {
        ["idle".into(), "walk".into()].into()
    }
    #[test]
    fn reconnecting_a_graph_edge_removes_jump_behavior() {
        let mut graph = graph();
        graph.validate(&clips()).unwrap();
        let mut player = Player::new([0.0, 0.0]);
        let input = Actions {
            horizontal: 1.0,
            jump_pressed: true,
        };
        graph.compile().tick(input, &mut player).unwrap();
        assert_eq!(player.velocity, [3.4, 7.0]);
        assert_eq!(player.clip, "walk");
        if let Op::Branch { yes, .. } = &mut graph.nodes[2].op {
            *yes = "animation".into();
        }
        let mut changed = Player::new([0.0, 0.0]);
        graph.compile().tick(input, &mut changed).unwrap();
        assert_eq!(changed.velocity, [3.4, 0.0]);
    }
    #[test]
    fn cycle_is_bounded_and_does_not_commit_partial_motion() {
        let mut graph = graph();
        if let Op::Horizontal { next, .. } = &mut graph.nodes[0].op {
            *next = "move".into();
        }
        graph.validate(&clips()).unwrap();
        let mut player = Player::new([0.0, 0.0]);
        let error = graph
            .compile()
            .tick(
                Actions {
                    horizontal: 1.0,
                    jump_pressed: false,
                },
                &mut player,
            )
            .unwrap_err();
        assert!(error.to_string().contains("node move"));
        assert_eq!(player.velocity, [0.0, 0.0]);
    }
    #[test]
    fn bad_targets_duplicate_ids_and_unknown_clips_are_rejected() {
        let mut graph = graph();
        graph.entry = "missing".into();
        assert!(graph.validate(&clips()).is_err());
        graph.entry = "move".into();
        graph.nodes.push(graph.nodes[0].clone());
        assert!(graph.validate(&clips()).is_err());
        graph.nodes.pop();
        graph.nodes[0].op = Op::Animate {
            clip: "missing".into(),
            next: "end".into(),
        };
        assert!(graph.validate(&clips()).is_err());
    }
}
