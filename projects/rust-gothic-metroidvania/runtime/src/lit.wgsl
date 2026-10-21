struct Globals {
    view_projection: mat4x4<f32>,
    camera: vec4<f32>,
    light_a: vec4<f32>,
    light_b: vec4<f32>,
    settings: vec4<f32>,
};
@group(0) @binding(0) var<uniform> globals: Globals;
@group(1) @binding(0) var albedo_atlas: texture_2d<f32>;
@group(1) @binding(1) var normal_atlas: texture_2d<f32>;
@group(1) @binding(2) var atlas_sampler: sampler;

struct VertexIn {
    @location(0) position: vec3<f32>,
    @location(1) normal: vec3<f32>,
    @location(2) color: vec3<f32>,
    @location(3) uv: vec2<f32>,
    @location(4) material: f32,
};
struct VertexOut {
    @builtin(position) clip_position: vec4<f32>,
    @location(0) world_position: vec3<f32>,
    @location(1) normal: vec3<f32>,
    @location(2) color: vec3<f32>,
    @location(3) uv: vec2<f32>,
    @location(4) material: f32,
};
@vertex fn vs_main(v: VertexIn) -> VertexOut {
    var out: VertexOut;
    out.clip_position = globals.view_projection * vec4(v.position, 1.0);
    out.world_position = v.position;
    out.normal = v.normal;
    out.color = v.color;
    out.uv = v.uv;
    out.material = v.material;
    return out;
}
fn torch(position: vec3<f32>, normal: vec3<f32>, light: vec4<f32>, albedo: vec3<f32>) -> vec3<f32> {
    let delta = light.xyz - position;
    let distance2 = max(dot(delta,delta), 0.01);
    let direction = delta * inverseSqrt(distance2);
    let diffuse = max(dot(normal, direction), 0.0);
    let view_direction = normalize(globals.camera.xyz - position);
    let halfway = normalize(direction + view_direction);
    let specular = pow(max(dot(normal,halfway),0.0),32.0) * 0.32;
    return vec3(1.0,0.39,0.115) * light.w / (1.0 + distance2 * 0.52) * (albedo * diffuse + vec3(specular));
}
@fragment fn fs_main(v: VertexOut) -> @location(0) vec4<f32> {
    var base = v.color;
    var normal = normalize(v.normal);
    if v.material > 0.5 && v.material < 1.5 {
        let texel = textureSample(albedo_atlas, atlas_sampler, v.uv);
        if texel.a < 0.5 { discard; }
        base = texel.rgb;
        normal = normalize(textureSample(normal_atlas, atlas_sampler, v.uv).xyz * 2.0 - 1.0);
        normal.x *= globals.settings.y;
    }
    if globals.settings.z > 1.5 {
        if v.material > 0.5 && v.material < 1.5 { return vec4(1.0); }
        return vec4(0.0,0.0,0.0,1.0);
    }
    if globals.settings.z > 0.5 { return vec4(normal * 0.5 + 0.5,1.0); }
    if v.material > 1.5 { return vec4(base,1.0); }
    // Coarse stone variation is in world space; the character keeps its Blender albedo.
    if v.material < 0.5 {
        let grain = fract(sin(dot(floor(v.world_position*52.0),vec3(12.9898,78.233,37.719)))*43758.5453);
        base *= 0.82 + grain*0.30;
    }
    let skylight = max(dot(normal,normalize(vec3(-0.25,0.85,0.55))),0.0);
    var color = base * (vec3(0.20,0.24,0.31) + skylight * vec3(0.49,0.58,0.72));
    color += globals.settings.x * (torch(v.world_position,normal,globals.light_a,base) + torch(v.world_position,normal,globals.light_b,base));
    let distance = length(globals.camera.xyz - v.world_position);
    let fog = clamp((distance-12.0)*0.035,0.0,0.52);
    color = mix(color,vec3(0.105,0.145,0.20),fog);
    return vec4(color,1.0);
}
