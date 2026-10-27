// A single simulation clock keeps work, wages, pause and saved games in sync.
export type Stage =
  "arriving" | "ordered" | "cooking" | "ready" | "serving" | "eating";
export type Guest = {
  id: number;
  stage: Stage;
  left: number;
  duration: number;
  worker?: string;
  dish: number;
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
    name: "Rodrigo Sánchez",
    role: "chef",
    speed: 5,
    price: 45,
    wage: 8,
  },
  {
    id: "fernando",
    name: "Fernando Gusto",
    role: "chef",
    speed: 3,
    price: 90,
    wage: 12,
  },
  {
    id: "luna",
    name: "Luna Lindrome",
    role: "waiter",
    speed: 2,
    price: 30,
    wage: 5,
  },
  {
    id: "speedy",
    name: "Speedy Gonzales",
    role: "waiter",
    speed: 1,
    price: 70,
    wage: 9,
  },
];
export const dishes = [
  { name: "Garden soup", icon: "🥣", price: 8, time: 1, unlock: 0 },
  { name: "House pasta", icon: "🍝", price: 14, time: 1.5, unlock: 15 },
  { name: "Chef’s special", icon: "🍲", price: 22, time: 2, unlock: 50 },
];
export type Game = {
  version: 1;
  name: string;
  owner: string;
  cash: number;
  earned: number;
  served: number;
  seats: (Guest | null)[];
  staff: string[];
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
  | { type: "seat" | "publicity" | "serve" | "pause" | "speed" }
  | { type: "hire" | "fire"; id: string }
  | { type: "dish"; dish: number };
export const seatPrice = (g: Game) => 20 * g.seats.length;
export const publicityPrice = (g: Game) => 35 * g.popularity;
export const arrivalSeconds = (g: Game) => 10 / (1 + (g.popularity - 1) * 0.35);
export function newGame(name: string, owner: string): Game {
  return {
    version: 1,
    name: name.trim().slice(0, 40) || "Black Oasis",
    owner: owner.trim().slice(0, 30) || "John Cook",
    cash: 20,
    earned: 0,
    served: 0,
    seats: [null],
    staff: [],
    popularity: 1,
    dish: 0,
    time: 0,
    arrival: 1,
    payroll: 60,
    nextId: 1,
    missed: 0,
    paused: false,
    speed: 1,
    log: ["Doors open! Your first guest is on the way."],
  };
}
function note(g: Game, message: string) {
  g.log = [message, ...g.log].slice(0, 6);
}
function transition(
  guest: Guest,
  stage: Stage,
  duration: number,
  worker?: string,
) {
  Object.assign(guest, { stage, left: duration, duration, worker });
}
function spend(g: Game, amount: number) {
  if (g.cash < amount) return false;
  g.cash -= amount;
  return true;
}
function release(g: Game, id: string) {
  g.staff = g.staff.filter((s) => s !== id);
  g.seats.forEach((guest) => {
    if (guest?.worker === id)
      transition(guest, guest.stage === "cooking" ? "ordered" : "ready", 0);
  });
}
export function update(game: Game, action: Action): Game {
  if (action.type === "serve" && game.paused) return game;
  if (
    action.type === "tick" &&
    (game.paused || !Number.isFinite(action.seconds) || action.seconds <= 0)
  )
    return game;
  const g: Game = {
    ...game,
    seats: game.seats.map((s) => (s ? { ...s } : null)),
    staff: [...game.staff],
    log: [...game.log],
  };
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
        note(g, "A new seat is ready for guests.");
      }
      return g;
    case "publicity":
      if (g.popularity < 5 && spend(g, publicityPrice(g))) {
        g.popularity++;
        g.arrival = Math.min(g.arrival, arrivalSeconds(g));
        note(g, "Word is spreading. More guests will visit!");
      }
      return g;
    case "hire": {
      const person = candidates.find((s) => s.id === action.id);
      if (
        person &&
        !g.staff.includes(person.id) &&
        g.staff.filter(
          (id) => candidates.find((s) => s.id === id)?.role === person.role,
        ).length < (person.role === "chef" ? 1 : 2) &&
        spend(g, person.price)
      ) {
        g.staff.push(person.id);
        note(g, `${person.name} joined the team.`);
      }
      return g;
    }
    case "fire": {
      if (g.staff.includes(action.id)) {
        release(g, action.id);
        note(
          g,
          `${candidates.find((s) => s.id === action.id)!.name} left the team.`,
        );
      }
      return g;
    }
    case "dish":
      if (dishes[action.dish] && g.served >= dishes[action.dish].unlock)
        g.dish = action.dish;
      return g;
    case "serve": {
      // Manual serving always remains available, even with no money or staff.
      const guest = g.seats.find((s) => s?.stage === "ready");
      if (guest) transition(guest, "serving", 1, "player");
      return g;
    }
    case "tick":
      break;
  }
  // Bound each step to preserve stage ordering after a suspended browser frame.
  const dt = Math.min(action.seconds, 0.25) * g.speed;
  g.time += dt;
  g.arrival -= dt;
  g.payroll -= dt;
  if (g.payroll <= 0) {
    g.payroll += 60;
    for (const id of [...g.staff]) {
      const person = candidates.find((s) => s.id === id)!;
      if (!spend(g, person.wage)) {
        release(g, id);
        note(
          g,
          `${person.name} left: unable to pay wages. You can still serve by hand.`,
        );
      } else note(g, `Paid ${person.name} €${person.wage}.`);
    }
  }
  g.seats.forEach((guest, index) => {
    if (!guest || ["ordered", "ready"].includes(guest.stage)) return;
    guest.left -= dt;
    if (guest.left > 0) return;
    switch (guest.stage) {
      case "arriving":
        transition(guest, "ordered", 0);
        break;
      case "cooking":
        transition(guest, "ready", 0);
        break;
      case "serving":
        transition(guest, "eating", 5);
        break;
      case "eating": {
        const price = dishes[guest.dish].price;
        g.cash += price;
        g.earned += price;
        g.served++;
        g.seats[index] = null;
        note(
          g,
          `Guest ${guest.id} enjoyed ${dishes[guest.dish].name.toLowerCase()}. +€${price}`,
        );
        if (g.served === 15 || g.served === 50)
          note(g, "A new dish is unlocked in your menu!");
        break;
      }
    }
  });
  if (g.arrival <= 0) {
    g.arrival += arrivalSeconds(g);
    const seat = g.seats.indexOf(null);
    if (seat !== -1)
      g.seats[seat] = {
        id: g.nextId++,
        stage: "arriving",
        left: 1,
        duration: 1,
        dish: g.dish,
      };
    else {
      g.missed++;
      note(g, "A guest found no free seat. Try expanding your dining room.");
    }
  }
  const workers = [
    ...g.staff.map((id) => candidates.find((s) => s.id === id)!),
    { id: "owner", role: "chef", speed: 6 },
  ];
  for (const worker of workers) {
    if (g.seats.some((s) => s?.worker === worker.id)) continue;
    const guest = g.seats.find(
      (s) => s?.stage === (worker.role === "chef" ? "ordered" : "ready"),
    );
    if (guest)
      transition(
        guest,
        worker.role === "chef" ? "cooking" : "serving",
        worker.speed * (worker.role === "chef" ? dishes[guest.dish].time : 1),
        worker.id,
      );
  }
  return g;
}
export const SAVE_KEY = "cook-save-v1";
// Saves are untrusted browser data. Reject incompatible or invalid progress safely.
export function readSave(raw: string | null): Game | null {
  if (!raw) return null;
  try {
    const g = JSON.parse(raw) as Game;
    const finite = (n: unknown, min: number, max: number) =>
      typeof n === "number" && Number.isFinite(n) && n >= min && n <= max;
    if (
      g.version !== 1 ||
      typeof g.name !== "string" ||
      !g.name.trim() ||
      g.name.length > 40 ||
      typeof g.owner !== "string" ||
      !g.owner.trim() ||
      g.owner.length > 30 ||
      !finite(g.cash, 0, 1e12) ||
      !finite(g.earned, 0, 1e12) ||
      !Number.isInteger(g.served) ||
      !finite(g.served, 0, 1e10) ||
      !Number.isInteger(g.popularity) ||
      !finite(g.popularity, 1, 5) ||
      !Number.isInteger(g.dish) ||
      !dishes[g.dish] ||
      g.served < dishes[g.dish].unlock ||
      !finite(g.time, 0, 1e12) ||
      !finite(g.arrival, 0, 10) ||
      !finite(g.payroll, 0, 60) ||
      !Number.isInteger(g.nextId) ||
      !finite(g.nextId, 1, 1e12) ||
      !Number.isInteger(g.missed) ||
      !finite(g.missed, 0, 1e12) ||
      !Array.isArray(g.staff) ||
      new Set(g.staff).size !== g.staff.length ||
      g.staff.some((id) => !candidates.some((s) => s.id === id)) ||
      g.staff.filter(
        (id) => candidates.find((s) => s.id === id)?.role === "chef",
      ).length > 1 ||
      !Array.isArray(g.seats) ||
      g.seats.length < 1 ||
      g.seats.length > 8 ||
      !Array.isArray(g.log) ||
      g.log.length > 6 ||
      g.log.some((s) => typeof s !== "string" || s.length > 200) ||
      typeof g.paused !== "boolean" ||
      ![1, 2].includes(g.speed)
    )
      return null;
    const ids = new Set<number>();
    const workers = new Set<string>();
    for (const s of g.seats) {
      if (s === null) continue;
      if (
        !s ||
        !Number.isInteger(s.id) ||
        !finite(s.id, 1, g.nextId - 1) ||
        ids.has(s.id) ||
        ![
          "arriving",
          "ordered",
          "cooking",
          "ready",
          "serving",
          "eating",
        ].includes(s.stage) ||
        !finite(s.left, 0, 20) ||
        !finite(s.duration, 0, 20) ||
        s.left > s.duration ||
        !Number.isInteger(s.dish) ||
        !dishes[s.dish]
      )
        return null;
      ids.add(s.id);
      if (s.worker) {
        if (
          !["cooking", "serving"].includes(s.stage) ||
          !["owner", "player", ...g.staff].includes(s.worker) ||
          (s.worker !== "player" && workers.has(s.worker))
        )
          return null;
        workers.add(s.worker);
      }
    }
    return g;
  } catch {
    return null;
  }
}
