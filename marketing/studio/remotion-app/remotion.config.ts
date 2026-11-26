/**
 * Note: When using the Node.JS APIs, the config file
 * doesn't apply. Instead, pass options directly to the APIs.
 *
 * All configuration options: https://remotion.dev/docs/config
 */

import { Config } from "@remotion/cli/config";
import fs from "fs";

Config.setRspack(true);
Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(95);
Config.setOverwriteOutput(true);
Config.setDefaultPremountInSeconds(2);

// WebGL without a GPU: SwiftShader through ANGLE renders Three.js reliably headless.
Config.setChromiumOpenGlRenderer("swangle");

// Remotion normally downloads its own headless browser from remotion.media.
// Where that host is blocked (sandboxed cloud sessions), use the preinstalled one.
const LOCAL_SHELL =
  "/opt/pw-browsers/chromium_headless_shell-1254/chrome-headless-shell-linux64/chrome-headless-shell";
if (fs.existsSync(LOCAL_SHELL)) Config.setBrowserExecutable(LOCAL_SHELL);
