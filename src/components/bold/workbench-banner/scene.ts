export type Variation = 'balanced' | 'workbench';

export const config = {
  variation: 'workbench' as Variation,
  gridSpacing: 24,
  gridOpacity: 0.045,
  motifOpacity: 0.28,
  density: 0.55,
  motionSpeed: 2,
  logIntervalMs: 2100,
  seed: 333,
  maxDpr: 2,
  introDurationMs: Infinity,
  safePadding: 16,
  smallScreenWidth: 600,
  workbench: {
    widthFraction: 0.34,
    rowHeight: 28,
    hoverSpeedMultiplier: 5,
  },
};

export type Rect = { x: number; y: number; width: number; height: number };
export type Motif = Rect & { kind: string };
export type Scene = { width: number; height: number; motifs: Motif[]; small: boolean };
export type Palette = { accentColor: string; backgroundColor: string; panelBackgroundColor?: string };
export type BannerRenderer = {
  hasMotion?(): boolean;
  hitTest?(x: number, y: number): boolean;
  measure(width: number, height: number, safe: Rect[]): void;
  advance(): void;
  draw(ctx: CanvasRenderingContext2D, palette: Palette, time: number, ambientTime?: number): void;
};
export type Placement = { kind: string; width: number; height: number; anchor: [number, number] };

function overlaps(a: Rect, b: Rect, gap = 0) {
  return a.x < b.x + b.width + gap && a.x + a.width + gap > b.x &&
    a.y < b.y + b.height + gap && a.y + a.height + gap > b.y;
}

// Shared collision avoidance only. Each renderer supplies its own composition.
export function place(width: number, height: number, safe: Rect[], specs: Placement[]): Scene {
  const u = config.gridSpacing / 2;
  const motifs: Motif[] = [];
  for (const spec of specs) {
    let best: Motif | undefined;
    let score = Infinity;
    for (let y = u; y + spec.height <= height - u; y += u) {
      for (let x = u; x + spec.width <= width - u; x += u) {
        const candidate = { kind: spec.kind, width: spec.width, height: spec.height, x, y };
        if (safe.some(rect => overlaps(candidate, rect)) || motifs.some(rect => overlaps(candidate, rect, u * 2))) continue;
        const distance = (x - (width - spec.width) * spec.anchor[0]) ** 2 + (y - (height - spec.height) * spec.anchor[1]) ** 2;
        if (distance < score) { best = candidate; score = distance; }
      }
    }
    if (best) motifs.push(best);
  }
  return { width, height, motifs, small: width < config.smallScreenWidth };
}

export function logSize(width: number) {
  const u = config.gridSpacing / 2;
  const small = width < config.smallScreenWidth;
  return { width: (small ? 8 : 12) * u, height: (small ? (width < 360 ? 3 : 4) : 5) * u };
}
