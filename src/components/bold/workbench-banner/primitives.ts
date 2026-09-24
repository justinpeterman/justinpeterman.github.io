import { config, type Palette, type Scene } from './scene.ts';

export function primitives(ctx: CanvasRenderingContext2D) {
  const line = (x1: number, y1: number, x2: number, y2: number) => {
    ctx.beginPath(); ctx.moveTo(Math.round(x1) + 0.5, Math.round(y1) + 0.5);
    ctx.lineTo(Math.round(x2) + 0.5, Math.round(y2) + 0.5); ctx.stroke();
  };
  const box = (x: number, y: number, w: number, h: number, filled = false) => {
    if (filled) ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
    else ctx.strokeRect(Math.round(x) + 0.5, Math.round(y) + 0.5, Math.round(w) - 1, Math.round(h) - 1);
  };
  return { line, box };
}

export function ground(ctx: CanvasRenderingContext2D, scene: Scene, palette: Palette, registration = true) {
  const { width, height } = scene;
  const { gridSpacing: g, gridOpacity } = config;
  const { line } = primitives(ctx);
  ctx.globalAlpha = 1;
  ctx.fillStyle = palette.backgroundColor;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = ctx.strokeStyle = palette.accentColor;
  ctx.lineWidth = 1;
  ctx.globalAlpha = gridOpacity;
  for (let x = g; x < width; x += g) line(x, 0, x, height);
  for (let y = g; y < height; y += g) line(0, y, width, y);
  ctx.globalAlpha = gridOpacity * 2;
  for (const [x, y] of registration ? [[g, g], [Math.floor((width - g) / g) * g, Math.floor((height - g) / g) * g]] : []) {
    line(x - 3, y, x + 3, y); line(x, y - 3, x, y + 3);
  }
}
