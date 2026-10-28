import React, { useEffect, useRef, useState } from "react";
import { Game, Action, isQueued } from "./game";
import {
  Point,
  tables,
  along,
  guestRoute,
  chefSpot,
  secondChefSpot,
} from "./world";
const W = 640,
  H = 420;
export const project = (p: Point) => ({
  x: 300 + (p.x - p.y) * 20,
  y: 104 + (p.x + p.y) * 10,
});
export const platePoint = (seat: number) => {
  const p = project(seat < 4 ? { x: 7, y: seat + 1 } : { x: seat + 4, y: 0 });
  return { x: p.x, y: p.y - 14 };
};
type Props = { game: Game; dispatch: (a: Action) => void };
export default function RestaurantCanvas({ game, dispatch }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [hover, setHover] = useState("");
  useEffect(() => {
    const c = ref.current!,
      ctx = c.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const rect = (
      x: number,
      y: number,
      w: number,
      h: number,
      color: string,
    ) => {
      ctx.fillStyle = color;
      ctx.fillRect(Math.round(x), Math.round(y), w, h);
    };
    const poly = (points: number[][], color: string) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      points.forEach(([x, y], i) =>
        i
          ? ctx.lineTo(Math.round(x), Math.round(y))
          : ctx.moveTo(Math.round(x), Math.round(y)),
      );
      ctx.closePath();
      ctx.fill();
    };
    const text = (
      s: string,
      x: number,
      y: number,
      color = "#fff4d2",
      size = 8,
    ) => {
      ctx.font = size + "px monospace";
      ctx.textAlign = "center";
      ctx.fillStyle = color;
      ctx.fillText(s, Math.round(x), Math.round(y));
    };
    const box = (
      p: Point,
      w: number,
      d: number,
      h: number,
      top: string,
      left: string,
      right: string,
    ) => {
      const a = project({ x: p.x - w / 2, y: p.y - d / 2 }),
        b = project({ x: p.x + w / 2, y: p.y - d / 2 }),
        c = project({ x: p.x + w / 2, y: p.y + d / 2 }),
        e = project({ x: p.x - w / 2, y: p.y + d / 2 });
      poly(
        [
          [e.x, e.y - h],
          [c.x, c.y - h],
          [c.x, c.y],
          [e.x, e.y],
        ],
        left,
      );
      poly(
        [
          [b.x, b.y - h],
          [c.x, c.y - h],
          [c.x, c.y],
          [b.x, b.y],
        ],
        right,
      );
      poly(
        [
          [a.x, a.y - h],
          [b.x, b.y - h],
          [c.x, c.y - h],
          [e.x, e.y - h],
        ],
        top,
      );
    };
    const person = (
      p: Point,
      color: string,
      id: number,
      moving: boolean,
      carry = false,
      working = false,
      seated = false,
    ) => {
      const q = project(p),
        step = moving && !reduced ? Math.sin(game.time * 15 + id) : 0,
        bob = moving
          ? Math.abs(step) * 1
          : working && !reduced
            ? Math.sin(game.time * 10)
            : 0;
      const direction = p as Point & { dx?: number; dy?: number };
      ctx.save();
      if ((direction.dx ?? 0) < 0 || (direction.dy ?? 0) > 0) {
        ctx.translate(Math.round(q.x) * 2, 0);
        ctx.scale(-1, 1);
      }
      const x = Math.round(q.x),
        y = Math.round(q.y - bob);
      rect(x - 5, y - 1, 10, 3, "#68584b55");
      rect(x - 4, y - 6 + (seated ? 0 : Math.round(step * 2)), 3, 6, "#383950");
      rect(x + 1, y - 6 - (seated ? 0 : Math.round(step * 2)), 3, 6, "#383950");
      rect(x - 5, y - 15, 10, 10, color);
      rect(x - 6, y - 14, 2, 7, "#e8ad7e");
      rect(x + 4, y - 14 + (carry ? -3 : Math.round(step)), 2, 7, "#e8ad7e");
      rect(x - 4, y - 23, 8, 9, "#edb889");
      rect(x - 5, y - 23, 10, 3, id % 2 ? "#654738" : "#343440");
      rect(x - 5, y - 21, 2, 5, id % 2 ? "#654738" : "#343440");
      rect(x + 2, y - 19, 1, 1, "#393643");
      if (color === "#f6e8bd") {
        rect(x - 5, y - 26, 10, 5, "#fff2cf");
        rect(x - 3, y - 28, 6, 3, "#fff2cf");
        rect(x - 3, y - 12, 6, 5, "#719583");
      }
      if (carry) {
        rect(x + 4, y - 15, 11, 3, "#f4efcf");
        rect(x + 6, y - 18, 7, 3, "#d58c4b");
      }
      if (working && !reduced) {
        rect(
          x + 6,
          y - 11 + Math.round(Math.sin(game.time * 14) * 2),
          5,
          2,
          "#fff0bc",
        );
      }
      ctx.restore();
    };
    const plate = (x: number, y: number, dirty = false) => {
      rect(x - 8, y - 3, 16, 5, "#b8bfaa");
      rect(x - 7, y - 4, 14, 5, "#fff2cc");
      rect(x - 5, y - 3, 10, 3, dirty ? "#9a8057" : "#cf7047");
      if (!dirty) {
        rect(x - 2, y - 3, 3, 2, "#89a464");
        rect(x + 3, y - 2, 2, 1, "#f9d58a");
      }
    };
    rect(0, 0, W, H, "#a7b68c");
    // Garden details sit outside the walkable floor.
    for (let i = 0; i < 85; i++) {
      const x = (i * 97 + 13) % 640,
        y = (i * 61 + 19) % 420;
      rect(x, y, 2, 3, i % 3 ? "#91a77c" : "#c1c79b");
    }
    // Raised foundation and a welcoming garden path give the room a clear footprint.
    box({ x: 5.5, y: 4.5 }, 12, 10, 5, "#b78d63", "#8b664f", "#775542");
    for (let y = 10; y < 15; y++) {
      const p = project({ x: 1, y });
      poly(
        [
          [p.x, p.y - 10],
          [p.x + 25, p.y],
          [p.x, p.y + 10],
          [p.x - 25, p.y],
        ],
        y % 2 ? "#cfb78a" : "#dbc79c",
      );
    }
    const tree = (x: number, y: number) => {
      rect(x - 3, y - 15, 6, 23, "#806344");
      rect(x - 20, y - 36, 40, 18, "#557952");
      rect(x - 15, y - 45, 30, 33, "#62865a");
      rect(x - 8, y - 50, 19, 39, "#7e9b65");
      rect(x - 18, y - 32, 9, 4, "#8ca46b");
      rect(x + 7, y - 19, 6, 3, "#486c4c");
    };
    tree(74, 207);
    tree(538, 289);
    tree(540, 125);
    tree(138, 120);
    for (const [x, y] of [
      [90, 262],
      [568, 218],
      [169, 329],
      [429, 345],
    ]) {
      rect(x - 10, y, 20, 7, "#799260");
      for (let i = 0; i < 5; i++) {
        rect(x - 9 + i * 4, y - 4 - (i % 2) * 3, 3, 5, "#657f54");
        rect(
          x - 9 + i * 4,
          y - 6 - (i % 2) * 3,
          3,
          3,
          i % 2 ? "#f1d6a1" : "#cc8a75",
        );
      }
    }
    for (let x = 0; x < 12; x++)
      for (let y = 0; y < 10; y++) {
        const p = project({ x, y });
        poly(
          [
            [p.x, p.y - 10],
            [p.x + 20, p.y],
            [p.x, p.y + 10],
            [p.x - 20, p.y],
          ],
          (x + y) % 2 ? "#d9bc8c" : "#e1c79b",
        );
        rect(p.x - 1, p.y + 7, 2, 1, "#bd9d73");
      }
    // Cutaway back walls never conceal the foreground action.
    for (let x = 0; x < 12; x++)
      box({ x, y: -0.5 }, 1, 0.15, 22, "#e0ddac", "#91a087", "#798e7c");
    for (let y = 0; y < 10; y++)
      box({ x: -0.5, y }, 0.15, 1, 22, "#e0ddac", "#91a087", "#798e7c");
    const sign = project({ x: 3, y: -0.5 });
    rect(sign.x - 26, sign.y - 25, 52, 14, "#526c59");
    text(
      game.name.toUpperCase().slice(0, 15),
      sign.x,
      sign.y - 15,
      "#f1dfad",
      6,
    );
    const windowFrame = project({ x: -0.5, y: 3 });
    rect(windowFrame.x - 9, windowFrame.y - 25, 18, 15, "#4c786c");
    rect(windowFrame.x - 7, windowFrame.y - 23, 14, 10, "#b9d8b7");
    rect(windowFrame.x - 1, windowFrame.y - 23, 2, 11, "#eee1b8");
    const items: { depth: number; draw: () => void }[] = [];
    const add = (p: Point, draw: () => void, bias = 0) =>
      items.push({ depth: p.x + p.y + bias, draw });
    for (let x = 8; x < 12; x++)
      add({ x, y: 0 }, () => {
        box({ x, y: 0 }, 0.95, 0.9, 17, "#d6d6bf", "#8b9d92", "#657e78");
        const p = project({ x, y: 0 });
        rect(p.x - 7, p.y - 20, 14, 5, "#444a4f");
        rect(p.x - 4, p.y - 19, 3, 2, "#e99b57");
      });
    for (let y = 0; y < 5; y++)
      add({ x: 7, y }, () => {
        box({ x: 7, y }, 0.85, 0.98, 13, "#eee0b5", "#ad7e59", "#906044");
      });
    tables.forEach((p, i) => {
      if (i >= game.seats.length) return;
      const s = game.seats[i];
      // Seat is behind the table, so diners are correctly occluded by its front edge.
      const chair = { x: p.x - 1, y: p.y };
      add(chair, () =>
        box(chair, 0.48, 0.48, 4, "#9f6652", "#815044", "#66463f"),
      );
      if (s && !["arriving", "dirty"].includes(s.stage))
        add(
          chair,
          () =>
            person(
              chair,
              ["#c87d65", "#879fb0", "#b9a2bd", "#8caa7d"][s.id % 4],
              s.id,
              false,
              false,
              s.stage === "eating",
              true,
            ),
          0.1,
        );
      add(p, () => {
        box(p, 0.95, 0.95, 10, "#c88e5d", "#986744", "#78533d");
        const q = project(p);
        rect(q.x - 4, q.y - 16, 8, 5, "#f0d6a1");
        if (s?.stage === "eating" || s?.stage === "dirty")
          plate(q.x, q.y - 11, s.stage === "dirty");
        else {
          rect(q.x - 2, q.y - 14, 3, 5, "#6c8f66");
          rect(q.x - 3, q.y - 17, 5, 3, "#d89577");
        }
        text(String(i + 1), q.x, q.y + 3, "#fff1ca", 7);
      });
      if (s?.stage === "arriving") {
        const p = along(guestRoute(i), 1 - s.left / s.duration);
        add(p, () =>
          person(
            p,
            ["#c87d65", "#879fb0", "#b9a2bd", "#8caa7d"][s.id % 4],
            s.id,
            true,
          ),
        );
      }
    });
    game.departures.forEach((d) => {
      const p = along(
        [...guestRoute(d.seat)].reverse(),
        1 - d.left / d.duration,
      );
      add(p, () =>
        person(
          p,
          ["#c87d65", "#879fb0", "#b9a2bd", "#8caa7d"][d.id % 4],
          d.id,
          true,
        ),
      );
    });
    Object.entries(game.actors).forEach(([id, a], i) =>
      add(a.pos, () =>
        person(
          a.pos,
          id === "owner" ? "#f6e8bd" : "#7a97ad",
          i,
          !["idle", "work"].includes(a.phase),
          a.job?.kind === "serve" && a.phase !== "pickup",
          a.phase === "work" ||
            (id === "owner" && game.seats.some((s) => s?.worker === "owner")),
        ),
      ),
    );
    game.staff
      .filter((id) => ["rodrigo", "fernando"].includes(id))
      .forEach((id, i) =>
        add(secondChefSpot, () =>
          person(
            secondChefSpot,
            "#f6e8bd",
            i + 2,
            false,
            false,
            game.seats.some((s) => s?.worker === id),
          ),
        ),
      );
    game.seats.forEach((s, i) => {
      if (s?.stage !== "ready") return;
      const location = i < 4 ? { x: 7, y: i + 1 } : { x: i + 4, y: 0 };
      add(
        location,
        () => {
          const p = platePoint(i);
          plate(p.x, p.y);
          rect(
            p.x + 7,
            p.y - 11,
            9,
            8,
            isQueued(game, i) ? "#8c957b" : "#435e51",
          );
          text(String(i + 1), p.x + 11, p.y - 5, "#fff2c9", 6);
        },
        0.01,
      );
    });
    items.sort((a, b) => a.depth - b.depth).forEach((item) => item.draw());
    game.seats.forEach((s, i) => {
      if (
        !s ||
        ["arriving", "ordered", "cooking", "serving", "eating"].includes(
          s.stage,
        )
      )
        return;
      const q = project(tables[i]);
      const queued = isQueued(game, i);
      const label = queued
        ? "..."
        : s.stage === "request"
          ? "ORDER"
          : s.stage === "dirty"
            ? "CLEAN"
            : s.stage === "choosing"
              ? "MENU"
              : s.stage === "ready"
                ? "PASS"
                : "";
      if (!label) return;
      rect(
        q.x - 17,
        q.y - 42,
        34,
        11,
        queued ? "#768677" : s.stage === "dirty" ? "#90634e" : "#425e50",
      );
      text(label, q.x, q.y - 34, "#fff2ce", 7);
    });
    // Timed actions have small, stable progress marks; payments rise from departing guests.
    game.seats.forEach((s, i) => {
      if (!s || !["choosing", "cooking", "eating"].includes(s.stage)) return;
      const p = project(tables[i]);
      rect(p.x - 10, p.y - 34, 20, 3, "#79876a");
      rect(
        p.x - 10,
        p.y - 34,
        Math.round(20 * (1 - s.left / s.duration)),
        3,
        "#f6e7b5",
      );
    });
    game.departures
      .filter((d) => d.duration - d.left < 2)
      .forEach((d) => {
        const p = project(tables[d.seat]);
        text(
          "+ €" + [8, 14, 22][d.dish],
          p.x,
          p.y - 32 - (d.duration - d.left) * 5,
          "#3f6847",
          8,
        );
      });
    game.seats
      .filter((s) => s?.stage === "cooking")
      .forEach((s) => {
        const p = project(s!.worker === "owner" ? chefSpot : secondChefSpot);
        rect(p.x + 8, p.y - 15, 10, 3, "#455448");
        rect(p.x + 10, p.y - 18, 5, 3, "#d89a58");
        for (let i = 0; i < 3; i++) {
          const phase = ((reduced ? 0 : game.time * 8) + i * 5) % 15;
          rect(
            p.x + 10 + Math.round(Math.sin(phase) * 2),
            p.y - 20 - phase,
            2,
            3,
            "#f4e7c0",
          );
        }
      });
    const entry = project({ x: 1, y: 10 });
    rect(entry.x - 17, entry.y - 4, 34, 9, "#698064");
    text("OPEN", entry.x, entry.y + 3, "#eedfb0", 6);
    if (game.upgrades.includes("qr")) {
      const p = project(tables[0]);
      rect(p.x + 7, p.y - 18, 5, 6, "#fff3cf");
      rect(p.x + 8, p.y - 17, 3, 3, "#343f38");
    }
  }, [game]);
  const hit = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) * W) / r.width,
      y = ((e.clientY - r.top) * H) / r.height;
    for (let i = 0; i < game.seats.length; i++) {
      const p = platePoint(i);
      if (
        game.seats[i]?.stage === "ready" &&
        Math.abs(x - p.x) < 12 &&
        Math.abs(y - p.y) < 8
      )
        return { type: "serve" as const, seat: i };
    }
    for (let i = 0; i < game.seats.length; i++) {
      const p = project(tables[i]);
      if (Math.abs(x - p.x) < 21 && y > p.y - 45 && y < p.y + 10) {
        if (game.seats[i]?.stage === "request")
          return { type: "order" as const, seat: i };
        if (game.seats[i]?.stage === "dirty")
          return { type: "clean" as const, seat: i };
      }
    }
    return null;
  };
  return (
    <div className="world">
      <canvas
        ref={ref}
        width={W}
        height={H}
        aria-label="Isometric restaurant. Use the table and food buttons below for keyboard controls."
        onPointerMove={(e) => setHover(hit(e)?.type || "")}
        onPointerLeave={() => setHover("")}
        onPointerDown={(e) => {
          const a = hit(e);
          if (a) dispatch(a);
        }}
        style={{ cursor: hover ? "pointer" : "default" }}
      />
      <span className="world-hint">
        {hover
          ? (
              {
                order: "Take order",
                serve: "Pick up this dish",
                clean: "Clean table",
              } as Record<string, string>
            )[hover]
          : "Tap a table to take orders or clean · Tap a dish on the counter to serve"}
      </span>
    </div>
  );
}
