import { test } from "node:test";
import assert from "node:assert/strict";
import { WalkCycles } from "../src/walk";

test("walk poses follow distance, preserve turns, and hold while stopped", () => {
  const cycle = new WalkCycles();
  assert.equal(cycle.frame("waiter", { x: 0, y: 0 }, false), 0);
  assert.equal(cycle.frame("waiter", { x: 0.2, y: 0 }, true), 1);
  assert.equal(cycle.frame("waiter", { x: 0.4, y: 0 }, true), 2);
  assert.equal(cycle.frame("waiter", { x: 0.4, y: 0.2 }, true), 3);
  for (let i = 0; i < 30; i++)
    assert.equal(cycle.frame("waiter", { x: 0.4, y: 0.2 }, false), 3);
  assert.equal(cycle.frame("waiter", { x: 0.4, y: 0.4 }, true), 4);
  cycle.frame("fast", { x: 0, y: 0 }, false);
  assert.equal(cycle.frame("fast", { x: 0.8, y: 0 }, true), 4);
  assert.equal(cycle.frame("waiter", { x: 1.2, y: 0.4 }, true), 0);
});
