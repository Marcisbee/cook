import test from "node:test";
import assert from "node:assert/strict";
import { newGame, update, readSave, Game, isQueued } from "../src/game";
function run(g: Game, n: number) {
  for (let i = 0; i < n * 20; i++)
    g = update(g, { type: "tick", seconds: 0.05 });
  return g;
}
function until(g: Game, p: (g: Game) => boolean) {
  for (let i = 0; i < 4000; i++) {
    if (p(g)) return g;
    g = update(g, { type: "tick", seconds: 0.05 });
  }
  throw Error("State never reached");
}
test("complete table cycle requires order, specific prepared dish click, and cleanup", () => {
  let g = newGame("Test", "Cook");
  g = until(g, (g) => g.seats[0]?.stage === "choosing");
  assert.equal(g.seats[0]?.stage, "choosing");
  g = run(g, 4);
  assert.equal(g.seats[0]?.stage, "request");
  g = run(g, 20);
  assert.equal(g.seats[0]?.stage, "request");
  g = update(g, { type: "order", seat: 0 });
  g = until(g, (g) => g.seats[0]?.stage === "cooking");
  g = until(g, (g) => g.seats[0]?.stage === "ready");
  g = run(g, 20);
  assert.equal(g.seats[0]?.stage, "ready");
  g = update(g, { type: "serve", seat: 0 });
  g = until(g, (g) => g.seats[0]?.stage === "eating");
  g = until(g, (g) => g.seats[0]?.stage === "dirty");
  assert.equal(g.cash, 28);
  assert.equal(g.served, 1);
  const id = g.seats[0]!.id;
  g = run(g, 20);
  assert.equal(g.seats[0]!.id, id);
  assert.equal(g.seats[0]!.stage, "dirty");
  g = update(g, { type: "clean", seat: 0 });
  g = until(g, (g) => g.seats[0] === null);
  g = until(g, (g) => g.seats[0]?.stage === "arriving");
  assert.notEqual(g.seats[0]!.id, id);
});
test("busy workers preserve clicked jobs in order without duplicating them", () => {
  let g = newGame("Queue", "Cook");
  g = update(g, { type: "seat" });
  g = until(g, (g) => g.seats.every((s) => s?.stage === "request"));
  g = update(g, { type: "order", seat: 1 });
  g = update(g, { type: "order", seat: 0 });
  g = update(g, { type: "order", seat: 1 });
  assert.deepEqual(
    g.queue.map((j) => j.seat),
    [1, 0],
  );
  g = run(g, 0.1);
  assert.equal(g.actors.owner.job?.seat, 1);
  assert.equal(g.queue[0].seat, 0);
  g = until(g, (g) => g.seats.every((s) => s?.stage === "ready"));
  g = update(g, { type: "serve", seat: 1 });
  g = run(g, 0.1);
  g = update(g, { type: "serve", seat: 0 });
  assert.ok(isQueued(g, 0));
  assert.equal(g.actors.owner.job?.seat, 1);
  g = until(g, (g) => g.served === 2);
  assert.ok(g.seats.every((s) => s?.stage === "dirty"));
});
test("waiters take orders and clean, but never dispatch unclicked food", () => {
  let g = newGame("Team", "Cook");
  g.cash = 500;
  g = update(g, { type: "hire", id: "luna" });
  g = until(g, (g) => g.seats[0]?.stage === "ready");
  g = run(g, 15);
  assert.equal(g.seats[0]?.stage, "ready");
  g = update(g, { type: "serve", seat: 0 });
  g = until(g, (g) => g.served === 1);
  g = until(g, (g) => g.seats[0] === null || g.seats[0]?.stage === "arriving");
  assert.equal(g.served, 1);
});
test("QR menus bypass order visits and dispatch bell completes the service loop", () => {
  let g = newGame("QR", "Cook");
  g.cash = 1000;
  g.served = 35;
  g = update(g, { type: "upgrade", id: "qr" });
  g = update(g, { type: "upgrade", id: "bell" });
  g = update(g, { type: "hire", id: "luna" });
  let orderJob = false;
  for (let i = 0; i < 2000; i++) {
    g = update(g, { type: "tick", seconds: 0.05 });
    orderJob ||= Object.values(g.actors).some((a) => a.job?.kind === "order");
  }
  assert.equal(orderJob, false);
  assert.ok(g.served > 35);
  assert.ok(g.upgrades.includes("bell"));
});
test("purchases enforce funds and unlocks; pause stops jobs and wages", () => {
  let g = newGame("Budget", "Cook");
  assert.equal(update(g, { type: "upgrade", id: "qr" }).upgrades.length, 0);
  assert.equal(update(g, { type: "hire", id: "luna" }).staff.length, 0);
  g = update(g, { type: "seat" });
  assert.equal(g.cash, 0);
  assert.equal(update(g, { type: "seat" }).seats.length, 2);
  g = update(g, { type: "pause" });
  assert.deepEqual(run(g, 60), g);
});
test("firing a worker preserves its delivery request for another worker", () => {
  let g = newGame("Team", "Cook");
  g.cash = 500;
  g = update(g, { type: "hire", id: "luna" });
  g = until(g, (g) => g.seats[0]?.stage === "ready");
  g = update(g, { type: "serve", seat: 0 });
  g = run(g, 0.1);
  assert.ok(g.actors.luna.job);
  g = update(g, { type: "fire", id: "luna" });
  assert.equal(g.queue.length, 1);
  g = until(g, (g) => g.served === 1);
  assert.equal(g.served, 1);
});
test("saves resume queued work and migrate old economy without losing tables or staff", () => {
  let g = newGame("Saved", "Cook");
  g = until(g, (g) => g.seats[0]?.stage === "request");
  g = update(g, { type: "order", seat: 0 });
  g = run(g, 1);
  assert.deepEqual(run(readSave(JSON.stringify(g))!, 25), run(g, 25));
  const old = { ...g, version: 1, cash: 200, staff: ["luna"] };
  const migrated = readSave(JSON.stringify(old))!;
  assert.equal(migrated.cash, 200);
  assert.equal(migrated.seats.length, 1);
  assert.ok(migrated.actors.luna);
  assert.equal(migrated.version, 2);
  assert.equal(readSave("{broken"), null);
  assert.equal(readSave(JSON.stringify({ ...g, cash: -1 })), null);
  assert.equal(readSave(JSON.stringify({ ...g, actors: {} })), null);
});

test("hired waiters own every table job while the owner stays in the kitchen", () => {
  let g = newGame("Roles", "Cook");
  g.cash = 500;
  g = update(g, { type: "seat" });
  g = update(g, { type: "hire", id: "luna" });
  const jobs = new Set<string>();
  for (let i = 0; i < 4000 && g.served < 2; i++) {
    g.seats.forEach((s, seat) => {
      if (s?.stage === "ready") g = update(g, { type: "serve", seat });
    });
    g = update(g, { type: "tick", seconds: 0.05 });
    assert.equal(g.actors.owner.job, undefined);
    assert.equal(g.actors.owner.phase, "idle");
    if (g.actors.luna.job) jobs.add(g.actors.luna.job.kind);
  }
  assert.equal(g.served, 2);
  assert.ok(jobs.has("order"));
  assert.ok(jobs.has("serve"));
  assert.ok(jobs.has("clean"));
});

test("busy waiter keeps deliveries queued; dismissing the last waiter restores owner service", () => {
  let g = newGame("Roles", "Cook");
  g.cash = 500;
  g = update(g, { type: "seat" });
  g = update(g, { type: "hire", id: "luna" });
  g = until(
    g,
    (g) =>
      g.seats.every((s) => s?.stage === "ready") &&
      g.actors.luna.phase === "idle",
  );
  g = update(g, { type: "serve", seat: 0 });
  g = update(g, { type: "serve", seat: 1 });
  g = run(g, 0.1);
  assert.equal(g.actors.luna.job?.seat, 0);
  assert.equal(g.queue[0]?.seat, 1);
  assert.equal(g.actors.owner.job, undefined);
  g = update(g, { type: "fire", id: "luna" });
  g = run(g, 0.1);
  assert.equal(g.actors.owner.job?.seat, 0);
  g = until(g, (g) => g.served === 2);
  assert.equal(g.served, 2);
});

test("each delivery is collected beside its own prepared dish", () => {
  let g = newGame("Pickup", "Cook");
  g.cash = 10000;
  for (let i = 0; i < 7; i++) g = update(g, { type: "seat" });
  g = update(g, { type: "hire", id: "luna" });
  g = until(
    g,
    (g) =>
      g.seats.every((s) => s?.stage === "ready") &&
      g.actors.luna.phase === "idle",
  );
  for (const seat of [0, 4, 7]) {
    g = update(g, { type: "serve", seat });
    g = until(
      g,
      (g) =>
        g.actors.luna.phase === "collect" && g.actors.luna.job?.seat === seat,
    );
    const resumed = readSave(JSON.stringify(g));
    assert.ok(resumed);
    assert.equal(resumed.actors.luna.phase, "collect");
    g = resumed;
    g = until(g, (g) => g.seats[seat]?.stage === "serving");
    assert.equal(g.actors.luna.pos.x, seat < 4 ? 6 : 9);
    assert.equal(g.actors.luna.pos.y, seat < 4 ? seat + 1 : seat - 1);
    g = until(g, (g) => g.actors.luna.phase === "idle");
  }
});
