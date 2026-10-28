import {
  Point,
  route,
  pathLength,
  along,
  door,
  chefSpot,
  pass,
  pickupSpot,
  tables,
  guestRoute,
} from "./world";
export type Stage =
  | "arriving"
  | "choosing"
  | "request"
  | "ordered"
  | "cooking"
  | "ready"
  | "serving"
  | "eating"
  | "dirty";
export type Guest = {
  id: number;
  stage: Stage;
  left: number;
  duration: number;
  dish: number;
  worker?: string;
};
export type Staff = {
  id: string;
  name: string;
  role: "chef" | "waiter";
  speed: number;
  price: number;
  wage: number;
};
export const candidates: Staff[] = [
  {
    id: "rodrigo",
    name: "Rodrigo",
    role: "chef",
    speed: 5,
    price: 45,
    wage: 8,
  },
  {
    id: "fernando",
    name: "Fernando",
    role: "chef",
    speed: 3,
    price: 90,
    wage: 12,
  },
  { id: "luna", name: "Luna", role: "waiter", speed: 2, price: 30, wage: 5 },
  {
    id: "speedy",
    name: "Speedy",
    role: "waiter",
    speed: 1,
    price: 70,
    wage: 9,
  },
];
export const dishes = [
  { name: "Garden soup", price: 8, time: 1, unlock: 0 },
  { name: "House pasta", price: 14, time: 1.5, unlock: 15 },
  { name: "Chef’s special", price: 22, time: 2, unlock: 50 },
];
export const upgrades = [
  {
    id: "qr",
    name: "QR menus",
    price: 100,
    unlock: 8,
    detail: "Guests send their own orders after choosing.",
  },
  {
    id: "stove",
    name: "Quick stove",
    price: 150,
    unlock: 15,
    detail: "All cooking takes 35% less time.",
  },
  {
    id: "washer",
    name: "Dishwasher",
    price: 180,
    unlock: 20,
    detail: "Table cleanup takes half the time.",
  },
  {
    id: "bell",
    name: "Dispatch bell",
    price: 300,
    unlock: 35,
    detail: "Automatically queues each finished dish.",
  },
];
export type Job = {
  kind: "order" | "serve" | "clean";
  seat: number;
  guest: number;
};
export type Actor = {
  pos: Point;
  path: Point[];
  left: number;
  duration: number;
  phase: "idle" | "walk" | "work" | "collect" | "pickup" | "home";
  job?: Job;
};
export type Departure = {
  seat: number;
  id: number;
  dish: number;
  left: number;
  duration: number;
};
export type Game = {
  version: 2;
  name: string;
  owner: string;
  cash: number;
  earned: number;
  served: number;
  seats: (Guest | null)[];
  staff: string[];
  upgrades: string[];
  actors: Record<string, Actor>;
  queue: Job[];
  departures: Departure[];
  popularity: number;
  dish: number;
  time: number;
  arrival: number;
  payroll: number;
  nextId: number;
  missed: number;
  paused: boolean;
  speed: 1 | 2;
  log: string[];
};
export type Action =
  | { type: "tick"; seconds: number }
  | { type: "seat" | "publicity" | "pause" | "speed" }
  | { type: "order" | "serve" | "clean"; seat: number }
  | { type: "hire" | "fire" | "upgrade"; id: string }
  | { type: "dish"; dish: number };
const actor = (pos: Point): Actor => ({
  pos: { ...pos },
  path: [pos],
  left: 0,
  duration: 0,
  phase: "idle",
});
export const seatPrice = (g: Game) => 20 * g.seats.length;
export const publicityPrice = (g: Game) => 35 * g.popularity;
export const arrivalSeconds = (g: Game) => 12 / (1 + (g.popularity - 1) * 0.35);
export function newGame(name: string, owner: string): Game {
  return {
    version: 2,
    name: name.trim().slice(0, 40) || "Little Ladle",
    owner: owner.trim().slice(0, 30) || "Cook",
    cash: 20,
    earned: 0,
    served: 0,
    seats: [null],
    staff: [],
    upgrades: [],
    actors: { owner: actor(chefSpot) },
    queue: [],
    departures: [],
    popularity: 1,
    dish: 0,
    time: 0,
    arrival: 1,
    payroll: 60,
    nextId: 1,
    missed: 0,
    paused: false,
    speed: 1,
    log: ["Welcome! Guests choose, then you take their order."],
  };
}
const note = (g: Game, s: string) => {
  g.log = [s, ...g.log].slice(0, 6);
};
const transition = (s: Guest, stage: Stage, duration = 0, worker?: string) =>
  Object.assign(s, { stage, left: duration, duration, worker });
const spend = (g: Game, n: number) => {
  if (g.cash < n) return false;
  g.cash -= n;
  return true;
};
export const isQueued = (g: Game, seat: number) =>
  g.queue.some((j) => j.seat === seat) ||
  Object.values(g.actors).some((a) => a.job?.seat === seat);
function enqueue(g: Game, kind: Job["kind"], seat: number) {
  const s = g.seats[seat];
  if (
    !s ||
    isQueued(g, seat) ||
    s.stage !== { order: "request", serve: "ready", clean: "dirty" }[kind]
  )
    return;
  g.queue.push({ kind, seat, guest: s.id });
}
function travel(a: Actor, to: Point, phase: Actor["phase"], speed: number) {
  a.path = route(a.pos, to);
  a.duration = a.left = Math.max(0.05, pathLength(a.path) / speed);
  a.phase = phase;
}
function release(g: Game, id: string) {
  g.staff = g.staff.filter((s) => s !== id);
  const job = g.actors[id]?.job;
  if (job) {
    const s = g.seats[job.seat];
    if (s?.id === job.guest && s.stage === "serving") transition(s, "ready");
    g.queue.unshift(job);
  }
  delete g.actors[id];
  g.seats.forEach((s) => {
    if (s?.worker === id) transition(s, "ordered");
  });
}
export function update(game: Game, action: Action): Game {
  if (
    (action.type === "tick" &&
      (game.paused ||
        !Number.isFinite(action.seconds) ||
        action.seconds <= 0)) ||
    (["order", "serve", "clean"].includes(action.type) && game.paused)
  )
    return game;
  const g = structuredClone(game);
  switch (action.type) {
    case "pause":
      g.paused = !g.paused;
      return g;
    case "speed":
      g.speed = g.speed === 1 ? 2 : 1;
      return g;
    case "seat":
      if (g.seats.length < 8 && spend(g, seatPrice(g))) {
        g.seats.push(null);
        note(g, "Another table, another story.");
      }
      return g;
    case "publicity":
      if (g.popularity < 5 && spend(g, publicityPrice(g))) {
        g.popularity++;
        note(g, "Word is spreading!");
      }
      return g;
    case "hire": {
      const p = candidates.find((p) => p.id === action.id);
      if (
        p &&
        !g.staff.includes(p.id) &&
        !(
          p.role === "chef" &&
          g.staff.some(
            (id) => candidates.find((p) => p.id === id)?.role === "chef",
          )
        ) &&
        spend(g, p.price)
      ) {
        g.staff.push(p.id);
        if (p.role === "waiter")
          g.actors[p.id] = actor({ x: 8, y: p.id === "luna" ? 6 : 7 });
        note(g, p.name + " joined the team.");
      }
      return g;
    }
    case "fire":
      release(g, action.id);
      return g;
    case "upgrade": {
      const u = upgrades.find((u) => u.id === action.id);
      if (
        u &&
        !g.upgrades.includes(u.id) &&
        g.served >= u.unlock &&
        spend(g, u.price)
      ) {
        g.upgrades.push(u.id);
        note(g, u.name + " installed!");
      }
      return g;
    }
    case "dish":
      if (dishes[action.dish] && g.served >= dishes[action.dish].unlock)
        g.dish = action.dish;
      return g;
    case "order":
    case "serve":
    case "clean":
      enqueue(g, action.type, action.seat);
      return g;
  }
  const dt = Math.min(action.seconds, 0.25) * g.speed;
  g.time += dt;
  g.arrival -= dt;
  g.payroll -= dt;
  if (g.payroll <= 0) {
    g.payroll += 60;
    for (const id of [...g.staff]) {
      const p = candidates.find((p) => p.id === id)!;
      if (!spend(g, p.wage)) {
        release(g, id);
        note(g, p.name + " left: wages could not be paid.");
      }
    }
  }
  g.departures = g.departures
    .map((d) => ({ ...d, left: d.left - dt }))
    .filter((d) => d.left > 0);
  // A worker carries one job from pickup through delivery, then returns home.
  for (const [id, a] of Object.entries(g.actors)) {
    if (a.phase === "idle") {
      if (id === "owner") a.pos = { ...chefSpot };
      continue;
    }
    const speed =
      id === "owner"
        ? 3.5
        : 5 / (candidates.find((p) => p.id === id)?.speed || 1);
    a.left = Math.max(0, a.left - dt);
    if (a.phase !== "work" && a.phase !== "collect")
      a.pos = along(a.path, 1 - a.left / a.duration);
    if (a.left > 0) continue;
    if (a.phase === "home") {
      a.phase = "idle";
      continue;
    }
    const j = a.job!,
      s = g.seats[j.seat];
    if (!s || s.id !== j.guest) {
      delete a.job;
      travel(a, id === "owner" ? chefSpot : pass, "home", speed);
      continue;
    }
    if (a.phase === "pickup") {
      a.phase = "collect";
      a.duration = a.left = 0.45;
      continue;
    }
    if (a.phase === "collect") {
      transition(s, "serving");
      travel(
        a,
        { x: tables[j.seat].x + 1, y: tables[j.seat].y },
        "walk",
        speed,
      );
      continue;
    }
    if (a.phase === "walk") {
      a.phase = "work";
      a.duration = a.left =
        j.kind === "clean" ? (g.upgrades.includes("washer") ? 1.2 : 2.4) : 0.8;
      continue;
    }
    if (j.kind === "order") transition(s, "ordered");
    if (j.kind === "serve") transition(s, "eating", 5);
    if (j.kind === "clean") g.seats[j.seat] = null;
    delete a.job;
    travel(a, id === "owner" ? chefSpot : pass, "home", speed);
  }
  g.seats.forEach((s, i) => {
    if (!s) return;
    if (["arriving", "choosing", "cooking", "eating"].includes(s.stage)) {
      s.left = Math.max(0, s.left - dt);
      if (s.left > 0) return;
      if (s.stage === "arriving") transition(s, "choosing", 3);
      else if (s.stage === "choosing")
        transition(s, g.upgrades.includes("qr") ? "ordered" : "request");
      else if (s.stage === "cooking") transition(s, "ready");
      else if (s.stage === "eating") {
        const price = dishes[s.dish].price;
        g.cash += price;
        g.earned += price;
        g.served++;
        const duration = pathLength(guestRoute(i)) / 2.5;
        g.departures.push({
          seat: i,
          id: s.id,
          dish: s.dish,
          left: duration,
          duration,
        });
        transition(s, "dirty");
        note(g, "Happy guest! +€" + price);
      }
    }
    if (s.stage === "request" && g.upgrades.includes("qr"))
      transition(s, "ordered");
    if (
      g.staff.some(
        (id) => candidates.find((p) => p.id === id)?.role === "waiter",
      ) &&
      (s.stage === "request" || s.stage === "dirty")
    )
      enqueue(g, s.stage === "request" ? "order" : "clean", i);
    if (s.stage === "ready" && g.upgrades.includes("bell"))
      enqueue(g, "serve", i);
  });
  // Hired waiters own the floor. The owner is a fallback only when no waiter
  // remains, rather than stealing queued jobs while the waiter is busy.
  const hasWaiter = g.staff.some(
    (id) => candidates.find((person) => person.id === id)?.role === "waiter",
  );
  for (const [id, a] of Object.entries(g.actors)) {
    if (id === "owner" && hasWaiter) continue;
    if (a.phase !== "idle" || g.seats.some((s) => s?.worker === id)) continue;
    let j: Job | undefined;
    while (g.queue.length) {
      const next = g.queue.shift()!;
      const s = g.seats[next.seat];
      if (
        s?.id === next.guest &&
        s.stage ===
          { order: "request", serve: "ready", clean: "dirty" }[next.kind]
      ) {
        j = next;
        break;
      }
    }
    if (!j) continue;
    a.job = j;
    travel(
      a,
      j.kind === "serve"
        ? pickupSpot(j.seat)
        : { x: tables[j.seat].x + 1, y: tables[j.seat].y },
      j.kind === "serve" ? "pickup" : "walk",
      id === "owner"
        ? 3.5
        : 5 / (candidates.find((p) => p.id === id)?.speed || 1),
    );
  }
  const cooks = [
    ...g.staff
      .map((id) => candidates.find((p) => p.id === id)!)
      .filter((p) => p.role === "chef"),
    { id: "owner", speed: 6 },
  ];
  for (const p of cooks) {
    if (
      g.seats.some((s) => s?.worker === p.id) ||
      (p.id === "owner" && g.actors.owner.phase !== "idle")
    )
      continue;
    const s = g.seats.find((s) => s?.stage === "ordered");
    if (s)
      transition(
        s,
        "cooking",
        p.speed *
          dishes[s.dish].time *
          (g.upgrades.includes("stove") ? 0.65 : 1),
        p.id,
      );
  }
  if (g.arrival <= 0) {
    g.arrival += arrivalSeconds(g);
    const i = g.seats.indexOf(null);
    if (i < 0) g.missed++;
    else {
      const duration = pathLength(guestRoute(i)) / 2.5;
      g.seats[i] = {
        id: g.nextId++,
        stage: "arriving",
        left: duration,
        duration,
        dish: g.dish,
      };
    }
  }
  return g;
}
export const SAVE_KEY = "cook-save-v1";
export function readSave(raw: string | null): Game | null {
  if (!raw) return null;
  try {
    const s = JSON.parse(raw);
    const finite = (v: unknown, min = 0, max = 1e12) =>
      typeof v === "number" && Number.isFinite(v) && v >= min && v <= max;
    if (
      ![1, 2].includes(s.version) ||
      typeof s.name !== "string" ||
      !s.name.trim() ||
      s.name.length > 40 ||
      typeof s.owner !== "string" ||
      s.owner.length > 30 ||
      !finite(s.cash) ||
      !finite(s.earned) ||
      !Number.isInteger(s.served) ||
      !finite(s.served) ||
      !Number.isInteger(s.popularity) ||
      !finite(s.popularity, 1, 5) ||
      !Number.isInteger(s.dish) ||
      !dishes[s.dish] ||
      s.served < dishes[s.dish].unlock ||
      !Array.isArray(s.seats) ||
      s.seats.length < 1 ||
      s.seats.length > 8 ||
      !Array.isArray(s.staff) ||
      s.staff.some((id: string) => !candidates.some((p) => p.id === id)) ||
      new Set(s.staff).size !== s.staff.length ||
      s.staff.filter(
        (id: string) => candidates.find((p) => p.id === id)?.role === "chef",
      ).length > 1
    )
      return null;
    if (s.version === 1) {
      const g = newGame(s.name, s.owner);
      for (const key of [
        "cash",
        "earned",
        "served",
        "popularity",
        "dish",
      ] as const)
        g[key] = s[key];
      g.seats = s.seats.map(() => null);
      g.staff = s.staff;
      for (const id of g.staff)
        if (candidates.find((p) => p.id === id)?.role === "waiter")
          g.actors[id] = actor(pass);
      note(g, "New service loop! Your money, tables and team are kept.");
      return g;
    }
    if (
      !finite(s.time) ||
      !finite(s.arrival, 0, 20) ||
      !finite(s.payroll, 0, 60) ||
      !Number.isInteger(s.nextId) ||
      !finite(s.nextId, 1) ||
      !finite(s.missed) ||
      typeof s.paused !== "boolean" ||
      ![1, 2].includes(s.speed) ||
      !Array.isArray(s.upgrades) ||
      new Set(s.upgrades).size !== s.upgrades.length ||
      s.upgrades.some((id: string) => !upgrades.some((u) => u.id === id)) ||
      !Array.isArray(s.log) ||
      s.log.length > 6 ||
      s.log.some((v: unknown) => typeof v !== "string" || v.length > 200)
    )
      return null;
    const stages = [
      "arriving",
      "choosing",
      "request",
      "ordered",
      "cooking",
      "ready",
      "serving",
      "eating",
      "dirty",
    ];
    const ids = new Set();
    for (const g of s.seats) {
      if (g === null) continue;
      if (
        !g ||
        !Number.isInteger(g.id) ||
        !finite(g.id, 1, s.nextId - 1) ||
        ids.has(g.id) ||
        !stages.includes(g.stage) ||
        !finite(g.left, 0, 60) ||
        !finite(g.duration, 0, 60) ||
        g.left > g.duration ||
        !dishes[g.dish] ||
        (g.worker &&
          !(
            g.stage === "cooking" &&
            [
              "owner",
              ...s.staff.filter(
                (id: string) =>
                  candidates.find((p) => p.id === id)?.role === "chef",
              ),
            ].includes(g.worker)
          ))
      )
        return null;
      ids.add(g.id);
    }
    const validJob = (j: Job) =>
      j &&
      ["order", "serve", "clean"].includes(j.kind) &&
      Number.isInteger(j.seat) &&
      j.seat >= 0 &&
      j.seat < s.seats.length &&
      s.seats[j.seat]?.id === j.guest;
    const point = (p: Point) => p && finite(p.x, 0, 12) && finite(p.y, 0, 11);
    if (
      !s.actors ||
      !s.actors.owner ||
      !Array.isArray(s.queue) ||
      s.queue.length > 8 ||
      !s.queue.every(validJob) ||
      !Array.isArray(s.departures) ||
      s.departures.length > 16
    )
      return null;
    const expectedActors = [
      "owner",
      ...s.staff.filter(
        (id: string) => candidates.find((p) => p.id === id)?.role === "waiter",
      ),
    ];
    if (expectedActors.some((id) => !s.actors[id])) return null;
    const cooks = s.seats
      .filter((g: Guest | null) => g?.worker)
      .map((g: Guest) => g.worker);
    if (new Set(cooks).size !== cooks.length) return null;
    const jobs = new Set<number>();
    for (const j of s.queue) {
      if (jobs.has(j.seat)) return null;
      jobs.add(j.seat);
    }
    for (const [id, a] of Object.entries(s.actors) as [string, Actor][]) {
      if (
        ![
          "owner",
          ...s.staff.filter(
            (id: string) =>
              candidates.find((p) => p.id === id)?.role === "waiter",
          ),
        ].includes(id) ||
        !point(a.pos) ||
        !Array.isArray(a.path) ||
        !a.path.length ||
        a.path.length > 100 ||
        !a.path.every(point) ||
        !finite(a.left, 0, 60) ||
        !finite(a.duration, 0, 60) ||
        a.left > a.duration ||
        !["idle", "walk", "work", "collect", "pickup", "home"].includes(a.phase)
      )
        return null;
      if (a.job) {
        if (
          !validJob(a.job) ||
          jobs.has(a.job.seat) ||
          !{
            order: ["request"],
            serve: ["ready", "serving"],
            clean: ["dirty"],
          }[a.job.kind].includes(s.seats[a.job.seat].stage)
        )
          return null;
        jobs.add(a.job.seat);
      } else if (!["idle", "home"].includes(a.phase)) return null;
    }
    for (const d of s.departures)
      if (
        !Number.isInteger(d.seat) ||
        !finite(d.seat, 0, s.seats.length - 1) ||
        !finite(d.left, 0, 30) ||
        !finite(d.duration, 0.01, 30) ||
        d.left > d.duration ||
        !dishes[d.dish] ||
        !finite(d.id, 1, s.nextId - 1)
      )
        return null;
    return s;
  } catch {
    return null;
  }
}
