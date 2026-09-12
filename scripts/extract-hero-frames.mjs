// Regenerate the hero dog's cursor-tracking frames from the source video.
//
// Run this ONLY when the source animation changes. The output is committed —
// `public/hero-dog/` — because the build is a static SPA with no asset
// pipeline, and because the frame range below was chosen by measurement, not
// by eye. Re-deriving it on every build would invite someone to "fix" the
// range without redoing the measurement.
//
//   node scripts/extract-hero-frames.mjs path/to/hero-dog.mp4
//
// Requires ffmpeg on PATH.
//
// ─── WHY FRAMES 57–90, AND NOT 0–60 ───────────────────────────────────────
//
// The source is an 8-second loop of the dog looking around — NOT a single
// left-to-right pan. Tracking the horizontal position of the nose (the only
// near-black feature in the head band) across all 240 frames gives:
//
//     frame   0   nose at x=29.3   facing forward
//     frame  28   nose at x=14.2   full left profile     <- leftmost
//     frame  57   nose at x=14.5   still holding left
//     frame  73   nose at x=29.4   facing forward
//     frame  90   nose at x=38.5   full right profile    <- rightmost
//
//   (x measured in a 64px-wide downsample; centre is 32.)
//
// The previous implementation mapped the cursor onto 0–2.0s — frames 0–60 —
// which had two faults that no amount of render performance could fix:
//
//   1. INVERTED. Cursor at the left edge showed frame 0 (forward), cursor at
//      the centre showed frame 30 (looking hard LEFT). Moving the cursor
//      right turned the dog's head left.
//   2. HALF DEAD. 29 of the 31 frames in 30–60 sit within 1px of each other.
//      The entire right half of the hero produced no visible change.
//
// Frames 57–90 are the one long monotonic sweep in the whole animation, and
// they happen to run leftmost → rightmost, so cursor position maps onto head
// direction directly. Frame 73 — the neutral forward pose — falls at index 16
// of 34, near enough the middle to be the rest position.
//
// ─── WHY WebP q80 ─────────────────────────────────────────────────────────
//
// Measured on this footage, 34 frames at 512x910:
//
//     q72   556 KB   SSIM 0.980
//     q80   692 KB   SSIM 0.984   <- chosen
//     q88  1036 KB   SSIM 0.989
//
// q88 costs another 344 KB for 0.005 of SSIM. q72 saves 136 KB but narrows
// the margin against banding on the flat background gradient, which is the
// one thing this footage is actually fragile about.
//
// AVIF at comparable quality came in ~20% smaller (≈500 KB), and was rejected
// anyway: all 34 frames must be decoded before the interaction is ready, and
// AV1 intra decode is several times slower than WebP's. The point of this
// asset is to be ready quickly.

import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, readdirSync, renameSync, statSync } from 'node:fs';
import { join } from 'node:path';

/** First and last frame of the monotonic left-to-right head sweep. */
const FIRST_FRAME = 57;
const LAST_FRAME = 90;

/** Measured above. Raising it buys almost nothing; lowering it risks banding. */
const QUALITY = 80;

const OUT_DIR = 'public/hero-dog';

const source = process.argv[2];
if (source === undefined) {
  console.error('usage: node scripts/extract-hero-frames.mjs <source.mp4>');
  process.exit(1);
}

rmSync(OUT_DIR, { recursive: true, force: true });
mkdirSync(OUT_DIR, { recursive: true });

// libwebp's image2 muxer numbers from 1; the frames are renamed to 0-based
// below so that the filename matches the frame index the renderer computes.
execFileSync(
  'ffmpeg',
  [
    '-v', 'error',
    '-y',
    '-i', source,
    '-vf', `select='between(n,${FIRST_FRAME},${LAST_FRAME})'`,
    '-fps_mode', 'passthrough',
    '-c:v', 'libwebp',
    '-quality', String(QUALITY),
    '-compression_level', '6',
    '-preset', 'picture',
    join(OUT_DIR, 'tmp-%02d.webp'),
  ],
  { stdio: 'inherit' },
);

const produced = readdirSync(OUT_DIR).filter((name) => name.startsWith('tmp-')).sort();
const expected = LAST_FRAME - FIRST_FRAME + 1;
if (produced.length !== expected) {
  console.error(`expected ${expected} frames, got ${produced.length}`);
  process.exit(1);
}

let total = 0;
produced.forEach((name, index) => {
  const target = join(OUT_DIR, `frame-${String(index).padStart(2, '0')}.webp`);
  renameSync(join(OUT_DIR, name), target);
  total += statSync(target).size;
});

console.log(
  `${produced.length} frames -> ${OUT_DIR}/frame-00..${String(produced.length - 1).padStart(2, '0')}.webp ` +
    `(${(total / 1024).toFixed(0)} KB total, ${(total / produced.length / 1024).toFixed(1)} KB each)`,
);
console.log(
  'If the frame COUNT changed, update FRAME_COUNT in src/components/HomePage.tsx to match.',
);
