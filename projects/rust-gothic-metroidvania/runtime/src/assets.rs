use crate::{
    graph::{ExecutableGraph, Graph},
    world::Room,
};
use anyhow::{Context, Result, ensure};
use serde::Deserialize;
use std::{
    collections::HashMap,
    path::{Path, PathBuf},
};

#[derive(Debug, Deserialize)]
pub struct Clip {
    pub start: u32,
    pub count: u32,
    pub fps: f32,
}
#[derive(Debug, Deserialize)]
pub struct Sprite {
    pub version: u32,
    pub albedo: String,
    pub normal: String,
    pub columns: u32,
    pub rows: u32,
    pub frame_size: [u32; 2],
    pub world_size: [f32; 2],
    pub pivot: [f32; 2],
    pub clips: HashMap<String, Clip>,
}

pub struct Assets {
    pub root: PathBuf,
    pub sprite: Sprite,
    pub albedo: image::RgbaImage,
    pub normal: image::RgbaImage,
    pub room: Room,
    pub graph: ExecutableGraph,
}

fn read<T: serde::de::DeserializeOwned>(path: &Path) -> Result<T> {
    serde_json::from_slice(
        &std::fs::read(path).with_context(|| format!("read {}", path.display()))?,
    )
    .with_context(|| format!("parse {}", path.display()))
}

impl Assets {
    pub fn load(root: &Path) -> Result<Self> {
        let dir = root.join("penitent-proof-v01");
        let sprite: Sprite = read(&dir.join("sprite.json"))?;
        ensure!(sprite.version == 1, "unsupported sprite manifest version");
        ensure!(
            (1..=64).contains(&sprite.columns) && (1..=64).contains(&sprite.rows),
            "invalid atlas grid"
        );
        ensure!(
            sprite.frame_size.iter().all(|x| (1..=2048).contains(x)),
            "invalid frame dimensions"
        );
        ensure!(
            sprite
                .world_size
                .iter()
                .all(|x| x.is_finite() && *x > 0.0 && *x < 20.0),
            "invalid sprite world size"
        );
        ensure!(
            sprite
                .pivot
                .iter()
                .all(|x| x.is_finite() && (0.0..=1.0).contains(x)),
            "invalid sprite pivot"
        );
        for (name, clip) in &sprite.clips {
            ensure!(
                clip.count > 0
                    && clip
                        .start
                        .checked_add(clip.count)
                        .is_some_and(|end| end <= sprite.columns * sprite.rows),
                "clip {name}: frame outside atlas"
            );
            ensure!(
                clip.fps.is_finite() && clip.fps > 0.0 && clip.fps <= 240.0,
                "clip {name}: invalid fps"
            );
        }
        ensure!(
            sprite.clips.contains_key("idle"),
            "missing initial idle clip"
        );
        let load_image = |file: &str| -> Result<image::RgbaImage> {
            // Manifest filenames cannot escape their own asset directory.
            ensure!(
                Path::new(file).components().count() == 1
                    && Path::new(file).file_name().is_some_and(|n| n == file),
                "invalid sprite image filename"
            );
            let image = image::open(dir.join(file))
                .with_context(|| format!("load sprite image {file}"))?
                .into_rgba8();
            ensure!(
                image.dimensions()
                    == (
                        sprite.columns * sprite.frame_size[0],
                        sprite.rows * sprite.frame_size[1]
                    ),
                "atlas dimensions mismatch: {file}"
            );
            Ok(image)
        };
        let albedo = load_image(&sprite.albedo)?;
        let normal = load_image(&sprite.normal)?;
        ensure!(
            albedo
                .pixels()
                .zip(normal.pixels())
                .all(|(a, n)| (a.0[3] >= 128) == (n.0[3] >= 128)),
            "albedo/normal silhouette mismatch"
        );
        let room: Room = read(&root.join("room.json"))?;
        room.validate()?;
        let graph: Graph = read(&root.join("movement.json"))?;
        graph.validate(&sprite.clips.keys().cloned().collect())?;
        Ok(Self {
            root: root.into(),
            sprite,
            albedo,
            normal,
            room,
            graph: graph.compile(),
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn real_blender_export_has_distinct_walk_frames_and_linear_unit_normals() {
        let assets = Assets::load(&Path::new(env!("CARGO_MANIFEST_DIR")).join("assets")).unwrap();
        let walk = &assets.sprite.clips["walk"];
        assert_eq!(walk.count, 12);
        let frame = |index: u32| {
            image::imageops::crop_imm(
                &assets.albedo,
                index % assets.sprite.columns * 192,
                index / assets.sprite.columns * 256,
                192,
                256,
            )
            .to_image()
        };
        assert_ne!(frame(walk.start), frame(walk.start + 3));
        let mut count = 0;
        for (x, y, pixel) in assets
            .normal
            .enumerate_pixels()
            .filter(|(_, _, p)| p.0[3] == 255)
        {
            // Render antialiasing blends normals at face boundaries; inspect flat interiors.
            if x == 0 || y == 0 || x + 1 == assets.normal.width() || y + 1 == assets.normal.height()
            {
                continue;
            }
            if [(x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)]
                .iter()
                .any(|(nx, ny)| {
                    let other = assets.normal.get_pixel(*nx, *ny);
                    other.0[3] != 255 || (0..3).any(|c| pixel.0[c].abs_diff(other.0[c]) > 4)
                })
            {
                continue;
            }
            let squared: f32 = pixel.0[..3]
                .iter()
                .map(|v| (*v as f32 / 255.0 * 2.0 - 1.0).powi(2))
                .sum();
            assert!(
                (0.90..=1.10).contains(&squared),
                "normal has wrong color space at {x},{y}: {:?}, squared length {squared}",
                pixel.0
            );
            count += 1;
        }
        assert!(count > 10000);
    }
}

impl Sprite {
    pub fn uv(&self, clip: &str, time: f32) -> ([f32; 2], [f32; 2]) {
        let clip = &self.clips[clip];
        let index = clip.start + ((time * clip.fps) as u32 % clip.count);
        let width = (self.columns * self.frame_size[0]) as f32;
        let height = (self.rows * self.frame_size[1]) as f32;
        let x = (index % self.columns * self.frame_size[0]) as f32;
        let y = (index / self.columns * self.frame_size[1]) as f32;
        (
            [(x + 0.5) / width, (y + 0.5) / height],
            [
                (x + self.frame_size[0] as f32 - 0.5) / width,
                (y + self.frame_size[1] as f32 - 0.5) / height,
            ],
        )
    }
}
