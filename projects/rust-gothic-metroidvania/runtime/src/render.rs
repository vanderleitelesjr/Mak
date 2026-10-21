use crate::{assets::Assets, world::World};
use anyhow::{Context, Result, ensure};
use bytemuck::{Pod, Zeroable};
use glam::{Mat4, Vec3};
use std::{path::Path, sync::Arc};
use wgpu::util::DeviceExt;
use winit::window::Window;

#[derive(Clone, Copy)]
pub enum ViewMode {
    Lit = 0,
    Normals = 1,
    SpriteMask = 2,
}

#[repr(C)]
#[derive(Clone, Copy, Pod, Zeroable)]
struct Vertex {
    position: [f32; 3],
    normal: [f32; 3],
    color: [f32; 3],
    uv: [f32; 2],
    material: f32,
}
impl Vertex {
    fn layout() -> wgpu::VertexBufferLayout<'static> {
        const ATTRIBUTES: [wgpu::VertexAttribute; 5] = wgpu::vertex_attr_array![0=>Float32x3,1=>Float32x3,2=>Float32x3,3=>Float32x2,4=>Float32];
        wgpu::VertexBufferLayout {
            array_stride: std::mem::size_of::<Self>() as u64,
            step_mode: wgpu::VertexStepMode::Vertex,
            attributes: &ATTRIBUTES,
        }
    }
}

#[repr(C)]
#[derive(Clone, Copy, Pod, Zeroable)]
struct Globals {
    view_projection: [[f32; 4]; 4],
    camera: [f32; 4],
    light_a: [f32; 4],
    light_b: [f32; 4],
    settings: [f32; 4],
}

struct Mesh {
    vertices: Vec<Vertex>,
    indices: Vec<u32>,
}
impl Mesh {
    fn new() -> Self {
        Self {
            vertices: vec![],
            indices: vec![],
        }
    }
    fn quad(
        &mut self,
        points: [[f32; 3]; 4],
        normal: [f32; 3],
        color: [f32; 3],
        uvs: [[f32; 2]; 4],
        material: f32,
    ) {
        let base = self.vertices.len() as u32;
        for (position, uv) in points.into_iter().zip(uvs) {
            self.vertices.push(Vertex {
                position,
                normal,
                color,
                uv,
                material,
            });
        }
        self.indices
            .extend([base, base + 1, base + 2, base, base + 2, base + 3]);
    }
    fn block(&mut self, min: [f32; 3], max: [f32; 3], color: [f32; 3]) {
        let [x, y, z] = min;
        let [a, b, c] = max;
        let uv = [[0., 0.]; 4];
        self.quad(
            [[x, y, c], [a, y, c], [a, b, c], [x, b, c]],
            [0., 0., 1.],
            color,
            uv,
            0.,
        );
        self.quad(
            [[a, y, z], [x, y, z], [x, b, z], [a, b, z]],
            [0., 0., -1.],
            color,
            uv,
            0.,
        );
        self.quad(
            [[x, b, c], [a, b, c], [a, b, z], [x, b, z]],
            [0., 1., 0.],
            color,
            uv,
            0.,
        );
        self.quad(
            [[x, y, z], [a, y, z], [a, y, c], [x, y, c]],
            [0., -1., 0.],
            color,
            uv,
            0.,
        );
        self.quad(
            [[a, y, c], [a, y, z], [a, b, z], [a, b, c]],
            [1., 0., 0.],
            color,
            uv,
            0.,
        );
        self.quad(
            [[x, y, z], [x, y, c], [x, b, c], [x, b, z]],
            [-1., 0., 0.],
            color,
            uv,
            0.,
        );
    }
    fn arch(&mut self, x: f32, y: f32, z: f32, radius: f32) {
        for i in 0..15 {
            let a = i as f32 * std::f32::consts::PI / 15.;
            let b = (i + 1) as f32 * std::f32::consts::PI / 15.;
            let mut points = [[0.; 3]; 4];
            for (p, (angle, r)) in points.iter_mut().zip([
                (a, radius),
                (b, radius),
                (b, radius + 0.38),
                (a, radius + 0.38),
            ]) {
                *p = [x + angle.cos() * r, y + angle.sin() * r, z];
            }
            let shade = 0.18 + (i % 3) as f32 * 0.017;
            self.quad(
                points,
                [0., 0., 1.],
                [shade * 0.93, shade, shade * 1.10],
                [[0.; 2]; 4],
                0.,
            );
        }
    }
}

pub struct Renderer {
    pub device: wgpu::Device,
    pub queue: wgpu::Queue,
    pub surface: Option<wgpu::Surface<'static>>,
    pub config: wgpu::SurfaceConfiguration,
    pipeline: wgpu::RenderPipeline,
    uniform: wgpu::Buffer,
    globals: wgpu::BindGroup,
    textures: wgpu::BindGroup,
    scene_vertices: wgpu::Buffer,
    scene_indices: wgpu::Buffer,
    scene_count: u32,
    sprite_vertices: wgpu::Buffer,
    sprite_indices: wgpu::Buffer,
    depth: wgpu::TextureView,
    pub adapter_info: wgpu::AdapterInfo,
}

fn depth(device: &wgpu::Device, width: u32, height: u32) -> wgpu::TextureView {
    device
        .create_texture(&wgpu::TextureDescriptor {
            label: Some("room depth"),
            size: wgpu::Extent3d {
                width,
                height,
                depth_or_array_layers: 1,
            },
            mip_level_count: 1,
            sample_count: 1,
            dimension: wgpu::TextureDimension::D2,
            format: wgpu::TextureFormat::Depth32Float,
            usage: wgpu::TextureUsages::RENDER_ATTACHMENT,
            view_formats: &[],
        })
        .create_view(&Default::default())
}

impl Renderer {
    pub async fn new(
        window: Option<Arc<Window>>,
        assets: &Assets,
        width: u32,
        height: u32,
    ) -> Result<Self> {
        let instance = wgpu::Instance::new(&wgpu::InstanceDescriptor {
            backends: wgpu::Backends::DX12,
            ..Default::default()
        });
        let surface = window
            .map(|window| instance.create_surface(window))
            .transpose()?;
        let adapter = instance
            .request_adapter(&wgpu::RequestAdapterOptions {
                power_preference: wgpu::PowerPreference::HighPerformance,
                compatible_surface: surface.as_ref(),
                force_fallback_adapter: false,
            })
            .await
            .context("no DX12 GPU adapter available")?;
        let adapter_info = adapter.get_info();
        let (device, queue) = adapter
            .request_device(&wgpu::DeviceDescriptor {
                label: Some("Rusted proof"),
                ..Default::default()
            })
            .await?;
        let format = if let Some(s) = &surface {
            s.get_capabilities(&adapter)
                .formats
                .into_iter()
                .find(|f| f.is_srgb())
                .context("surface has no sRGB format")?
        } else {
            wgpu::TextureFormat::Rgba8UnormSrgb
        };
        let config = wgpu::SurfaceConfiguration {
            usage: wgpu::TextureUsages::RENDER_ATTACHMENT,
            format,
            width,
            height,
            present_mode: wgpu::PresentMode::Fifo,
            desired_maximum_frame_latency: 2,
            alpha_mode: wgpu::CompositeAlphaMode::Auto,
            view_formats: vec![],
        };
        if let Some(s) = &surface {
            s.configure(&device, &config);
        }
        let uniform = device.create_buffer_init(&wgpu::util::BufferInitDescriptor {
            label: Some("scene uniforms"),
            contents: bytemuck::bytes_of(&Globals::zeroed()),
            usage: wgpu::BufferUsages::UNIFORM | wgpu::BufferUsages::COPY_DST,
        });
        let globals_layout = device.create_bind_group_layout(&wgpu::BindGroupLayoutDescriptor {
            label: None,
            entries: &[wgpu::BindGroupLayoutEntry {
                binding: 0,
                visibility: wgpu::ShaderStages::VERTEX_FRAGMENT,
                ty: wgpu::BindingType::Buffer {
                    ty: wgpu::BufferBindingType::Uniform,
                    has_dynamic_offset: false,
                    min_binding_size: None,
                },
                count: None,
            }],
        });
        let globals = device.create_bind_group(&wgpu::BindGroupDescriptor {
            label: None,
            layout: &globals_layout,
            entries: &[wgpu::BindGroupEntry {
                binding: 0,
                resource: uniform.as_entire_binding(),
            }],
        });
        let textures_layout = device.create_bind_group_layout(&wgpu::BindGroupLayoutDescriptor {
            label: None,
            entries: &[
                texture_entry(0),
                texture_entry(1),
                wgpu::BindGroupLayoutEntry {
                    binding: 2,
                    visibility: wgpu::ShaderStages::FRAGMENT,
                    ty: wgpu::BindingType::Sampler(wgpu::SamplerBindingType::Filtering),
                    count: None,
                },
            ],
        });
        let upload = |image: &image::RgbaImage, format, label| {
            let texture = device.create_texture_with_data(
                &queue,
                &wgpu::TextureDescriptor {
                    label: Some(label),
                    size: wgpu::Extent3d {
                        width: image.width(),
                        height: image.height(),
                        depth_or_array_layers: 1,
                    },
                    mip_level_count: 1,
                    sample_count: 1,
                    dimension: wgpu::TextureDimension::D2,
                    format,
                    usage: wgpu::TextureUsages::TEXTURE_BINDING,
                    view_formats: &[],
                },
                wgpu::util::TextureDataOrder::LayerMajor,
                image.as_raw(),
            );
            texture.create_view(&Default::default())
        };
        let albedo = upload(
            &assets.albedo,
            wgpu::TextureFormat::Rgba8UnormSrgb,
            "Blender unlit albedo",
        );
        let normal = upload(
            &assets.normal,
            wgpu::TextureFormat::Rgba8Unorm,
            "Blender linear world normals",
        );
        let sampler = device.create_sampler(&wgpu::SamplerDescriptor {
            label: None,
            mag_filter: wgpu::FilterMode::Linear,
            min_filter: wgpu::FilterMode::Linear,
            ..Default::default()
        });
        let textures = device.create_bind_group(&wgpu::BindGroupDescriptor {
            label: None,
            layout: &textures_layout,
            entries: &[
                wgpu::BindGroupEntry {
                    binding: 0,
                    resource: wgpu::BindingResource::TextureView(&albedo),
                },
                wgpu::BindGroupEntry {
                    binding: 1,
                    resource: wgpu::BindingResource::TextureView(&normal),
                },
                wgpu::BindGroupEntry {
                    binding: 2,
                    resource: wgpu::BindingResource::Sampler(&sampler),
                },
            ],
        });
        let shader = device.create_shader_module(wgpu::include_wgsl!("lit.wgsl"));
        let layout = device.create_pipeline_layout(&wgpu::PipelineLayoutDescriptor {
            label: None,
            bind_group_layouts: &[&globals_layout, &textures_layout],
            push_constant_ranges: &[],
        });
        let pipeline = device.create_render_pipeline(&wgpu::RenderPipelineDescriptor {
            label: Some("shared scene and normal-lit sprite"),
            layout: Some(&layout),
            vertex: wgpu::VertexState {
                module: &shader,
                entry_point: Some("vs_main"),
                buffers: &[Vertex::layout()],
                compilation_options: Default::default(),
            },
            fragment: Some(wgpu::FragmentState {
                module: &shader,
                entry_point: Some("fs_main"),
                targets: &[Some(wgpu::ColorTargetState {
                    format,
                    blend: None,
                    write_mask: wgpu::ColorWrites::ALL,
                })],
                compilation_options: Default::default(),
            }),
            primitive: wgpu::PrimitiveState {
                cull_mode: None,
                ..Default::default()
            },
            depth_stencil: Some(wgpu::DepthStencilState {
                format: wgpu::TextureFormat::Depth32Float,
                depth_write_enabled: true,
                depth_compare: wgpu::CompareFunction::Less,
                stencil: Default::default(),
                bias: Default::default(),
            }),
            multisample: Default::default(),
            multiview: None,
            cache: None,
        });
        let scene = room_mesh(assets);
        let scene_vertices = device.create_buffer_init(&wgpu::util::BufferInitDescriptor {
            label: Some("room geometry"),
            contents: bytemuck::cast_slice(&scene.vertices),
            usage: wgpu::BufferUsages::VERTEX,
        });
        let scene_indices = device.create_buffer_init(&wgpu::util::BufferInitDescriptor {
            label: None,
            contents: bytemuck::cast_slice(&scene.indices),
            usage: wgpu::BufferUsages::INDEX,
        });
        let sprite_vertices = device.create_buffer(&wgpu::BufferDescriptor {
            label: Some("animated sprite quad"),
            size: (std::mem::size_of::<Vertex>() * 4) as u64,
            usage: wgpu::BufferUsages::VERTEX | wgpu::BufferUsages::COPY_DST,
            mapped_at_creation: false,
        });
        let sprite_indices = device.create_buffer_init(&wgpu::util::BufferInitDescriptor {
            label: None,
            contents: bytemuck::cast_slice(&[0u32, 1, 2, 0, 2, 3]),
            usage: wgpu::BufferUsages::INDEX,
        });
        let depth = depth(&device, width, height);
        Ok(Self {
            device,
            queue,
            surface,
            config,
            pipeline,
            uniform,
            globals,
            textures,
            scene_vertices,
            scene_indices,
            scene_count: scene.indices.len() as u32,
            sprite_vertices,
            sprite_indices,
            depth,
            adapter_info,
        })
    }

    pub fn resize(&mut self, width: u32, height: u32) {
        if width == 0 || height == 0 {
            return;
        }
        self.config.width = width;
        self.config.height = height;
        self.depth = depth(&self.device, width, height);
        if let Some(s) = &self.surface {
            s.configure(&self.device, &self.config);
        }
    }

    pub fn prepare(&self, world: &World, assets: &Assets, lights: bool, view_mode: ViewMode) {
        let eye = Vec3::new(world.camera_x, 3.1, 11.8);
        let view = Mat4::look_at_rh(eye, Vec3::new(world.camera_x, 2.1, 0.), Vec3::Y);
        let projection = Mat4::perspective_rh(
            43f32.to_radians(),
            self.config.width as f32 / self.config.height as f32,
            0.1,
            100.,
        );
        let flicker = 1.0 + 0.10 * (world.time * 8.2).sin() + 0.045 * (world.time * 19.0).sin();
        let globals = Globals {
            view_projection: (projection * view).to_cols_array_2d(),
            camera: [eye.x, eye.y, eye.z, 1.],
            light_a: [-3.6, 2.2, 1.1, 3.5 * flicker],
            light_b: [5.3, 2.8, 0.8, 4.2 * flicker],
            settings: [
                if lights { 1. } else { 0. },
                world.player.facing,
                view_mode as u32 as f32,
                0.,
            ],
        };
        self.queue
            .write_buffer(&self.uniform, 0, bytemuck::bytes_of(&globals));
        let sprite = &assets.sprite;
        let p = &world.player;
        let [w, h] = sprite.world_size;
        let left = p.position[0] - w * sprite.pivot[0];
        let bottom = p.position[1] - h * sprite.pivot[1];
        let (lo, hi) = sprite.uv(&p.clip, p.animation_time);
        let (u0, u1) = if p.facing > 0. {
            (lo[0], hi[0])
        } else {
            (hi[0], lo[0])
        };
        let mut mesh = Mesh::new();
        mesh.quad(
            [
                [left, bottom, 0.],
                [left + w, bottom, 0.],
                [left + w, bottom + h, 0.],
                [left, bottom + h, 0.],
            ],
            [0., 0., 1.],
            [1.; 3],
            [[u0, hi[1]], [u1, hi[1]], [u1, lo[1]], [u0, lo[1]]],
            1.,
        );
        self.queue.write_buffer(
            &self.sprite_vertices,
            0,
            bytemuck::cast_slice(&mesh.vertices),
        );
    }

    fn encode(&self, encoder: &mut wgpu::CommandEncoder, target: &wgpu::TextureView) {
        let mut pass = encoder.begin_render_pass(&wgpu::RenderPassDescriptor {
            label: Some("room and animated character"),
            color_attachments: &[Some(wgpu::RenderPassColorAttachment {
                view: target,
                depth_slice: None,
                resolve_target: None,
                ops: wgpu::Operations {
                    load: wgpu::LoadOp::Clear(wgpu::Color {
                        r: 0.085,
                        g: 0.12,
                        b: 0.17,
                        a: 1.,
                    }),
                    store: wgpu::StoreOp::Store,
                },
            })],
            depth_stencil_attachment: Some(wgpu::RenderPassDepthStencilAttachment {
                view: &self.depth,
                depth_ops: Some(wgpu::Operations {
                    load: wgpu::LoadOp::Clear(1.),
                    store: wgpu::StoreOp::Store,
                }),
                stencil_ops: None,
            }),
            timestamp_writes: None,
            occlusion_query_set: None,
        });
        pass.set_pipeline(&self.pipeline);
        pass.set_bind_group(0, &self.globals, &[]);
        pass.set_bind_group(1, &self.textures, &[]);
        pass.set_vertex_buffer(0, self.scene_vertices.slice(..));
        pass.set_index_buffer(self.scene_indices.slice(..), wgpu::IndexFormat::Uint32);
        pass.draw_indexed(0..self.scene_count, 0, 0..1);
        pass.set_vertex_buffer(0, self.sprite_vertices.slice(..));
        pass.set_index_buffer(self.sprite_indices.slice(..), wgpu::IndexFormat::Uint32);
        pass.draw_indexed(0..6, 0, 0..1);
    }

    pub fn present(&self) -> Result<()> {
        let Some(surface) = &self.surface else {
            return Ok(());
        };
        let frame = surface.get_current_texture()?;
        let view = frame.texture.create_view(&Default::default());
        let mut encoder = self.device.create_command_encoder(&Default::default());
        self.encode(&mut encoder, &view);
        self.queue.submit([encoder.finish()]);
        frame.present();
        Ok(())
    }

    pub fn capture(&self) -> Result<image::RgbaImage> {
        let (width, height) = (self.config.width, self.config.height);
        let texture = self.device.create_texture(&wgpu::TextureDescriptor {
            label: Some("verification uses same render pass"),
            size: wgpu::Extent3d {
                width,
                height,
                depth_or_array_layers: 1,
            },
            mip_level_count: 1,
            sample_count: 1,
            dimension: wgpu::TextureDimension::D2,
            format: self.config.format,
            usage: wgpu::TextureUsages::RENDER_ATTACHMENT | wgpu::TextureUsages::COPY_SRC,
            view_formats: &[],
        });
        let stride = (width * 4).div_ceil(256) * 256;
        let readback = self.device.create_buffer(&wgpu::BufferDescriptor {
            label: None,
            size: (stride * height) as u64,
            usage: wgpu::BufferUsages::MAP_READ | wgpu::BufferUsages::COPY_DST,
            mapped_at_creation: false,
        });
        let mut encoder = self.device.create_command_encoder(&Default::default());
        self.encode(&mut encoder, &texture.create_view(&Default::default()));
        encoder.copy_texture_to_buffer(
            texture.as_image_copy(),
            wgpu::TexelCopyBufferInfo {
                buffer: &readback,
                layout: wgpu::TexelCopyBufferLayout {
                    offset: 0,
                    bytes_per_row: Some(stride),
                    rows_per_image: Some(height),
                },
            },
            wgpu::Extent3d {
                width,
                height,
                depth_or_array_layers: 1,
            },
        );
        self.queue.submit([encoder.finish()]);
        let (sender, receiver) = std::sync::mpsc::channel();
        readback
            .slice(..)
            .map_async(wgpu::MapMode::Read, move |result| {
                let _ = sender.send(result);
            });
        self.device.poll(wgpu::PollType::Wait)?;
        receiver.recv()??;
        let data = readback.slice(..).get_mapped_range();
        let mut pixels = Vec::with_capacity((width * height * 4) as usize);
        for row in data.chunks(stride as usize) {
            pixels.extend_from_slice(&row[..(width * 4) as usize]);
        }
        drop(data);
        readback.unmap();
        if matches!(
            self.config.format,
            wgpu::TextureFormat::Bgra8UnormSrgb | wgpu::TextureFormat::Bgra8Unorm
        ) {
            for pixel in pixels.chunks_exact_mut(4) {
                pixel.swap(0, 2);
            }
        }
        ensure!(
            pixels.len() == (width * height * 4) as usize,
            "capture size mismatch"
        );
        image::RgbaImage::from_raw(width, height, pixels).context("invalid capture buffer")
    }

    pub fn save(&self, path: &Path) -> Result<()> {
        self.capture()?.save(path)?;
        Ok(())
    }
}

fn texture_entry(binding: u32) -> wgpu::BindGroupLayoutEntry {
    wgpu::BindGroupLayoutEntry {
        binding,
        visibility: wgpu::ShaderStages::FRAGMENT,
        ty: wgpu::BindingType::Texture {
            sample_type: wgpu::TextureSampleType::Float { filterable: true },
            view_dimension: wgpu::TextureViewDimension::D2,
            multisampled: false,
        },
        count: None,
    }
}

fn room_mesh(assets: &Assets) -> Mesh {
    let mut mesh = Mesh::new();
    // Authored collision solids own the corresponding visible geometry.
    for solid in &assets.room.platforms {
        mesh.block(
            [solid.min[0], solid.min[1], -solid.depth / 2.],
            [solid.max[0], solid.max[1], solid.depth / 2.],
            [0.22, 0.235, 0.25],
        );
    }
    // Rear masonry, broad open arches, riveted iron and localized warm braziers.
    for x in -7..=7 {
        let x = x as f32 * 1.7;
        for y in 0..10 {
            let shift = if y % 2 == 0 { 0. } else { 0.7 };
            let shade = 0.13 + ((y * 7 + x as i32).rem_euclid(5)) as f32 * 0.009;
            mesh.block(
                [x + shift, y as f32 * 0.59, -4.5],
                [x + shift + 1.65, y as f32 * 0.59 + 0.55, -4.1],
                [shade, shade * 1.07, shade * 1.19],
            );
        }
    }
    for x in [-8., -2.7, 2.7, 8.] {
        mesh.block(
            [x - 0.38, 0., -2.7],
            [x + 0.38, 5.8, -1.9],
            [0.21, 0.22, 0.245],
        );
        for y in [0.4, 2.3, 4.3] {
            mesh.block(
                [x - 0.44, y, -1.95],
                [x + 0.44, y + 0.16, -1.77],
                [0.12, 0.075, 0.046],
            );
            for dx in [-0.30, 0., 0.30] {
                mesh.block(
                    [x + dx - 0.025, y + 0.05, -1.74],
                    [x + dx + 0.025, y + 0.10, -1.69],
                    [0.34, 0.22, 0.13],
                );
            }
        }
    }
    for x in [-5.35, 0., 5.35] {
        mesh.arch(x, 3.55, -1.7, 2.26);
        for dx in [-1.1, -0.55, 0., 0.55, 1.1] {
            mesh.block(
                [x + dx - 0.035, 4.5, -3.95],
                [x + dx + 0.035, 5.7, -3.80],
                [0.075, 0.08, 0.085],
            );
        }
    }
    for x in [-3.6, 5.3] {
        let y = if x < 0. { 2.2 } else { 2.8 };
        mesh.block(
            [x - 0.08, y - 0.8, 0.55],
            [x + 0.08, y - 0.15, 0.72],
            [0.075, 0.045, 0.03],
        );
        mesh.block(
            [x - 0.29, y - 0.35, 0.46],
            [x + 0.29, y - 0.20, 0.94],
            [0.13, 0.075, 0.04],
        );
        for dx in [-0.22, -0.11, 0., 0.11, 0.22] {
            mesh.block(
                [x + dx - 0.018, y - 0.25, 0.92],
                [x + dx + 0.018, y + 0.15, 0.98],
                [0.18, 0.10, 0.045],
            );
        }
        mesh.quad(
            [
                [x - 0.14, y - 0.20, 0.85],
                [x + 0.16, y - 0.20, 0.85],
                [x + 0.07, y + 0.36, 0.85],
                [x - 0.04, y + 0.49, 0.85],
            ],
            [0., 0., 1.],
            [2.4, 0.60, 0.10],
            [[0.; 2]; 4],
            2.,
        );
    }
    // Gate and gallery are decorative proof geometry, not authored gameplay mechanisms.
    for x in [7.0, 7.4, 7.8, 8.2, 8.6, 9.0] {
        mesh.block([x, 1.4, -1.4], [x + 0.07, 5.7, -1.2], [0.12, 0.075, 0.04]);
    }
    for y in [2., 3.3, 4.6] {
        mesh.block([6.9, y, -1.3], [9.2, y + 0.10, -1.1], [0.15, 0.085, 0.045]);
    }
    mesh
}
