// Encode the hero banner's looping dog video for the web.
//
// Run this when the source animation changes. The output is committed —
// `public/hero-dog-loop.mp4` and `public/hero-dog-poster.webp` — because the
// build is a static SPA with no asset pipeline.
//
//   node scripts/encode-hero-loop.mjs path/to/source.mp4
//
// Requires ffmpeg on PATH.
//
// ─── WHAT THIS DOES TO THE SOURCE, AND WHY ────────────────────────────────
//
// The source off the renderer is 1080x1920, 24fps, 10s, ~2.9MB, with a stereo
// AAC track. Three of those are wrong for a hero banner:
//
//   AUDIO IS STRIPPED. The banner is decorative and plays muted forever; an
//   audio track is bytes that can never be heard. It is also the thing most
//   likely to get an autoplay blocked, and a muted video with no audio track
//   at all is the least ambiguous case for every browser's autoplay policy.
//
//   1080 WIDE IS THROWN AWAY. The box is at most 370 CSS px, so even a 2x
//   display asks for 740 device pixels. 720 is within 3% of that and encodes
//   on clean macroblock boundaries. Shipping 1080 would be paying for detail
//   no display in the layout can show.
//
//   FASTSTART moves the moov atom to the front, so the browser can begin
//   playing on the first bytes instead of waiting for the whole file.
//
// ─── WHY CRF 27 ───────────────────────────────────────────────────────────
//
// Measured on this footage at 720x1280, SSIM against the scaled source:
//
//     crf 24   768 KB   SSIM 0.9938
//     crf 27   522 KB   SSIM 0.9919   <- chosen
//     crf 30   366 KB   SSIM 0.9890
//
// The footage is a character on a smooth gradient, and a smooth gradient is
// exactly what 8-bit H.264 bands on, so the frame at crf 27 was checked for
// banding rather than trusted to the SSIM figure. It is clean. crf 30 saves
// another 156 KB and starts to soften the fur; crf 24 costs 246 KB for 0.002.
//
// ─── THE LOOP SEAM ────────────────────────────────────────────────────────
//
// The source is built to loop, and nearly does: mean absolute difference
// between the first and last frame is 1.75/255, against 0.16-0.29 for an
// ordinary frame-to-frame step and 13.66 for two frames half the animation
// apart. A ~0.7% discontinuity once every 10 seconds is not perceptible, so
// this ships as a plain `loop` rather than as a ping-pong, which would have
// doubled the file to solve a problem the footage does not have.

import { execFileSync } from 'node:child_process';
import { statSync } from 'node:fs';

/** Matches the hero box at 2x. See the note above before changing. */
const WIDTH = 720;
const HEIGHT = 1280;

/** Measured above. Lower starts to band the background gradient. */
const CRF = 27;

const VIDEO_OUT = 'public/hero-dog-loop.mp4';
const POSTER_OUT = 'public/hero-dog-poster.webp';

const source = process.argv[2];
if (source === undefined) {
  console.error('usage: node scripts/encode-hero-loop.mjs <source.mp4>');
  process.exit(1);
}

const scale = `scale=${WIDTH}:${HEIGHT}:flags=lanczos`;

execFileSync(
  'ffmpeg',
  [
    '-v', 'error',
    '-y',
    '-i', source,
    '-an',
    '-vf', scale,
    '-c:v', 'libx264',
    '-profile:v', 'high',
    '-crf', String(CRF),
    '-preset', 'slow',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    VIDEO_OUT,
  ],
  { stdio: 'inherit' },
);

// Frame 0, which is what the <video poster> shows until playback starts —
// and the only thing shown at all under prefers-reduced-motion.
execFileSync(
  'ffmpeg',
  [
    '-v', 'error',
    '-y',
    '-i', source,
    '-frames:v', '1',
    '-vf', scale,
    '-c:v', 'libwebp',
    '-quality', '78',
    POSTER_OUT,
  ],
  { stdio: 'inherit' },
);

const kb = (path) => `${(statSync(path).size / 1024).toFixed(0)} KB`;
console.log(`${VIDEO_OUT}  ${kb(VIDEO_OUT)}  (${WIDTH}x${HEIGHT}, crf ${CRF}, no audio)`);
console.log(`${POSTER_OUT}  ${kb(POSTER_OUT)}`);
