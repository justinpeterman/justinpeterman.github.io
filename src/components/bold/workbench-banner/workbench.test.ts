import { test } from 'node:test';
import assert from 'node:assert/strict';
import { composeWorkbench, createWorkbenchState } from './workbench-model.ts';
import { createWorkbenchRenderer } from './renderers/workbench.ts';

test('workbench docks outside measured text, simplifies and omits when crowded', () => {
  const fixtures = [
    { width: 1278, height: 405, safe: [{ x: 14, y: 54, width: 764, height: 344 }], kind: 'workbench' },
    { width: 766, height: 235, safe: [{ x: 14, y: 33, width: 422, height: 199 }], kind: 'compact' },
  ];
  for (const { width, height, safe, kind } of fixtures) {
    const scene = composeWorkbench(width, height, safe);
    assert.equal(scene.motifs.length, 1);
    const panel = scene.motifs[0];
    assert.equal(panel.kind, kind);
    assert.ok(panel.x >= 0 && panel.y >= 0);
    assert.ok(panel.x + panel.width <= width && panel.y + panel.height <= height);
    assert.equal(panel.y, 0);
    assert.equal(panel.x + panel.width, width);
    assert.equal(panel.height, height);
    for (const rect of safe) assert.ok(panel.x >= rect.x + rect.width || panel.y + panel.height <= rect.y);
  }
  assert.deepEqual(composeWorkbench(320, 165, [{ x: 0, y: 0, width: 320, height: 165 }]).motifs, []);
  for (const width of [320, 390, 599]) assert.deepEqual(composeWorkbench(width, 405, []).motifs, []);
});

test('a second longer foreground line determines the dock boundary', () => {
  const scene = composeWorkbench(1280, 405, [
    { x: 24, y: 60, width: 440, height: 160 },
    { x: 24, y: 200, width: 940, height: 160 },
  ]);
  assert.ok(scene.motifs[0].x >= 964);
});

test('workbench hit testing follows the measured dock bounds', () => {
  const renderer = createWorkbenchRenderer();
  renderer.measure(1280, 405, [{ x: 24, y: 60, width: 720, height: 300 }]);
  assert.equal(renderer.hitTest?.(1279, 200), true);
  assert.equal(renderer.hitTest?.(100, 200), false);

  renderer.measure(390, 200, []);
  assert.equal(renderer.hitTest?.(389, 100), false);
});

test('console alternates commands and results, remains seeded and repeats without a reset', () => {
  const a = createWorkbenchState(333), b = createWorkbenchState(333);
  const initial = structuredClone(a.rows);
  for (let step = 0; step < 24; step++) {
    const old = [...a.rows];
    a.advance(); b.advance();
    assert.deepEqual(a.rows.slice(0, -1), old.slice(1));
    assert.equal(a.rows.length, 6);
    assert.notEqual(a.rows.at(-1)!.kind, old.at(-1)!.kind);
    if (a.rows.at(-1)!.continuation) assert.equal(a.rows.at(-1)!.kind, 'result');
    assert.deepEqual(a.rows, b.rows);
    if ((step + 1) % 8 === 0) {
      assert.deepEqual(a.rows, initial);
      assert.equal(a.step, 0);
    }
  }
  assert.notDeepEqual(createWorkbenchState(42).rows, initial);
});

test('style focus follows deliberate inspect, compare, settle order', () => {
  const state = createWorkbenchState();
  const focus = [];
  for (let i = 0; i < 8; i++) { focus.push(state.focusedRule); state.advance(); }
  assert.deepEqual(focus, [-1, -1, 0, 0, 1, 1, -1, -1]);
});

test('tree visits the parent and sibling, holds during inspection, then returns seamlessly', () => {
  const state = createWorkbenchState();
  const selected = [];
  for (let i = 0; i < 8; i++) {
    selected.push(state.selectedNode);
    if (state.focusedRule !== -1) assert.equal(state.selectedNode, 2);
    state.advance();
  }
  assert.deepEqual(selected, [3, 1, 2, 2, 2, 2, 3, 3]);
  assert.equal(state.selectedNode, selected[0]);
});
