import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compose as balanced, createBalancedState } from './renderers/balanced.ts';

test('balanced composition fits measured foreground at varied widths', () => {
  for (const width of [320, 390, 768, 1024, 1280]) {
    const height = width < 600 ? 165 : 360;
    const safe = [{ x: 18, y: 48, width: width * 0.5, height: height - 68 }];
    const scene = balanced(width, height, safe);
    assert.ok(scene.motifs.length > 0);
    if (width < 600) assert.equal(scene.motifs.length, 1);
    for (const [index, motif] of scene.motifs.entries()) {
      assert.ok(motif.x >= 0 && motif.y >= 0);
      assert.ok(motif.x + motif.width <= width && motif.y + motif.height <= height);
      for (const other of [...safe, ...scene.motifs.slice(index + 1)]) {
        assert.ok(motif.x >= other.x + other.width || motif.y >= other.y + other.height ||
          motif.x + motif.width <= other.x || motif.y + motif.height <= other.y);
      }
    }
  }
  assert.deepEqual(balanced(320, 160, [{ x: 0, y: 0, width: 320, height: 160 }]).motifs, []);
});

test('original balanced renderer retains seeded neighboring-pair updates and one-row advancement', () => {
  const a = createBalancedState();
  const b = createBalancedState();
  for (let step = 0; step < 20; step++) {
    const cells = [...a.cells];
    const rows = [...a.rows];
    a.advance(); b.advance();
    assert.deepEqual(a.cells, b.cells);
    assert.deepEqual(a.rows, b.rows);
    assert.deepEqual(a.rows.slice(0, 4), rows.slice(1));
    const changed = cells.flatMap((cell, index) => cell === a.cells[index] ? [] : [index]);
    assert.equal(changed.length, 2);
    assert.equal(changed[1] - changed[0], 1);
    assert.equal(Math.floor(changed[0] / 6), Math.floor(changed[1] / 6));
  }
});
