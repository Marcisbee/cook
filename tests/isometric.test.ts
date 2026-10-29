import { test } from "node:test";
import assert from "node:assert/strict";
import { depthOrder, Drawable } from "../src/depth";
import { project, unproject, footprintCorners } from "../src/isometric";

test("long furniture occludes a guest at its rear corner, and releases the front corner", () => {
  const draw = () => {};
  const bench: Drawable = {
    position: { x: 0, y: 2 },
    footprint: [4, 1],
    height: 40,
    depth: 2,
    draw,
  };
  const guest: Drawable = {
    position: { x: 1.7, y: 1.3 },
    footprint: [0.3, 0.3],
    height: 56,
    depth: 3,
    draw,
  };
  assert.deepEqual(depthOrder([bench, guest]), [guest, bench]);
  const front = { ...guest, position: { x: -1.7, y: 2.7 }, depth: 1 };
  assert.deepEqual(depthOrder([front, bench]), [bench, front]);
});
test("elevated tabletop picking and rectangular footprints share the 2:1 grid", () => {
  assert.deepEqual(unproject({ x: 490, y: 193 }, 28), { x: 5, y: 2 });
  assert.deepEqual(project({ x: 5, y: 2 }, 28), { x: 490, y: 193 });
  assert.deepEqual(footprintCorners({ x: 0, y: 0 }, [2, 1]), [
    { x: 385, y: 93.5 },
    { x: 445, y: 123.5 },
    { x: 415, y: 138.5 },
    { x: 355, y: 108.5 },
  ]);
});
