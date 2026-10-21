// Measure the convex hull of the actual STL in its supplied XY orientation.
// Search planar rotation only: preserve scale, height and layer orientation.
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const folder = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(folder, 'v2');
const metadata = JSON.parse(await readFile(path.join(out, 'full_delivery_measurements.json'), 'utf8'));
const raw = await readFile(path.join(out, metadata.stl));
const points = new Map();
for (let i = 0; i < raw.readUInt32LE(80); i++) {
  for (let v = 0; v < 3; v++) {
    const offset = 84+50*i+12+12*v;
    const p = [raw.readFloatLE(offset), raw.readFloatLE(offset+4)];
    points.set(`${p[0]},${p[1]}`, p);
  }
}
const sorted = [...points.values()].sort((a,b) => a[0]-b[0] || a[1]-b[1]);
const cross = (o,a,b) => (a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]);
const lower = [], upper = [];
for (const p of sorted) {
  while (lower.length > 1 && cross(lower.at(-2),lower.at(-1),p) <= 0) lower.pop();
  lower.push(p);
}
for (const p of [...sorted].reverse()) {
  while (upper.length > 1 && cross(upper.at(-2),upper.at(-1),p) <= 0) upper.pop();
  upper.push(p);
}
const hull = [...lower.slice(0,-1), ...upper.slice(0,-1)];
let best = { requiredSquareMM: Infinity };
for (let step = 0; step <= 9000; step++) {
  const degrees = step/100, radians = degrees*Math.PI/180;
  const c = Math.cos(radians), s = Math.sin(radians);
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const [x,y] of hull) {
    const rx = c*x-s*y, ry = s*x+c*y;
    minX = Math.min(minX,rx); maxX = Math.max(maxX,rx);
    minY = Math.min(minY,ry); maxY = Math.max(maxY,ry);
  }
  const dimensionsMM = [maxX-minX,maxY-minY,metadata.print_dimensions_mm[2]];
  const requiredSquareMM = Math.max(...dimensionsMM.slice(0,2));
  if (requiredSquareMM < best.requiredSquareMM) best = { rotationAroundZDegrees: degrees, dimensionsMM, requiredSquareMM };
}
const result = {
  stl: metadata.stl, sha256: metadata.sha256,
  method: 'Convex hull of actual STL XY vertices; planar rotation grid from 0 to 90 degrees in 0.01 degree steps.',
  suppliedDimensionsMM: metadata.print_dimensions_mm, bestPlanarRotation: best,
  excludes: 'Brim, supports, purge lines and printer exclusion zones. No tilt or scale changes assessed.',
  squareBeds: [220,256,300].map(size => ({ sizeMM: size, geometryFitsAfterRotation: best.requiredSquareMM <= size, minimumTotalMarginMM: size-best.requiredSquareMM }))
};
await writeFile(path.join(out,'print_footprint.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result));
