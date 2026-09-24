import { config, type Scene, type BannerRenderer, type Palette, type Rect } from './scene.ts';
import { ground, primitives } from './primitives.ts';
import { composeWorkbench, createWorkbenchState } from './workbench-model.ts';

export function createWorkbenchRenderer(): BannerRenderer {
  const state = createWorkbenchState();
  let scene: Scene;

  function terminal(ctx: CanvasRenderingContext2D, area: Rect, time: number) {
    const { box, line } = primitives(ctx);
    const pitch = config.workbench.rowHeight;
    const segmentUnit = Math.min(10, Math.max(3, area.width / 32));
    const promptY = area.y + area.height - 10;
    const prompt = (y: number) => {
      line(area.x - 10, y - 3, area.x - 6, y);
      line(area.x - 6, y, area.x - 10, y + 3);
    };
    const segments = (values: number[], y: number, indent: number) => {
      let x = area.x + indent;
      for (const value of values) {
        const length = value * segmentUnit;
        if (x + length > area.x + area.width - 5) break;
        box(x, y - 1, length, 3, true);
        x += length + 7;
      }
    };
    // Lay out newest output above a fixed empty prompt; drop whole old rows.
    let bottom = promptY - pitch;
    for (let index = state.rows.length - 1; index >= 0; index--) {
      const row = state.rows[index];
      const wrapped = !!row.continuation && area.height >= pitch * 4;
      const y = bottom - (wrapped ? pitch * 0.65 : 0);
      if (y < area.y + 4) break;
      ctx.globalAlpha = config.motifOpacity * (0.45 + 0.55 * (index + 1) / state.rows.length);
      if (row.kind === 'command') {
        prompt(y);
        segments(row.segments, y, 0);
      } else {
        // Deeper indentation distinguishes evaluated output.
        ctx.globalAlpha *= 0.8;
        segments(row.segments, y, 16);
        if (wrapped) segments(row.continuation!, bottom, 16);
      }
      bottom = y - pitch * (row.kind === 'command' ? 1.15 : 0.8);
    }
    ctx.globalAlpha = config.motifOpacity * 0.8;
    prompt(promptY);
    // Unscaled active time keeps a steady blink even during hover acceleration.
    // Reduced motion supplies time=0, leaving the cursor visible.
    if (Math.floor(time / 1000) % 2 === 0) {
      // Match the prompt strokes' half-pixel vertical center.
      ctx.fillRect(Math.round(area.x), Math.round(promptY) - 3.5, 4, 8);
    }
  }

  function inspector(ctx: CanvasRenderingContext2D, area: Rect, palette: Palette, full: boolean) {
    const { box, line } = primitives(ctx);
    const pitch = Math.min(config.workbench.rowHeight, Math.floor((area.height - 12) / 5));
    const split = Math.round(area.width * 0.56);
    const treeWidth = full ? split - 12 : area.width;
    const x = area.x, y = area.y;
    const depths = [0, 1, 2, 2, 1, 0];
    const lengths = [25, 28, 18, 22, 28, 25];
    const selectedNode = state.selectedNode;
    const bracket = (bx: number, by: number, close = false) => {
      line(bx + (close ? 0 : 4), by - 4, bx + (close ? 4 : 0), by);
      line(bx + (close ? 4 : 0), by, bx + (close ? 0 : 4), by + 4);
    };
    ctx.fillStyle = ctx.strokeStyle = palette.accentColor;
    const selectionX = Math.max(0, depths[selectedNode] * 12 - 5);
    ctx.globalAlpha = config.motifOpacity * 0.55;
    box(x + selectionX, y + selectedNode * pitch - 9, treeWidth - selectionX, 18, true);
    ctx.globalAlpha = config.motifOpacity * 0.5;
    line(x + 4, y + 8, x + 4, y + 4 * pitch);
    line(x + 16, y + pitch + 8, x + 16, y + 3 * pitch);
    depths.forEach((depth, index) => {
      const rx = x + depth * 12, ry = y + index * pitch;
      ctx.globalAlpha = config.motifOpacity * (index === selectedNode ? 1.6 : 1);
      if (index < 2) {
        ctx.beginPath(); ctx.moveTo(rx, ry - 3); ctx.lineTo(rx + 6, ry - 3); ctx.lineTo(rx + 3, ry + 1); ctx.fill();
      }
      const tx = rx + 11;
      bracket(tx, ry);
      let start = tx + 8;
      if (index >= 4) { line(start, ry + 4, start + 3, ry - 4); start += 7; }
      const length = Math.min(lengths[index], treeWidth - depth * 12 - 40);
      box(start, ry - 1, length, 3, true);
      let end = start + length + 5;
      // An attribute inside the parent tag; never a readable identifier.
      if (index === 1 && end + 28 < x + treeWidth) {
        ctx.globalAlpha *= 0.7;
        box(end, ry - 1, 12, 2, true);
        end += 18;
      }
      if (index === 2 || index === 3) { line(end, ry + 4, end + 3, ry - 4); end += 8; }
      bracket(end, ry, true);
    });
    if (!full) return;
    ctx.globalAlpha = config.motifOpacity * 0.4;
    line(x + split, y - 10, x + split, y + area.height - 4);
    const sx = x + split + 12;
    const space = area.width - split - 24;
    const rowPitch = Math.min(21, Math.floor((area.height - 12) / 10));
    const brace = (bx: number, by: number, close = false) => {
      const points = [[5, 0], [2, 0], [2, 4], [0, 6], [2, 8], [2, 12], [5, 12]];
      for (let i = 1; i < points.length; i++) {
        const [ax, ay] = points[i - 1], [cx, cy] = points[i];
        line(bx + (close ? 5 - ax : ax), by + ay, bx + (close ? 5 - cx : cx), by + cy);
      }
    };
    const selector = (sy: number, width: number) => {
      ctx.globalAlpha = config.motifOpacity * 1.1;
      box(sx, sy + 5, 2, 2, true);
      box(sx + 6, sy + 4, width, 3, true);
      brace(sx + width + 13, sy);
    };
    const declaration = (sy: number, index: number, overridden = false) => {
      ctx.globalAlpha = config.motifOpacity * (overridden ? 0.65 : index === state.focusedRule ? 1.5 : 1);
      // Enable-state squares belong inside CSS rule blocks, before declarations.
      const checkX = Math.round(sx + 6), checkY = Math.round(sy);
      box(checkX, checkY, 9, 9, false);
      if (!overridden) {
        ctx.save();
        ctx.globalAlpha = config.motifOpacity * 1.5;
        ctx.lineWidth = 1.25;
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(checkX + 2, checkY + 4.5);
        ctx.lineTo(checkX + 4, checkY + 6.5);
        ctx.lineTo(checkX + 7, checkY + 2.5);
        ctx.stroke();
        ctx.restore();
      }
      const px = sx + 20, propertyWidth = Math.min(23, space * 0.22);
      const propertyLength = index === 0 || overridden ? propertyWidth : propertyWidth * 0.75;
      box(px, sy + 4, propertyLength, 3, true);
      const colon = px + propertyWidth + 4;
      box(colon, sy + 3, 1, 1, true);
      box(colon, sy + 6, 1, 1, true);
      const vx = colon + 7;
      const valueWidth = Math.max(3, Math.min(state.styleValues[index], sx + space - vx - 6));
      box(vx, sy + 4, valueWidth, 3, true);
      const end = vx + valueWidth;
      box(end + 4, sy + 3, 1, 1, true);
      line(end + 4, sy + 6, end + 3, sy + 8);
      if (overridden) line(px, sy + 5, end + 5, sy + 5);
    };
    selector(y - 3, Math.min(30, space * 0.35));
    for (let i = 0; i < 3; i++) declaration(y - 3 + (i + 1) * rowPitch, i);
    ctx.globalAlpha = config.motifOpacity * 0.9;
    brace(sx, y - 3 + 4 * rowPitch, true);
    const secondY = y - 3 + 6 * rowPitch;
    ctx.globalAlpha = config.motifOpacity * 0.3;
    line(x + split + 1, secondY - 9, x + area.width + 18, secondY - 9);
    selector(secondY, Math.min(21, space * 0.28));
    declaration(secondY + rowPitch, 3, true);
    declaration(secondY + 2 * rowPitch, 2);
    ctx.globalAlpha = config.motifOpacity * 0.8;
    brace(sx, secondY + 3 * rowPitch, true);
  }

  return {
    frameKey(ambientTime) { return state.step * 2 + Math.floor(ambientTime / 1000) % 2; },
    hasMotion() { return !!scene?.motifs.length; },
    hitTest(x, y) {
      return scene?.motifs.some(panel => x >= panel.x && x <= panel.x + panel.width && y >= panel.y && y <= panel.y + panel.height) ?? false;
    },
    measure(width, height, safe) { scene = composeWorkbench(width, height, safe); },
    advance() { state.advance(); },
    draw(ctx, palette, ambientTime) {
      ground(ctx, scene, palette);
      const { line } = primitives(ctx);
      for (const panel of scene.motifs) {
        const { x, y, width, height } = panel;
        ctx.globalAlpha = 1;
        ctx.fillStyle = palette.panelBackgroundColor || palette.backgroundColor;
        // Cover the grid completely, including fractional CSS-pixel edges.
        ctx.fillRect(x, y, width, Math.ceil(height));
        ctx.fillStyle = ctx.strokeStyle = palette.accentColor;
        const divider = y + Math.round(height * 0.57);
        ctx.globalAlpha = config.motifOpacity * 0.85;
        line(x, y, x, y + height);
        line(x, divider, x + width, divider);
        inspector(ctx, { x: x + 18, y: y + 24, width: width - 36, height: divider - y - 24 }, palette, panel.kind === 'workbench');
        ctx.fillStyle = ctx.strokeStyle = palette.accentColor;
        terminal(ctx, { x: x + 24, y: divider + 18, width: width - 48, height: height - (divider - y) - 24 }, ambientTime);
      }
      ctx.globalAlpha = 1;
    },
  };
}
