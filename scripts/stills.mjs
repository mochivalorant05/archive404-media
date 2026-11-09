// Render a set of frames (seconds) of a composition to PNGs with one bundle.
// usage: node scripts/stills.mjs <compositionId> <outDir> <scale> <t1> <t2> ...
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import path from "node:path";
import fs from "node:fs";

const [id, outDir, scale, ...times] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const browserExecutable = process.env.REMOTION_BROWSER || null;
const chromiumOptions = { gl: process.env.REMOTION_GL || "angle" };
const composition = await selectComposition({ serveUrl, id, browserExecutable, chromiumOptions });
for (const t of times) {
  const frame = Math.min(composition.durationInFrames - 1, Math.round(Number(t) * composition.fps));
  const output = path.join(outDir, `${id}_${String(t).padStart(5, "0")}.png`);
  await renderStill({ serveUrl, composition, frame, output, scale: Number(scale), browserExecutable, chromiumOptions });
  console.log("wrote", output);
}
