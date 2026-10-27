import { test } from "node:test";
import assert from "node:assert/strict";
import { newGame, readSave, update, type Game } from "../src/game";

function run(g: Game, seconds: number, serve = true) {
  for (let i = 0; i < seconds * 10; i++) {
    g = update(g, { type: "tick", seconds: 0.1 });
    if (serve) g = update(g, { type: "serve" });
  }
  return g;
}
test("a new owner can earn, grow, automate and reach every milestone without seed money", () => {
  let g = newGame("Black Oasis", "John");
  g = update(g, { type: "seat" });
  assert.equal(g.cash, 0);
  g = run(g, 120);
  assert.ok(g.served > 0);
  assert.ok(g.cash >= 30);
  g = update(g, { type: "hire", id: "luna" });
  const served = g.served;
  g = run(g, 120, false);
  assert.ok(g.served > served, "waiter serves without player clicks");
  for (let minute = 0; minute < 100; minute++) {
    g = run(g, 60, false);
    g = update(g, { type: "seat" });
    g = update(g, { type: "publicity" });
    g = update(g, { type: "hire", id: "fernando" });
    g = update(g, { type: "hire", id: "speedy" });
    g = update(g, { type: "dish", dish: 2 });
    assert.ok(g.cash >= 0);
    assert.ok(readSave(JSON.stringify(g)), "normal progress remains loadable");
  }
  assert.equal(g.seats.length, 8);
  assert.equal(g.popularity, 5);
  assert.equal(g.dish, 2);
  assert.ok(g.served >= 50);
  assert.ok(g.earned > 1000);
});
test("purchases enforce funds, staff capacity, duplicates and unlocks", () => {
  let g = newGame("Test", "Owner");
  for (let i = 0; i < 5; i++) {
    g = update(g, { type: "hire", id: "luna" });
    g = update(g, { type: "publicity" });
    g = update(g, { type: "dish", dish: 2 });
  }
  assert.equal(g.cash, 20);
  assert.equal(g.staff.length, 0);
  assert.equal(g.popularity, 1);
  assert.equal(g.dish, 0);
  g = run(g, 300);
  g = update(g, { type: "hire", id: "rodrigo" });
  const cash = g.cash;
  g = update(g, { type: "hire", id: "rodrigo" });
  g = update(g, { type: "hire", id: "fernando" });
  assert.equal(g.cash, cash);
  assert.deepEqual(g.staff, ["rodrigo"]);
  g = update(g, { type: "fire", id: "unknown" });
  assert.deepEqual(g.staff, ["rodrigo"]);
});
test("firing a busy chef or waiter releases their order and service recovers", () => {
  let g = run(newGame("Test", "Owner"), 300);
  g = update(g, { type: "seat" });
  g = update(g, { type: "seat" });
  for (const id of ["rodrigo", "luna"]) {
    g = update(g, { type: "hire", id });
    let found = false;
    for (let i = 0; i < 600; i++) {
      g = update(g, { type: "tick", seconds: 0.1 });
      if (g.seats.some((s) => s?.worker === id)) {
        found = true;
        break;
      }
      g = update(g, { type: "serve" });
    }
    assert.ok(found, `${id} must actually be busy before dismissal`);
    g = update(g, { type: "fire", id });
    assert.ok(!g.seats.some((s) => s?.worker === id));
    const served = g.served;
    g = run(g, 60);
    assert.ok(g.served > served);
  }
});
test("unpaid staff leave, but a broke restaurant can recover by manual service", () => {
  let g = run(newGame("Test", "Owner"), 120);
  g = update(g, { type: "hire", id: "luna" });
  // Represents a valid saved game immediately before payday with an empty till.
  g = { ...g, cash: 0, payroll: 0.1 };
  g = update(g, { type: "tick", seconds: 0.1 });
  assert.equal(g.staff.length, 0);
  assert.equal(g.cash, 0);
  g = run(g, 60);
  assert.ok(g.cash > 0);
});
test("pause freezes service and wages; resume and save restoration preserve live orders", () => {
  let g = run(newGame("Test", "Owner"), 5, false);
  g = update(g, { type: "pause" });
  assert.deepEqual(run(g, 120, false), g);
  const loaded = readSave(JSON.stringify(g));
  assert.deepEqual(loaded, g);
  g = run(update(loaded!, { type: "pause" }), 30);
  assert.ok(g.served > 0);
  assert.ok(g.time < 40);
});
test("invalid saves cannot introduce broken orders or invalid balances", () => {
  const good = newGame("Test", "Owner");
  for (const raw of [
    "bad json",
    "{}",
    "null",
    JSON.stringify({ ...good, cash: -1 }),
    JSON.stringify({ ...good, staff: ["unknown"] }),
    JSON.stringify({ ...good, seats: [{}] }),
    JSON.stringify({ ...good, popularity: 100 }),
  ]) {
    assert.equal(readSave(raw), null);
  }
});

test("a selected table receives the delivery and the owner cannot serve again during the round trip", () => {
  let g = update(newGame("Test", "Owner"), { type: "seat" });
  g = run(g, 40, false);
  assert.equal(g.seats[0]?.stage, "ready");
  assert.equal(g.seats[1]?.stage, "ready");
  g = update(g, { type: "serve", seat: 1 });
  assert.equal(g.seats[1]?.stage, "serving");
  assert.equal(g.seats[0]?.stage, "ready");
  g = update(g, { type: "serve", seat: 0 });
  assert.equal(
    g.seats[0]?.stage,
    "ready",
    "one owner cannot make two deliveries at once",
  );
  assert.equal(g.served, 0);
  g = run(g, 1, false);
  assert.equal(
    g.served,
    0,
    "walking food over does not credit an uneaten meal",
  );
  for (let i = 0; i < 200 && !g.returning.player; i++)
    g = update(g, { type: "tick", seconds: 0.1 });
  assert.ok(g.returning.player, "owner must walk back after delivering");
  assert.equal(g.seats[1]?.stage, "eating");
  const saved = readSave(JSON.stringify(g));
  assert.deepEqual(
    saved?.returning,
    g.returning,
    "the return trip survives saving",
  );
  g = saved!;
  g = update(g, { type: "pause" });
  assert.deepEqual(run(g, 30, false), g);
  g = run(update(g, { type: "pause" }), 30, false);
  assert.ok(!g.returning.player);
  assert.ok(g.served > 0);
  g = update(g, { type: "serve", seat: 0 });
  assert.equal(g.seats[0]?.stage, "serving");
});

test("the owner pauses cooking to deliver food and resumes it after returning", () => {
  let g = update(newGame("Test", "Owner"), { type: "seat" });
  for (let i = 0; i < 500; i++) {
    g = update(g, { type: "tick", seconds: 0.1 });
    if (
      g.seats.some((s) => s?.stage === "ready") &&
      g.seats.some((s) => s?.worker === "owner")
    )
      break;
  }
  const cooking = g.seats.findIndex((s) => s?.worker === "owner");
  assert.ok(cooking >= 0);
  const left = g.seats[cooking]!.left;
  g = update(g, { type: "serve" });
  assert.ok(g.seats.some((s) => s?.worker === "player"));
  g = run(g, 1, false);
  assert.equal(g.seats[cooking]!.left, left);
  g = run(g, 20, false);
  assert.notEqual(g.seats[cooking]?.stage, "cooking");
});
