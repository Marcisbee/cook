import React, { useEffect, useRef, useState } from "react";
import { Game, Action, isQueued } from "./game";
import { Point, tables, along, guestRoute, cookSpot, foodSpot } from "./world";
import { artReady, Art, drawSprite } from "./art";
const W = 800,
  H = 520;
export const project = (p: Point) => ({
  x: 400 + (p.x - p.y) * 30,
  y: 116 + (p.x + p.y) * 15,
});
export const platePoint = (seat: number) => {
  const p = project(foodSpot(seat));
  return { x: p.x, y: p.y - 27 };
};
type Props = { game: Game; dispatch: (a: Action) => void };
export default function RestaurantCanvas({ game, dispatch }: Props) {
  const ref = useRef<HTMLCanvasElement>(null),
    drag = useRef<{
      x: number;
      y: number;
      ox: number;
      oy: number;
      moved: boolean;
    } | null>(null);
  const [art, setArt] = useState<Art | null>(null),
    [error, setError] = useState(false),
    [hover, setHover] = useState("");
  const [surface, setSurface] = useState({ width: W, height: H });
  const [camera, setCamera] = useState({ x: 0, y: 0, zoom: 1 });
  useEffect(() => {
    const canvas = ref.current!;
    // Keep world coordinates independent of display pixels. Re-measure even
    // while paused, and when the window moves between different-DPI displays.
    let density: MediaQueryList;
    const measure = () => {
      const bounds = canvas.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      const width = Math.max(1, Math.round(bounds.width * ratio));
      const height = Math.max(1, Math.round(bounds.height * ratio));
      setSurface((previous) =>
        previous.width === width && previous.height === height
          ? previous
          : { width, height },
      );
    };
    const watchDensity = () => {
      density?.removeEventListener("change", watchDensity);
      density = window.matchMedia(
        "(resolution: " + window.devicePixelRatio + "dppx)",
      );
      density.addEventListener("change", watchDensity);
      measure();
    };
    const observer = new ResizeObserver(measure);
    observer.observe(canvas);
    window.addEventListener("resize", measure);
    watchDensity();
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
      density.removeEventListener("change", watchDensity);
    };
  }, []);
  useEffect(() => {
    let live = true;
    artReady
      .then((a) => {
        if (live) setArt(a);
      })
      .catch(() => setError(true));
    return () => {
      live = false;
    };
  }, []);
  useEffect(() => {
    const c = ref.current!,
      ctx = c.getContext("2d")!;
    if (c.width !== surface.width) c.width = surface.width;
    if (c.height !== surface.height) c.height = surface.height;
    ctx.setTransform(surface.width / W, 0, 0, surface.height / H, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
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
      color = "#fff6dd",
      size = 10,
    ) => {
      ctx.font = "bold " + size + "px monospace";
      ctx.textAlign = "center";
      ctx.fillStyle = color;
      ctx.fillText(s, Math.round(x), Math.round(y));
    };
    const diamond = (p: Point, w: number, d: number, color: string, z = 0) => {
      const a = project({ x: p.x - w / 2, y: p.y - d / 2 }),
        b = project({ x: p.x + w / 2, y: p.y - d / 2 }),
        c = project({ x: p.x + w / 2, y: p.y + d / 2 }),
        e = project({ x: p.x - w / 2, y: p.y + d / 2 });
      poly(
        [
          [a.x, a.y - z],
          [b.x, b.y - z],
          [c.x, c.y - z],
          [e.x, e.y - z],
        ],
        color,
      );
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
    rect(0, 0, W, H, "#b9ca91");
    ctx.save();
    ctx.translate(W / 2 + camera.x, H / 2 + camera.y);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-W / 2, -H / 2);
    // Deterministic garden texture: no random flicker between animation frames.
    for (let i = 0; i < 420; i++) {
      const x = ((i * 173 + 19) % 1000) - 100,
        y = ((i * 97 + 31) % 720) - 100;
      rect(x, y, 2, 2, i % 3 ? "#aabd80" : "#cbd69d");
      if (i % 7 === 0) {
        rect(x + 3, y - 2, 2, 4, "#8faa6c");
        rect(x - 1, y - 4, 2, 4, "#9bb674");
      }
    }
    for (let y = 10; y < 18; y++) {
      diamond({ x: 1, y }, 1.5, 0.98, y % 2 ? "#d9c6a0" : "#e6d6b0");
    }
    // Behind-wall foliage must be painted before the wall itself.
    if (art)
      for (const p of [
        { x: -2, y: 4 },
        { x: -2, y: 8 },
      ]) {
        const q = project(p);
        drawSprite(ctx, art.props[8], q.x, q.y + 12, 112);
      }
    // A foundation, timber seams and planted borders make a place, not a floating grid.
    box({ x: 5.5, y: 4.5 }, 12.2, 10.2, 0, "#8f7854", "#796249", "#6e593f");
    const backA = project({ x: -0.5, y: -0.5 }),
      backB = project({ x: 11.5, y: -0.5 }),
      backC = project({ x: -0.5, y: 9.5 });
    poly(
      [
        [backA.x, backA.y - 60],
        [backB.x, backB.y - 60],
        [backB.x, backB.y],
        [backA.x, backA.y],
      ],
      "#e8dcb1",
    );
    poly(
      [
        [backA.x, backA.y - 60],
        [backC.x, backC.y - 60],
        [backC.x, backC.y],
        [backA.x, backA.y],
      ],
      "#d3d5b1",
    );
    for (let x = 0; x < 12; x++)
      for (let y = 0; y < 10; y++) {
        const kitchen = x >= 7;
        diamond(
          { x, y },
          0.99,
          0.99,
          kitchen
            ? (x + y) % 2
              ? "#d7d8ba"
              : "#e9e6cc"
            : (x + y) % 3
              ? "#d7ad79"
              : "#e0b983",
        );
        const p = project({ x, y });
        if (!kitchen) {
          rect(p.x - 5, p.y, 12, 1, "#c79b68");
          rect(p.x + 9, p.y + 5, 5, 1, "#c49a69");
        }
      }
    for (let x = 0; x < 12; x++) {
      box({ x, y: -0.47 }, 1, 0.08, 15, "#5a806a", "#6c8b71", "#75937a");
    }
    for (let y = 0; y < 10; y++) {
      box({ x: -0.47, y }, 0.08, 1, 15, "#557963", "#65866c", "#77967d");
    }
    // Windows and shelves follow the same projected wall plane.
    const windowAt = (y: number) => {
      const p = project({ x: -0.5, y });
      poly(
        [
          [p.x - 22, p.y - 48],
          [p.x + 20, p.y - 69],
          [p.x + 20, p.y - 35],
          [p.x - 22, p.y - 14],
        ],
        "#627b66",
      );
      poly(
        [
          [p.x - 18, p.y - 47],
          [p.x + 16, p.y - 64],
          [p.x + 16, p.y - 37],
          [p.x - 18, p.y - 20],
        ],
        "#a8cabc",
      );
      poly(
        [
          [p.x - 17, p.y - 46],
          [p.x - 2, p.y - 53],
          [p.x - 2, p.y - 27],
          [p.x - 17, p.y - 20],
        ],
        "#d1e5cd",
      );
      poly(
        [
          [p.x - 25, p.y - 12],
          [p.x + 23, p.y - 36],
          [p.x + 27, p.y - 33],
          [p.x - 21, p.y - 9],
        ],
        "#f5e9c6",
      );
    };
    windowAt(2.3);
    windowAt(6.5);
    const sign = project({ x: 3, y: -0.5 });
    rect(sign.x - 48, sign.y - 55, 96, 25, "#465f4f");
    rect(sign.x - 46, sign.y - 53, 92, 21, "#658069");
    text(
      game.name.toUpperCase().slice(0, 16),
      sign.x,
      sign.y - 39,
      "#fff0cb",
      8,
    );
    const entry = project({ x: 1, y: 10 });
    diamond({ x: 1, y: 9 }, 1.6, 0.6, "#668976");
    text("WELCOME", entry.x, entry.y - 13, "#fff2ca", 8);
    const items: { depth: number; draw: () => void }[] = [];
    const add = (p: Point, draw: () => void, bias = 0) =>
      items.push({ depth: p.x + p.y + bias, draw });
    const prop = (
      index: number,
      p: Point,
      height: number,
      bottom = 0,
      width?: number,
    ) => {
      if (!art) return;
      const q = project(p);
      drawSprite(
        ctx,
        art.props[index],
        q.x,
        q.y + bottom,
        height,
        false,
        width,
      );
    };
    const person = (
      p: Point,
      id: number,
      role: "chef" | "waiter" | "guest",
      moving: boolean,
      action?: "cook" | "order" | "clean" | "eat" | "choose",
      seated = false,
      target?: Point,
    ) => {
      if (!art) return;
      const q = project(p);
      const direction = target
        ? { dx: target.x - p.x, dy: target.y - p.y }
        : (p as Point & { dx?: number; dy?: number });
      const dx = direction.dx ?? 1,
        dy = direction.dy ?? 0;
      const back = dx < 0 || dy < 0;
      // NW is the authored rear view; mirror it for NE. Front views face SE.
      let flip = back ? dy < 0 : dy > 0;
      const frame =
        !reduced &&
        (moving ||
          action === "cook" ||
          action === "eat" ||
          (role === "waiter" && action))
          ? Math.floor(
              game.time * (moving ? 8 : action === "eat" ? 3 : 6) + id,
            ) % 4
          : 1;
      let sprite =
        role === "guest"
          ? art.diners[(id % 4) * 4 + frame]
          : role === "chef"
            ? art.characters[(back ? 4 : 0) + frame]
            : back
              ? art.actions[4 + frame]
              : art.characters[12 + frame];
      if (role === "guest" && back && !seated) {
        sprite = art.dinerActions[(id % 4) * 4 + frame];
        flip = dx < 0; // This atlas's rear views are authored facing NE.
      }
      if (role === "guest" && seated) {
        sprite =
          art.dinerActions[16 + (id % 4) * 4 + (action === "eat" ? frame : 0)];
        flip = false;
      }
      if (action === "cook") {
        sprite = art.actions[frame];
        flip = false;
      }
      if (role === "waiter" && action === "clean")
        sprite = art.actions[8 + frame];
      if (role === "waiter" && action === "order")
        sprite = art.actions[12 + frame];
      diamond(p, 0.45, 0.35, "#57452e25");
      const breath =
        !reduced && !moving && !action
          ? Math.sin(game.time * 2 + id) * 0.35
          : 0;
      ctx.save();
      const lean =
        !reduced &&
        role === "chef" &&
        (action === "clean" || action === "order")
          ? Math.sin(game.time * 8) * 0.035
          : 0;
      ctx.translate(q.x, q.y);
      ctx.rotate(lean);
      drawSprite(
        ctx,
        sprite,
        0,
        breath,
        role === "chef" ? 70 : seated ? 48 : 60,
        flip,
      );
      ctx.restore();
      if (
        role === "chef" &&
        (action === "clean" || action === "order") &&
        target
      ) {
        const t = project(target),
          sweep = reduced ? 0 : Math.sin(game.time * 9) * 5;
        if (action === "clean") {
          poly(
            [
              [t.x - 8 + sweep, t.y - 24],
              [t.x + sweep, t.y - 28],
              [t.x + 9 + sweep, t.y - 24],
              [t.x + sweep, t.y - 20],
            ],
            "#fff1ce",
          );
        } else {
          rect(q.x - 16, q.y - 29, 9, 11, "#f8ebca");
          rect(q.x - 15, q.y - 26 + sweep * 0.2, 7, 1, "#72583c");
        }
      }
      if (action === "choose") {
        const tilt = reduced ? 0 : Math.sin(game.time * 2 + id) * 0.06;
        ctx.save();
        ctx.translate(q.x + 9, q.y - 19);
        ctx.rotate(0.45 + tilt);
        rect(-6, -5, 12, 10, "#f8ebca");
        rect(-5, -4, 4, 7, "#8b9d6e");
        rect(1, -3, 4, 1, "#96744e");
        rect(1, 0, 4, 1, "#96744e");
        ctx.restore();
      }
    };
    // Landscape is scenery only, outside the navigable floor.
    for (const [p, h] of [
      [{ x: 12, y: 8 }, 90],
      [{ x: 10, y: 12 }, 90],
    ] as [Point, number][])
      add(p, () => prop(8, p, h, 12));
    for (const p of [
      { x: 12, y: 3 },
      { x: 12, y: 5 },
      { x: 7, y: 11 },
    ])
      add(p, () => prop(7, p, 40));
    for (let x = 8; x < 12; x++)
      add({ x, y: 0 }, () => {
        prop(
          x === 11 ? 5 : 2,
          { x, y: 0 },
          x === 11 ? 76 : 52,
          15,
          x === 11 ? 58 : 48,
        );
      });
    for (let y = 0; y < 5; y++)
      add({ x: 7, y }, () => prop(6, { x: 7, y }, 43, 15, 58));
    for (let seat = 4; seat < game.seats.length; seat++) {
      const p = foodSpot(seat);
      add(p, () => prop(6, p, 43, 15, 58));
    }
    add({ x: 11, y: 2 }, () => prop(9, { x: 11, y: 2 }, 34));
    // Diners and furniture occupy distinct floor cells; draw everything by its feet.
    tables.forEach((p, i) => {
      if (i >= game.seats.length) return;
      const s = game.seats[i],
        chair = { x: p.x - 1, y: p.y };
      add(chair, () => prop(1, chair, 35, 7, 30));
      if (s && !["arriving", "dirty"].includes(s.stage))
        add(
          chair,
          () =>
            person(
              chair,
              s.id,
              "guest",
              false,
              s.stage === "eating"
                ? "eat"
                : s.stage === "choosing"
                  ? "choose"
                  : undefined,
              true,
              p,
            ),
          0.05,
        );
      add(p, () => {
        prop(0, p, 43, 15, 60);
        const q = project(p);
        text(String(i + 1), q.x, q.y + 3, "#684d35", 8);
        if (s?.stage === "eating" || s?.stage === "dirty") {
          const cleaner = Object.values(game.actors).find(
            (a) =>
              a.phase === "work" && a.job?.kind === "clean" && a.job.seat === i,
          );
          ctx.save();
          if (cleaner && !reduced)
            ctx.globalAlpha = Math.min(
              1,
              (cleaner.left / cleaner.duration) * 2,
            );
          prop(
            s.stage === "dirty" ? 11 : 10,
            p,
            s.stage === "dirty" ? 14 : 12,
            -21,
          );
          ctx.restore();
        }
      });
      if (s?.stage === "arriving") {
        const p = along(guestRoute(i), 1 - s.left / s.duration);
        add(p, () => person(p, s.id, "guest", true));
      }
    });
    game.departures.forEach((d) => {
      const p = along(
        [...guestRoute(d.seat)].reverse(),
        1 - d.left / d.duration,
      );
      add(p, () => person(p, d.id, "guest", true));
    });
    Object.entries(game.actors).forEach(([id, a], i) => {
      const cooking =
        id === "owner" && game.seats.some((s) => s?.worker === "owner");
      const working = a.phase === "work";
      const collecting = a.phase === "collect";
      const target =
        id === "owner" && a.phase === "idle"
          ? { x: a.pos.x, y: 0 }
          : working && a.job
            ? tables[a.job.seat]
            : collecting && a.job
              ? foodSpot(a.job.seat)
              : undefined;
      add(a.pos, () => {
        person(
          a.pos,
          i,
          id === "owner" ? "chef" : "waiter",
          !["idle", "work", "collect"].includes(a.phase),
          cooking
            ? "cook"
            : working && a.job?.kind !== "serve"
              ? a.job?.kind
              : undefined,
          false,
          target,
        );
        if (
          art &&
          a.job?.kind === "serve" &&
          ["walk", "work", "collect"].includes(a.phase)
        ) {
          const q = project(a.pos),
            direction = a.pos as Point & { dx?: number; dy?: number };
          const side =
            (direction.dx ?? 0) < 0 || (direction.dy ?? 0) > 0 ? -1 : 1;
          let x = q.x + side * 13,
            y = q.y - 33;
          const progress = reduced ? 1 : 1 - a.left / a.duration;
          if (collecting) {
            const source = platePoint(a.job.seat);
            x = source.x + (x - source.x) * progress;
            y =
              source.y +
              5 +
              (y - source.y - 5) * progress -
              Math.sin(progress * Math.PI) * 5;
          } else if (working) {
            const destination = project(tables[a.job.seat]);
            x += (destination.x - x) * progress;
            y += (destination.y - 21 - y) * progress;
          }
          drawSprite(ctx, art.props[10], x, y, 12);
        }
      });
    });
    game.staff
      .filter((id) => ["rodrigo", "fernando"].includes(id))
      .forEach((id, i) => {
        const p = cookSpot(id),
          cooking = game.seats.some((s) => s?.worker === id);
        add(p, () =>
          person(p, i + 2, "chef", false, cooking ? "cook" : undefined, false, {
            x: p.x,
            y: 0,
          }),
        );
      });
    game.seats.forEach((s, i) => {
      if (
        s?.stage !== "ready" ||
        Object.values(game.actors).some(
          (a) => a.phase === "collect" && a.job?.seat === i,
        )
      )
        return;
      const location = foodSpot(i);
      add(
        location,
        () => {
          const p = platePoint(i);
          if (art) drawSprite(ctx, art.props[10], p.x, p.y + 5, 15);
          rect(
            p.x + 9,
            p.y - 13,
            12,
            12,
            isQueued(game, i) ? "#7d8d70" : "#b45f3c",
          );
          text(String(i + 1), p.x + 15, p.y - 4, "#fff2c9", 8);
        },
        0.01,
      );
    });
    items.sort((a, b) => a.depth - b.depth).forEach((item) => item.draw());
    game.seats.forEach((s, i) => {
      if (!s) return;
      const q = project(tables[i]),
        queued = isQueued(game, i);
      const label = queued
        ? "QUEUED"
        : s.stage === "request"
          ? "ORDER"
          : s.stage === "dirty"
            ? "CLEAN"
            : s.stage === "choosing"
              ? "CHOOSING"
              : s.stage === "ready"
                ? "READY"
                : "";
      if (label) {
        const width = label.length * 5 + 12;
        rect(
          q.x - width / 2,
          q.y - 66,
          width,
          15,
          s.stage === "dirty" ? "#a16745" : queued ? "#7d8d70" : "#496952",
        );
        rect(
          q.x - 2,
          q.y - 51,
          4,
          3,
          s.stage === "dirty" ? "#a16745" : "#496952",
        );
        text(label, q.x, q.y - 55, "#fff3d7", 8);
      }
      if (["choosing", "cooking", "eating"].includes(s.stage)) {
        rect(q.x - 13, q.y - 44, 26, 4, "#796c51");
        rect(
          q.x - 12,
          q.y - 43,
          Math.round(24 * (1 - s.left / s.duration)),
          2,
          "#e8c778",
        );
      }
    });
    game.departures
      .filter((d) => d.duration - d.left < 2)
      .forEach((d) => {
        const p = project(tables[d.seat]);
        text(
          "+ €" + [8, 14, 22][d.dish],
          p.x,
          p.y - 58 - (d.duration - d.left) * 7,
          "#4b744d",
          12,
        );
      });
    game.seats
      .filter((s) => s?.stage === "cooking")
      .forEach((s) => {
        const p = project(cookSpot(s!.worker!));
        for (let i = 0; i < 3; i++) {
          const phase = ((reduced ? 0 : game.time * 8) + i * 7) % 22;
          rect(
            p.x + 9 + Math.round(Math.sin(phase) * 2),
            p.y - 32 - phase,
            3,
            5,
            "#fff3d1bb",
          );
        }
      });
    if (game.upgrades.includes("qr"))
      game.seats.forEach((_, i) => {
        const p = project(tables[i]);
        rect(p.x + 13, p.y - 28, 7, 9, "#fff5d9");
        rect(p.x + 14, p.y - 26, 2, 3, "#46604d");
        rect(p.x + 17, p.y - 27, 2, 2, "#46604d");
      });
    ctx.restore();
  }, [game, art, camera, surface]);
  const coords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return {
      x:
        (((e.clientX - r.left) * W) / r.width - W / 2 - camera.x) /
          camera.zoom +
        W / 2,
      y:
        (((e.clientY - r.top) * H) / r.height - H / 2 - camera.y) /
          camera.zoom +
        H / 2,
    };
  };
  const hit = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const { x, y } = coords(e);
    for (let i = 0; i < game.seats.length; i++) {
      const p = platePoint(i);
      if (
        game.seats[i]?.stage === "ready" &&
        Math.abs(x - p.x) < 17 &&
        Math.abs(y - p.y) < 13
      )
        return { type: "serve" as const, seat: i };
    }
    for (let i = 0; i < game.seats.length; i++) {
      const p = project(tables[i]);
      if (Math.abs(x - p.x) < 30 && y > p.y - 70 && y < p.y + 10) {
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
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          drag.current = {
            x: e.clientX,
            y: e.clientY,
            ox: camera.x,
            oy: camera.y,
            moved: false,
          };
        }}
        onPointerMove={(e) => {
          setHover(hit(e)?.type || "");
          const d = drag.current;
          if (!d) return;
          const dx = e.clientX - d.x,
            dy = e.clientY - d.y;
          if (Math.hypot(dx, dy) > 5) d.moved = true;
          if (d.moved) {
            const r = e.currentTarget.getBoundingClientRect();
            setCamera((c) => ({
              ...c,
              x: Math.max(-300, Math.min(300, d.ox + (dx * W) / r.width)),
              y: Math.max(-200, Math.min(200, d.oy + (dy * H) / r.height)),
            }));
          }
        }}
        onPointerUp={(e) => {
          if (drag.current && !drag.current.moved) {
            const a = hit(e);
            if (a) dispatch(a);
          }
          drag.current = null;
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
        onPointerLeave={() => setHover("")}
        style={{ cursor: hover ? "pointer" : "grab" }}
      />
      {!art && (
        <div className="art-loading">
          {error
            ? "Artwork could not load. Reload to retry."
            : "Setting the tables…"}
        </div>
      )}
      <div className="camera-controls">
        <button
          aria-label="Zoom out"
          disabled={camera.zoom <= 0.8}
          onClick={() =>
            setCamera((c) => ({ ...c, zoom: Math.max(0.8, c.zoom - 0.2) }))
          }
        >
          −
        </button>
        <button
          aria-label="Reset camera"
          onClick={() => setCamera({ x: 0, y: 0, zoom: 1 })}
        >
          {Math.round(camera.zoom * 100)}%
        </button>
        <button
          aria-label="Zoom in"
          disabled={camera.zoom >= 2}
          onClick={() =>
            setCamera((c) => ({ ...c, zoom: Math.min(2, c.zoom + 0.2) }))
          }
        >
          +
        </button>
      </div>
      <span className="world-hint">
        {hover
          ? (
              {
                order: "Take this order",
                serve: "Deliver this dish",
                clean: "Clean this table",
              } as Record<string, string>
            )[hover]
          : "Drag to explore · Click tables and prepared food"}
      </span>
    </div>
  );
}
