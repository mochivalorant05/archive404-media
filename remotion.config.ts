import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
// Three.js needs WebGL in headless Chrome. "angle" uses the GPU when one is
// available; set REMOTION_GL=swangle on machines without a GPU (e.g. CI / cloud).
Config.setChromiumOpenGlRenderer(
  (process.env.REMOTION_GL as "angle" | "swangle" | "egl" | undefined) ?? "angle",
);
// WebGL renders are heavy; one tab per core can exhaust memory.
Config.setConcurrency(2);
