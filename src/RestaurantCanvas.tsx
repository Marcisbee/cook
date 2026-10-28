import React, { useEffect, useRef, useState } from "react";
import { Game, Action, isQueued } from "./game";
import { Point, tables, along, guestRoute, cookSpot, foodSpot } from "./world";
import { artReady, Art, drawSprite } from "./art";
import { furniture } from "./furniture";
import { drawIdle } from "./idle";
import { interior } from "./interior";
import { groundMaterial, material } from "./materials";
import { unproject } from "./isometric";
import { depthOrder, Drawable } from "./depth";
import { WalkCycles } from "./walk";
import {
  tileToScreen,
  propHeight,
  fixtureTiles,
  gardenTiles,
  groundKind,
  drawTileProp,
  tableTile,
  chairTile,
  kitchenTile,
} from "./tiles";
const W = 800,
  H = 520;
export const project = tileToScreen;
export const platePoint = (seat: number) => {
  const p = project(foodSpot(seat));
  return { x: p.x, y: p.y - 35 };
};
type Props = { game: Game; dispatch: (a: Action) => void };
export default function RestaurantCanvas({ game, dispatch }: Props) {
  const walks = useRef(new WalkCycles());
  const ref = useRef<HTMLCanvasElement>(null),
    drag = useRef<{
      x: number;
      y: number;
      ox: number;
      oy: number;
      moved: boolean;
    } | null>(null);
  const scenery = useRef<{
    key: string;
    art: Art | null;
    canvas: HTMLCanvasElement;
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
    walks.current.beginFrame();
    const c = ref.current!,
      ctx = c.getContext("2d")!;
    if (c.width !== surface.width) c.width = surface.width;
    if (c.height !== surface.height) c.height = surface.height;
    ctx.setTransform(
      surface.height / H,
      0,
      0,
      surface.height / H,
      (surface.width - (W * surface.height) / H) / 2,
      0,
    );
    ctx.imageSmoothingEnabled = false;
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
    const sceneryKey = [
      surface.width,
      surface.height,
      camera.x,
      camera.y,
      camera.zoom,
    ].join(":");
    if (scenery.current?.key !== sceneryKey || scenery.current.art !== art) {
      rect(-1600, -1200, 4000, 3000, "#617649");
      ctx.save();
      ctx.translate(W / 2 + camera.x, H / 2 + camera.y);
      ctx.scale(camera.zoom, camera.zoom);
      ctx.translate(-W / 2, -H / 2);
      // Ground is a tile map, not a painted scene. All props share these cells.
      for (let x = -28; x < 38; x++)
        for (let y = -28; y < 38; y++) {
          const kind = groundKind(x, y);
          if (kind === "room") continue;
          groundMaterial(
            ctx,
            art,
            project,
            x,
            y,
            kind === "stone" ? 1 : kind === "path" ? 3 : 2,
            kind === "grass" ? 4 : 2,
          );
        }
      // Cooler exterior values leave the warm interior as the focal point.
      rect(-1600, -1200, 4000, 3000, "#20213966");
      if (art)
        gardenTiles
          .filter((p) => p.x < 0 || p.y < 0)
          .sort((a, b) => a.x + a.y - b.x - b.y)
          .forEach((p) => drawTileProp(ctx, art, p));
      for (let x = 2; x < 12; x++) {
        box({ x, y: 10.6 }, 0.98, 0.34, 20, "#77768e", "#44445e", "#5b5c78");
        box({ x, y: 10.6 }, 1.03, 0.42, 22, "#a7a5ba", "#5c5b77", "#72718a");
        const a = project({ x: x - 0.49, y: 10.77 }),
          b = project({ x: x + 0.49, y: 10.77 });
        material(
          ctx,
          art,
          6,
          { x: a.x, y: a.y - 20 },
          { x: b.x - a.x, y: b.y - a.y },
          { x: 0, y: 20 },
        );
      }
      // A foundation, timber seams and planted borders make a place, not a floating grid.
      box({ x: 5.5, y: 4.5 }, 12.2, 10.2, 0, "#8f7854", "#796249", "#6e593f");
      for (let x = 0; x < 12; x++)
        for (let y = 0; y < 10; y++) {
          const kitchen = x >= 7;
          diamond(
            { x, y },
            0.99,
            0.99,
            kitchen
              ? (x + y) % 2
                ? "#79928a"
                : "#dbd6ba"
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
      interior(ctx, project, art);
      ctx.restore();
      const background = document.createElement("canvas");
      background.width = surface.width;
      background.height = surface.height;
      background.getContext("2d")!.drawImage(c, 0, 0);
      scenery.current = { key: sceneryKey, art, canvas: background };
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(scenery.current.canvas, 0, 0);
    ctx.setTransform(
      surface.height / H,
      0,
      0,
      surface.height / H,
      (surface.width - (W * surface.height) / H) / 2,
      0,
    );
    ctx.save();
    ctx.translate(W / 2 + camera.x, H / 2 + camera.y);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-W / 2, -H / 2);
    const entry = project({ x: 1, y: 10 });
    diamond({ x: 1, y: 9 }, 1.6, 0.6, "#773747");
    text("WELCOME", entry.x, entry.y - 13, "#fff2ca", 8);
    const items: Drawable[] = [];
    const add = (
      p: Point,
      draw: () => void,
      bias = 0,
      footprint: [number, number] = [0.3, 0.3],
      height = 56,
    ) =>
      items.push({
        position: p,
        footprint,
        height,
        depth: p.x + p.y + bias,
        draw,
      });
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
      const walkFrame = walks.current.frame(`${role}:${id}`, p, moving);
      // Action poses have their own timing; locomotion follows ground travel.
      const frame = reduced
        ? 1
        : moving
          ? Math.floor(game.time * 8 + id) % 4
          : action === "cook" ||
              action === "eat" ||
              (role === "waiter" && action)
            ? Math.floor(game.time * (action === "eat" ? 3 : 6) + id) % 4
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
      if (moving) {
        const sheet =
          role === "chef"
            ? art.walkChef
            : role === "waiter"
              ? art.walkWaiter
              : id % 4 < 2
                ? art.walkDinersA
                : art.walkDinersB;
        const row = (role === "guest" ? (id % 2) * 2 : 0) + (back ? 1 : 0);
        sprite = sheet[row * 8 + (reduced ? 2 : walkFrame)];
        flip = back ? dy < 0 : dy > 0;
      }
      diamond(p, 0.45, 0.35, "#57452e25");
      ctx.save();
      const lean =
        !reduced &&
        role === "chef" &&
        (action === "clean" || action === "order")
          ? Math.sin(game.time * 8) * 0.035
          : 0;
      ctx.translate(q.x, q.y);
      ctx.rotate(lean);
      if (!moving && (!action || action === "choose")) {
        const row = role === "chef" ? (back ? 1 : 0) : back ? 3 : 2;
        const poses =
          role === "guest"
            ? art.idleDiners.slice((id % 4) * 4, (id % 4) * 4 + 4)
            : art.idleStaff.slice(row * 4, row * 4 + 4);
        drawIdle(
          ctx,
          poses,
          role === "chef" ? 62 : seated ? 43 : 56,
          flip,
          game.time,
          id + (role === "chef" ? 7 : role === "waiter" ? 13 : 0),
          seated,
          reduced,
        );
      } else
        drawSprite(
          ctx,
          sprite,
          0,
          0,
          role === "chef" ? 62 : seated ? 43 : 56,
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
    if (art) {
      for (const p of [
        ...fixtureTiles,
        ...gardenTiles.filter((p) => p.x >= 0 && p.y >= 0),
      ])
        add(
          p,
          () => drawTileProp(ctx, art, p),
          0,
          p.footprint,
          propHeight(art, p),
        );
      for (let x = 8; x < 12; x++) {
        const p = kitchenTile({ x, y: 0 });
        add(
          p,
          () => drawTileProp(ctx, art, p),
          0,
          p.footprint,
          propHeight(art, p),
        );
      }
    }
    for (let y = 0; y < 5; y++)
      add(
        { x: 7, y },
        () => furniture(ctx, project, { x: 7, y }, "counter", y === 4),
        0,
        [1, 1],
        30,
      );
    for (let seat = 4; seat < game.seats.length; seat++) {
      const p = foodSpot(seat);
      add(
        p,
        () =>
          furniture(ctx, project, p, "counter", seat === game.seats.length - 1),
        0,
        [1, 1],
        30,
      );
    }
    add({ x: 11, y: 2 }, () => prop(9, { x: 11, y: 2 }, 22));
    // Diners and furniture occupy distinct floor cells; draw everything by its feet.
    tables.forEach((p, i) => {
      if (i >= game.seats.length) return;
      const s = game.seats[i],
        chair = { x: p.x - 1, y: p.y };
      add(
        chair,
        () => {
          const q = project(chair);
          if (art) drawTileProp(ctx, art, chairTile(chair));
          else furniture(ctx, project, chair, "chair");
        },
        0,
        chairTile(chair).footprint,
        38,
      );
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
      add(
        p,
        () => {
          if (art) {
            const q = project(p);
            drawTileProp(ctx, art, tableTile(p));
          } else furniture(ctx, project, p, "table");
          const q = project(p);
          text(String(i + 1), q.x, q.y + 3, "#684d35", 8);
          if (s?.stage === "eating" || s?.stage === "dirty") {
            const cleaner = Object.values(game.actors).find(
              (a) =>
                a.phase === "work" &&
                a.job?.kind === "clean" &&
                a.job.seat === i,
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
              -28,
            );
            ctx.restore();
          }
        },
        0,
        tableTile(p).footprint,
        30,
      );
      if (s?.stage === "arriving") {
        const p = along(guestRoute(i), 1 - s.left / s.duration);
        add(p, () =>
          person(p, s.id, "guest", true, undefined, false, undefined),
        );
      }
    });
    game.departures.forEach((d) => {
      const p = along(
        [...guestRoute(d.seat)].reverse(),
        1 - d.left / d.duration,
      );
      add(p, () => person(p, d.id, "guest", true, undefined, false, undefined));
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
            y += (destination.y - 28 - y) * progress;
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
    depthOrder(items).forEach((item) => item.draw());
    walks.current.endFrame();
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
        (((e.clientX - r.left - r.width / 2) * H) / r.height - camera.x) /
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
      const p = unproject({ x, y }, 28);
      if (
        Math.abs(p.x - tables[i].x) < 0.65 &&
        Math.abs(p.y - tables[i].y) < 0.65
      ) {
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
              x: Math.max(-300, Math.min(300, d.ox + (dx * H) / r.height)),
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
