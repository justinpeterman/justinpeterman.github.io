export const config = {
  gridSpacing: 24,
  gridOpacity: 0.045,
  motifOpacity: 0.28,
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
  frameKey(ambientTime: number): number;
  hasMotion(): boolean;
  hitTest(x: number, y: number): boolean;
  measure(width: number, height: number, safe: Rect[]): void;
  advance(): void;
  draw(ctx: CanvasRenderingContext2D, palette: Palette, ambientTime: number): void;
};
