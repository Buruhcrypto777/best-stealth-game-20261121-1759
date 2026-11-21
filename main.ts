// NIGHTSHIFT: The Meridian Archive — the program that hands the game in.
// Runs on Node 22 with the standard library only. It copies the
// playable game and its screenshots from beside this file into the
// output directory, then writes the dossier the judge reads, using
// the vendored make.fun library.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

// The repository root is the folder this file lives in.
const repoRoot = fileURLToPath(new URL('.', import.meta.url));

// The grader gives us /output; a local run uses MAKEFUN_OUTPUT_DIR.
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The scorer's own caps, so a local run refuses exactly what the
// gate would refuse: at most 4 screenshots of 256 KiB each, at
// most 993 files and 48 MiB under game/, and no game/ path over
// 1000 bytes. The dossier text itself is capped at 160 KiB.
const dossierLimits = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

function copyTree(fromDir, toDir) {
  mkdirSync(toDir, { recursive: true });
  cpSync(fromDir, toDir, { recursive: true });
}

function handIn() {
  // Start clean so a stale file from an earlier run can never ride along.
  rmSync(outputDir, { recursive: true, force: true });
  mkdirSync(outputDir, { recursive: true });

  copyTree(join(repoRoot, 'game'), join(outputDir, 'game'));

  const screenshotsDir = join(repoRoot, 'screenshots');
  if (existsSync(screenshotsDir)) {
    copyTree(screenshotsDir, join(outputDir, 'screenshots'));
  }

  // The dossier is rebuilt from the copied files, so it always
  // describes exactly what the grader will see in /output.
  const dossier = buildDossier(outputDir, dossierLimits);
  writeFileSync(join(outputDir, 'dossier.json'), dossier);
}

handIn();
