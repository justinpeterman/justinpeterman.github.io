import { config, place, logSize, type Rect, type Scene, type BannerRenderer } from '../scene.ts';
import { ground, primitives } from '../primitives.ts';

export function compose(width: number, height: number, safe: Rect[]) {
  const u = config.gridSpacing / 2;
  return place(width, height, safe, [
    { kind: 'logs', ...logSize(width), anchor: [0.87, 0.74] },
    ...width < config.smallScreenWidth ? [] : [
      { kind: 'matrix', width: 6 * u, height: 5 * u, anchor: [0.88, 0.18] as [number, number] },
      { kind: 'frame', width: 10 * u, height: 6 * u, anchor: [0.63, 0.3] as [number, number] },
    ],
  ]);
}

function random(seed: number) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

// The original balanced model and composition are retained as a separate renderer.
export function createBalancedState() {
  const rand = random(config.seed);
  const cells = Array.from({ length: 30 }, () => rand() < config.density ? (rand() < 0.45 ? 2 : 1) : 0);
  let rowIndex = 0;
  const nextRow = () => {
    const rowRand = random(config.seed + rowIndex++ * 97);
    return { indent: Math.floor(rowRand() * 3), segments: Array.from({ length: 3 }, () => 1 + Math.floor(rowRand() * 3)), mark: rowRand() > 0.65 };
  };
  const rows = Array.from({ length: 5 }, nextRow);
  return {
    cells, rows, step: 0,
    advance() {
      this.step++;
      const start = Math.floor(rand() * 5) + Math.floor(rand() * 5) * 6;
      for (const index of [start, start + 1]) cells[index] = (cells[index] + 1) % 3;
      rows.shift(); rows.push(nextRow());
    },
  };
}

export function createBalancedRenderer(): BannerRenderer {
  const state = createBalancedState();
  let scene: Scene;
  return {
    measure(width, height, safe) { scene = compose(width, height, safe); },
    advance() { state.advance(); },
    draw(ctx, palette, time) {
      ground(ctx, scene, palette);
      const { box, line } = primitives(ctx);
      const u = config.gridSpacing / 2;
      for (const motif of scene.motifs) {
        const { x, y } = motif;
        ctx.globalAlpha = config.motifOpacity;
        if (motif.kind === 'matrix') {
          state.cells.forEach((cell, i) => {
            if (cell) box(x + (i % 6) * u, y + Math.floor(i / 6) * u, 6, 6, cell === 2);
          });
        } else if (motif.kind === 'frame') {
          ctx.globalAlpha = config.motifOpacity * 0.55;
          box(x, y, motif.width, motif.height);
          for (const dx of [0, motif.width - 1]) for (const dy of [0, motif.height - 1]) {
            ctx.globalAlpha = config.motifOpacity;
            box(x + dx - 2, y + dy - 2, 5, 5, state.step % 2 === 1 && dx > 0 && dy === 0);
          }
        } else {
          const rows = state.rows.slice(-Math.round(motif.height / u));
          rows.forEach((row, i) => {
            const ry = y + i * u;
            ctx.globalAlpha = config.motifOpacity * (0.35 + (i / rows.length) * 0.65);
            box(x, ry, 4, 4, i === rows.length - 1);
            let rx = x + u + row.indent * 4;
            if (row.mark) { line(rx, ry, rx + 2, ry + 2); line(rx + 2, ry + 2, rx, ry + 4); rx += 8; }
            for (const segment of row.segments) {
              const length = segment * 4;
              if (rx + length > x + motif.width - u) break;
              ctx.fillRect(rx, ry + 1, length, 2);
              rx += length + 4;
            }
            if (i === rows.length - 1) {
              ctx.globalAlpha = config.motifOpacity * (0.65 + 0.15 * Math.sin(time / 650));
              box(x + motif.width - 6, ry - 1, 4, 7, true);
            }
          });
        }
      }
      ctx.globalAlpha = 1;
    },
  };
}
