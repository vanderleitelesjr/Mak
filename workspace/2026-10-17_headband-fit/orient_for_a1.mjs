// Rigid planar rotation only. Retain every triangle, the fitted scale and Z.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const folder = path.dirname(fileURLToPath(import.meta.url)), out = path.join(folder,'v2');
const base = JSON.parse(await readFile(path.join(out,'full_delivery_measurements.json'),'utf8'));
const footprint = JSON.parse(await readFile(path.join(out,'print_footprint.json'),'utf8'));
const raw = await readFile(path.join(out,base.stl));
assert.equal(createHash('sha256').update(raw).digest('hex'),base.sha256);
const result = Buffer.from(raw);
result.fill(0,0,80);
result.write('Headband v2 - Bambu Lab A1 - mm - 100 percent - rigid XY rotation',0,'ascii');
const degrees = footprint.bestPlanarRotation.rotationAroundZDegrees, radians = degrees*Math.PI/180;
const c = Math.cos(radians), s = Math.sin(radians);
const count = raw.readUInt32LE(80);
const minimum = [Infinity,Infinity,Infinity], maximum = [-Infinity,-Infinity,-Infinity];
let maxTransformRoundingMM = 0;
for (let i=0;i<count;i++) {
  const normal = 84+i*50;
  const nx = raw.readFloatLE(normal), ny = raw.readFloatLE(normal+4);
  result.writeFloatLE(c*nx-s*ny,normal);
  result.writeFloatLE(s*nx+c*ny,normal+4);
  for (let v=0;v<3;v++) {
    const offset = normal+12+v*12;
    const x = raw.readFloatLE(offset), y = raw.readFloatLE(offset+4);
    const rx = c*x-s*y, ry = s*x+c*y;
    result.writeFloatLE(rx,offset); result.writeFloatLE(ry,offset+4);
    for (let axis=0;axis<3;axis++) {
      const coordinate = result.readFloatLE(offset+axis*4);
      minimum[axis] = Math.min(minimum[axis],coordinate);
      maximum[axis] = Math.max(maximum[axis],coordinate);
    }
    maxTransformRoundingMM = Math.max(maxTransformRoundingMM,Math.abs(result.readFloatLE(offset)-rx),Math.abs(result.readFloatLE(offset+4)-ry));
    assert.equal(result.readFloatLE(offset+8),raw.readFloatLE(offset+8));
  }
}
const dimensionsMM = maximum.map((v,i)=>v-minimum[i]);
assert.ok(dimensionsMM[0] < 256 && dimensionsMM[1] < 256 && dimensionsMM[2] < 256);
assert.ok(maxTransformRoundingMM < 0.00002);
const filename = 'Headband_58cm_PLA_fit_v2_Bambu_A1.stl';
try {
  await writeFile(path.join(out,filename),result,{flag:'wx'});
} catch (error) {
  if (error.code !== 'EEXIST') throw error;
  assert.deepEqual(await readFile(path.join(out,filename)),result,'Existing A1 release differs; preserve it');
}
const receipt = {
  printer: 'Bambu Lab A1', buildVolumeMM: [256,256,256],
  stl: filename, sha256: createHash('sha256').update(result).digest('hex'),
  sourceSTL: base.stl, sourceSHA256: base.sha256,
  rotationAroundZDegrees: degrees, scale: 1, triangles: count,
  printDimensionsMM: dimensionsMM, maxTransformRoundingMM,
  minimumTotalXYMarginMM: Math.min(256-dimensionsMM[0],256-dimensionsMM[1]),
  orientation: 'Same flat layer orientation; rotate in XY only. Let the slicer center the part on the plate.',
  instructions: 'Bambu Studio: select the actual A1/nozzle and calibrated PLA profile; import in mm at 100%; center the model; review support and brim coverage and the sliced layers. No printer-specific G-code or support settings supplied.',
  limits: 'Geometry fits the nominal build volume. Brim, supports, exclusion zones and actual adhesion require slicer review. Complete ornament physical comfort remains untested.'
};
await writeFile(path.join(out,'a1_orientation.json'),JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify(receipt));
