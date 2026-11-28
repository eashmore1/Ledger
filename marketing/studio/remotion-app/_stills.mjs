// Quick preview stills for any composition (one bundle, many frames):
//   cd marketing/studio/remotion-app && node _stills.mjs LedgerScroll-A /tmp/s 0.5,3,9
// usage: node stills.mjs <compId> <outPrefix> <t1,t2,...>
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import path from "path";
const [comp, out, ts] = process.argv.slice(2);
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), enableCaching: true });
const browserExecutable = "/opt/pw-browsers/chromium_headless_shell-1254/chrome-headless-shell-linux64/chrome-headless-shell";
const chromiumOptions = { gl: "swangle" };
const composition = await selectComposition({ serveUrl, id: comp, browserExecutable, chromiumOptions, inputProps: {} });
for (const t of ts.split(",").map(Number)) {
  const frame = Math.min(composition.durationInFrames - 1, Math.round(t * 30));
  await renderStill({ serveUrl, composition, frame, output: `${out}-${String(frame).padStart(4, "0")}.jpg`, imageFormat: "jpeg", jpegQuality: 80, browserExecutable, chromiumOptions, scale: 0.4 });
  console.log("still", frame);
}
