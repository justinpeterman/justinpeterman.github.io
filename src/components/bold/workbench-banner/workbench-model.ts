import { config, type Rect, type Scene } from './scene.ts';

// Only dock in real space to the right of ALL heading lines. Never mask text or
// squeeze a miniature IDE into the remaining space on a phone.
export function composeWorkbench(width: number, height: number, safe: Rect[]): Scene {
  const unit = config.gridSpacing / 2;
  const snap = (n: number) => Math.ceil(n / unit) * unit;
  const textRight = Math.max(0, ...safe.map(rect => rect.x + rect.width));
  const x = snap(Math.max(width * (1 - config.workbench.widthFraction), textRight + unit));
  const available = width - x;
  const panelHeight = height;
  const scene: Scene = { width, height, small: width < config.smallScreenWidth, motifs: [] };
  if (!scene.small && available >= 12 * unit && panelHeight >= 14 * unit) {
    scene.motifs.push({ kind: available >= 22 * unit ? 'workbench' : 'compact', x, y: 0, width: available, height: panelHeight });
  }
  return scene;
}

// Eight beats: rest → parent → sibling inspection → return to the original node.
// These are illustrative operation records, not telemetry or fabricated code.
const transcript = [
  [3, 5, 2, 4], [2, 4, 6], [4, 2, 3, 5], [2, 3, 2],
  [3, 6, 2, 3], [2, 4, 3], [5, 2, 4, 2], [3, 2, 5],
];

export type ConsoleRow = {
  kind: 'command' | 'result';
  segments: number[];
  continuation?: number[];
};

export function createWorkbenchState(seed = config.seed) {
  // Seed shifts a fixed vocabulary once; geometry never randomizes per frame.
  const offset = ((Math.trunc(seed) % transcript.length) + transcript.length) % transcript.length;
  const vocabulary: ConsoleRow[] = transcript.map((_, index) => ({
    kind: index % 2 ? 'command' : 'result',
    segments: [...transcript[(index + offset) % transcript.length]],
    ...(index === 4 ? { continuation: [2, 3] } : {}),
  }));
  // Precompute a bounded, cyclic transcript: every result follows its command.
  const frames = vocabulary.map((_, beat) => Array.from({ length: 6 }, (_, i) => vocabulary[(beat - 5 + i + 8) % 8]));
  let step = 0;
  return {
    get step() { return step; },
    get selectedNode() { return step === 1 ? 1 : step >= 2 && step <= 5 ? 2 : 3; },
    get focusedRule() { return step === 2 || step === 3 ? 0 : step === 4 || step === 5 ? 1 : -1; },
    get styleValues() { return this.selectedNode === 2 ? [32, 24, 18, 20] : this.selectedNode === 1 ? [20, 32, 24, 28] : [24, 18, 30, 20]; },
    get rows() { return frames[step]; },
    advance() {
      step = (step + 1) % 8;
    },
  };
}
