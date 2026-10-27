import React, { useEffect, useRef, useState } from "react";
import { candidates, dishes, Game } from "./game";
import {
  along,
  chefSpot,
  guestRoute,
  pass,
  Point,
  secondChefSpot,
  serviceRoute,
  tables,
} from "./world";

type Props = {
  game: Game;
  onSeat: (seat: number) => void;
  panelOpen: boolean;
  selected: number | null;
};
type V3 = Point & { z?: number };
type Camera = { x: number; y: number; zoom: number };
const colors = [
  "#e9b447",
  "#6d9eb0",
  "#d27860",
  "#8f86b9",
  "#7ea67a",
  "#d9a9b0",
];
const skins = ["#e3aa7b", "#a97150", "#f0c5a0", "#78513e"];
const shade = (hex: string, amount: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgb(${Math.max(0, Math.min(255, (n >> 16) + amount))},${Math.max(0, Math.min(255, ((n >> 8) & 255) + amount))},${Math.max(0, Math.min(255, (n & 255) + amount))})`;
};
const project = ({ x, y, z = 0 }: V3) => ({
  x: (x - y) * 42,
  y: (x + y) * 21 - z * 42,
});

export function RestaurantCanvas({ game, onSeat, panelOpen, selected }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const state = useRef({ game, onSeat, panelOpen, selected });
  state.current = { game, onSeat, panelOpen, selected };
  const camera = useRef<Camera>({ x: 0, y: 0, zoom: 1 });
  const [zoomLabel, setZoomLabel] = useState(100);
  const changeZoom = (factor: number) => {
    camera.current.zoom = Math.max(
      0.65,
      Math.min(2.8, camera.current.zoom * factor),
    );
    setZoomLabel(Math.round(camera.current.zoom * 100));
  };
  useEffect(() => {
    const canvas = canvasRef.current!;
    const c = canvas.getContext("2d")!;
    let width = 1,
      height = 1,
      ratio = 1,
      frame = 0,
      last = performance.now(),
      visualTime = state.current.game.time;
    let dirty = true;
    let renderedGame: Game | undefined;
    let renderedCamera = "";
    let renderedPanel = false;
    let renderedSelection: number | null = null;
    let origin = { x: 0, y: 0 },
      scale = 1,
      hover: number | null = null;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const pointers = new Map<number, Point>();
    let down: Point | null = null,
      moved = false,
      pinch = 0;
    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      width = bounds.width;
      height = bounds.height;
      ratio = Math.min(devicePixelRatio || 1, 2);
      dirty = true;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();
    const poly = (points: V3[], fill: string, stroke?: string) => {
      c.beginPath();
      points.forEach((v, i) => {
        const p = project(v);
        i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y);
      });
      c.closePath();
      c.fillStyle = fill;
      c.fill();
      if (stroke) {
        c.strokeStyle = stroke;
        c.lineWidth = 0.6;
        c.stroke();
      }
    };
    const box = (
      x: number,
      y: number,
      w: number,
      d: number,
      h: number,
      color: string,
      z = 0,
    ) => {
      poly(
        [
          { x: x + w, y, z },
          { x: x + w, y: y + d, z },
          { x: x + w, y: y + d, z: z + h },
          { x: x + w, y, z: z + h },
        ],
        shade(color, -30),
      );
      poly(
        [
          { x, y: y + d, z },
          { x: x + w, y: y + d, z },
          { x: x + w, y: y + d, z: z + h },
          { x, y: y + d, z: z + h },
        ],
        shade(color, -12),
      );
      poly(
        [
          { x, y, z: z + h },
          { x: x + w, y, z: z + h },
          { x: x + w, y: y + d, z: z + h },
          { x, y: y + d, z: z + h },
        ],
        shade(color, 16),
      );
    };
    const ellipse = (
      x: number,
      y: number,
      rx: number,
      ry: number,
      fill: string,
    ) => {
      c.beginPath();
      c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
      c.fillStyle = fill;
      c.fill();
    };
    const line = (
      x: number,
      y: number,
      tx: number,
      ty: number,
      color: string,
      size: number,
    ) => {
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(tx, ty);
      c.strokeStyle = color;
      c.lineWidth = size;
      c.lineCap = "round";
      c.stroke();
    };
    const text = (
      value: string,
      x: number,
      y: number,
      size: number,
      color: string,
      weight = 600,
    ) => {
      c.font = `${weight} ${size}px "Trebuchet MS",sans-serif`;
      c.textAlign = "center";
      c.fillStyle = color;
      c.fillText(value, x, y);
    };
    const plant = (x: number, y: number, size = 1) => {
      box(x - 0.18, y - 0.18, 0.36, 0.36, 0.35, "#b97555");
      const p = project({ x, y, z: 0.35 });
      for (let i = 0; i < 7; i++) {
        const a = i * 2.4;
        const dx = Math.sin(a) * 17 * size,
          dy = -Math.cos(a) * 8 * size - 15 * size;
        line(p.x, p.y, p.x + dx, p.y + dy, "#516a46", 2);
        ellipse(
          p.x + dx,
          p.y + dy,
          8 * size,
          5 * size,
          i % 2 ? "#63865b" : "#8aab67",
        );
      }
    };
    const plate = (x: number, y: number, dish: number, z = 0.78) => {
      const p = project({ x, y, z });
      ellipse(p.x, p.y + 2, 12, 6, "#b6af98");
      ellipse(p.x, p.y, 12, 6, "#fff7da");
      ellipse(
        p.x,
        p.y - 1,
        8,
        3.5,
        dish === 0 ? "#d59639" : dish === 1 ? "#e4b956" : "#9f543b",
      );
      for (let i = 0; i < 3; i++)
        ellipse(p.x - 4 + i * 4, p.y - 2 + (i % 2), 1.6, 1, "#6d8c4f");
    };
    const person = (
      position: Point,
      id: number,
      kind: "guest" | "chef" | "waiter",
      mode: "walk" | "idle" | "eat" | "cook",
      dx = 0,
      dy = 1,
      carrying = false,
      dish = 0,
    ) => {
      const p = project(position);
      const walk = mode === "walk",
        t = visualTime * (walk ? 10 : 4) + id;
      const stride = walk && !reduced.matches ? Math.sin(t) * 6 : 0,
        bob = walk && !reduced.matches ? Math.abs(Math.cos(t)) * 1.5 : 0;
      const skin = skins[id % skins.length],
        shirt =
          kind === "chef"
            ? "#f6f0d8"
            : kind === "waiter"
              ? "#476a65"
              : colors[id % colors.length];
      const facing = Math.sign(dx - dy) || 1,
        back = dx + dy < 0;
      c.save();
      c.translate(p.x, p.y);
      ellipse(0, 1, 13, 6, "#283d3429");
      line(-4, -13, -5 + stride, 0, "#3d4a49", 5);
      line(4, -13, 5 - stride, 0, "#34413e", 5);
      ellipse(-5 + stride, 0, 4, 2.3, "#283a35");
      ellipse(5 - stride, 0, 4, 2.3, "#283a35");
      c.translate(0, -bob);
      // Layered shaded body, apron, arms and head form a directional sprite.
      c.fillStyle = shade(shirt, -22);
      c.beginPath();
      c.roundRect(-9, -33, 18, 22, [7, 7, 4, 4]);
      c.fill();
      c.fillStyle = shirt;
      c.beginPath();
      c.roundRect(-9, -33, 14, 20, [7, 4, 3, 4]);
      c.fill();
      if (kind !== "guest") {
        c.fillStyle = kind === "chef" ? "#d2ac69" : "#e8dfc4";
        c.fillRect(-6, -22, 12, 11);
        line(-5, -29, -5, -21, c.fillStyle as string, 2);
        line(5, -29, 5, -21, c.fillStyle as string, 2);
      }
      const cook = mode === "cook" && !reduced.matches ? Math.sin(t) * 5 : 0;
      const eat =
        mode === "eat" && !reduced.matches ? (Math.sin(t) + 1) * 5 : 0;
      line(-8, -29, -12 - stride * 0.5, -16 - cook, shade(shirt, -10), 5);
      ellipse(-12 - stride * 0.5, -15 - cook, 2.8, 3, skin);
      line(
        8,
        -29,
        carrying ? 17 : mode === "cook" ? 19 : 12 + stride * 0.5,
        carrying ? -26 : mode === "cook" ? -29 - cook : -17 - eat,
        shirt,
        5,
      );
      ellipse(
        carrying ? 17 : mode === "cook" ? 19 : 12 + stride * 0.5,
        carrying ? -26 : mode === "cook" ? -28 - cook : -16 - eat,
        2.8,
        3,
        skin,
      );
      if (mode === "cook") {
        line(19, -29 - cook, 28, -40 - cook, "#8e9690", 2);
        ellipse(28, -40 - cook, 3, 2, "#aab0a3");
      }
      if (mode === "eat") {
        line(12, -18 - eat, 9, -26 - eat, "#d7d6c7", 1.4);
      }
      ellipse(0, -39, 10, 12, shade(skin, -15));
      ellipse(-2, -40, 9, 11, skin);
      ellipse(facing * 9, -38, 2.7, 3, skin);
      if (kind === "chef") {
        c.fillStyle = "#eee9d7";
        c.fillRect(-10, -53, 20, 8);
        ellipse(0, -55, 12, 7, "#fff9e9");
        ellipse(-7, -57, 6, 6, "#fff9e9");
        ellipse(5, -58, 7, 7, "#fff9e9");
      } else {
        c.beginPath();
        c.ellipse(0, -44, 10, 8, 0, Math.PI, Math.PI * 2);
        c.fillStyle =
          id % 3 === 0 ? "#ad8055" : id % 3 === 1 ? "#493b32" : "#72503a";
        c.fill();
        if (back) {
          ellipse(0, -41, 10, 9, id % 3 === 0 ? "#ad8055" : "#493b32");
        }
      }
      if (!back) {
        ellipse(facing * 3, -39, 1.1, 1.4, "#354237");
        ellipse(facing * 7, -39, 1, 1.3, "#354237");
        line(facing * 4, -33, facing * 6, -33, "#995c45", 1);
      }
      if (carrying) {
        ellipse(19, -26, 14, 5, "#56736c");
        ellipse(19, -28, 10, 4, "#fff3d1");
        ellipse(
          19,
          -29,
          7,
          2.5,
          dish === 0 ? "#d59639" : dish === 1 ? "#e4b956" : "#9f543b",
        );
      }
      c.restore();
    };
    const draw = (now: number) => {
      frame = requestAnimationFrame(draw);
      const { game: g, panelOpen: open, selected: selection } = state.current;
      const delta = Math.min((now - last) / 1000, 0.05);
      last = now;
      // Interpolate one simulation tick behind, never ahead of delivered game state.
      if (!g.paused && !document.hidden)
        visualTime = Math.min(g.time, visualTime + delta * g.speed);
      if (g.paused || Math.abs(g.time - visualTime) > 0.3) visualTime = g.time;
      const cameraKey =
        camera.current.x + ":" + camera.current.y + ":" + camera.current.zoom;
      if (
        !dirty &&
        renderedGame === g &&
        visualTime === g.time &&
        renderedPanel === open &&
        renderedSelection === selection &&
        renderedCamera === cameraKey
      )
        return;
      renderedGame = g;
      renderedPanel = open;
      renderedSelection = selection;
      dirty = false;
      renderedCamera = cameraKey;
      const elapsed = (left: number, duration: number) =>
        Math.max(
          0,
          Math.min(1, (duration - left - (g.time - visualTime)) / duration),
        );
      const roomWidth = width - (open && width > 900 ? 340 : 0);
      scale =
        Math.min(roomWidth / 1080, (height - 160) / 660) * camera.current.zoom;
      scale = Math.max(0.28, scale);
      origin = {
        x: roomWidth / 2 - 42 * scale + camera.current.x,
        y: height * 0.52 - 220 * scale + camera.current.y,
      };
      c.setTransform(ratio, 0, 0, ratio, 0, 0);
      c.clearRect(0, 0, width, height);
      const bg = c.createRadialGradient(
        width * 0.45,
        height * 0.45,
        0,
        width * 0.45,
        height * 0.45,
        width * 0.8,
      );
      bg.addColorStop(0, "#d5dfc2");
      bg.addColorStop(1, "#a6be9c");
      c.fillStyle = bg;
      c.fillRect(0, 0, width, height);
      c.save();
      c.translate(origin.x, origin.y);
      c.scale(scale, scale);
      // The island, pavement, garden and structural floor are all canvas geometry.
      c.save();
      c.translate(0, 16);
      poly(
        [
          { x: -1.5, y: -1.3 },
          { x: 12.7, y: -1.3 },
          { x: 12.7, y: 11.7 },
          { x: -1.5, y: 11.7 },
        ],
        "#40584024",
      );
      c.restore();
      box(-1.2, -1.1, 13.4, 12.2, 0.3, "#879e75", -0.7);
      box(-0.65, -0.65, 12.3, 10.3, 0.34, "#977c59", -0.35);
      for (let x = 0; x < 12; x++)
        for (let y = 0; y < 10; y++) {
          const kitchen = x >= 8 && y < 5;
          poly(
            [
              { x: x - 0.5, y: y - 0.5 },
              { x: x + 0.5, y: y - 0.5 },
              { x: x + 0.5, y: y + 0.5 },
              { x: x - 0.5, y: y + 0.5 },
            ],
            kitchen
              ? (x + y) % 2
                ? "#c8d3c8"
                : "#e3e7d7"
              : (x + y) % 2
                ? "#d2bc93"
                : "#e5d3ad",
            "#c4b38f",
          );
        }
      for (let x = 0; x < 12; x++)
        box(x - 0.48, 9.8, 0.94, 1, 0.08, x % 2 ? "#bdbaaa" : "#cec9b6", -0.27);
      // Back walls with a cutaway front preserve sightlines into the restaurant.
      box(-0.65, -0.65, 12.3, 0.18, 2.6, "#c7d8bd");
      box(-0.65, -0.5, 0.18, 10.15, 2.6, "#9ab895");
      box(-0.66, -0.66, 12.32, 0.22, 0.12, "#718e6e", 2.6);
      box(-0.66, -0.5, 0.22, 10.15, 0.12, "#718e6e", 2.6);
      box(-0.43, -0.42, 12, 0.09, 0.2, "#899970");
      box(-0.43, -0.35, 0.09, 10, 0.2, "#748e64");
      for (const x of [1, 4, 9]) {
        box(x, -0.39, 1.8, 0.08, 1.3, "#5d7a70", 0.8);
        box(x + 0.1, -0.29, 1.6, 0.03, 1.1, "#a8c9c5", 0.9);
        box(x + 0.85, -0.25, 0.07, 0.04, 1.15, "#efe7ca", 0.87);
        box(x + 0.1, -0.25, 1.6, 0.04, 0.06, "#efe7ca", 1.4);
        box(x - 0.08, -0.2, 1.96, 0.28, 0.1, "#e6d9b9", 0.78);
      }
      // Wall sign, hung on the left wall in its isometric plane.
      c.save();
      const sign = project({ x: -0.35, y: 4.7, z: 1.8 });
      c.translate(sign.x, sign.y);
      c.transform(0.9, 0.45, 0, 1, 0, 0);
      c.fillStyle = "#fff0cd";
      c.beginPath();
      c.roundRect(-73, -24, 146, 48, 5);
      c.fill();
      text(
        g.name.length > 19 ? g.name.slice(0, 18) + "…" : g.name,
        0,
        -3,
        16,
        "#40604b",
        800,
      );
      text("KITCHEN & COMPANY", 0, 13, 7, "#8c986d");
      c.restore();
      // Kitchen cabinetry, range, sink and food pass.
      for (let x = 8; x < 12; x++) {
        box(x - 0.48, -0.35, 0.94, 1.1, 0.72, "#638b7b");
        box(x - 0.5, -0.37, 0.98, 1.14, 0.1, "#e8e6ce", 0.72);
        if (x < 11)
          for (const yy of [0.02, 0.47])
            for (const xx of [-0.2, 0.2]) {
              const p = project({ x: x + xx, y: yy, z: 0.84 });
              ellipse(p.x, p.y, 8, 4, "#4e5e57");
              ellipse(p.x, p.y, 4, 2, "#859184");
            }
        else {
          box(x - 0.3, -0.1, 0.6, 0.6, 0.04, "#92aaa0", 0.84);
          const p = project({ x, y: 0, z: 1 });
          line(p.x, p.y + 7, p.x, p.y - 8, "#acbbb0", 3);
        }
      }
      box(11, 1.2, 0.48, 1, 0.75, "#a2b5a4");
      box(11, 1.2, 0.49, 1, 0.08, "#e9e6cb", 0.75);
      // Indoor props and actors are depth sorted together.
      const objects: { depth: number; draw: () => void }[] = [];
      const add = (x: number, y: number, fn: () => void) =>
        objects.push({ depth: x + y, draw: fn });
      for (let y = 0; y < 5; y++)
        add(7, y, () => {
          box(6.7, y - 0.46, 0.6, 0.92, 0.85, "#b48252");
          box(6.62, y - 0.5, 0.76, 1, 0.1, "#ece3bf", 0.85);
          if (y === 3) {
            const p = project({ x: 7, y, z: 1 });
            text("ORDER UP", p.x, p.y - 5, 6, "#7c7258");
          }
        });
      add(0.1, 0.5, () => plant(0.1, 0.5, 1.3));
      add(0.1, 8.6, () => plant(0.1, 8.6, 1.1));
      add(11, 8.7, () => plant(11, 8.7, 1.5));
      add(10.8, 6.7, () => {
        box(10.4, 6.3, 0.9, 0.9, 0.52, "#a27150");
        box(10.35, 6.25, 1, 1, 0.08, "#d6b07c", 0.52);
        const p = project({ x: 10.8, y: 6.7, z: 0.65 });
        text("COOK", p.x, p.y, 10, "#775d40");
      });
      tables.forEach((t, i) => {
        const owned = i < g.seats.length,
          guest = g.seats[i];
        if (!owned) {
          const p = project(t);
          c.save();
          c.setLineDash([5, 5]);
          poly(
            [
              { x: t.x - 0.55, y: t.y - 0.55 },
              { x: t.x + 0.55, y: t.y - 0.55 },
              { x: t.x + 0.55, y: t.y + 0.55 },
              { x: t.x - 0.55, y: t.y + 0.55 },
            ],
            "#fbefce20",
            "#ad9f7a",
          );
          c.setLineDash([]);
          text("+", p.x, p.y + 5, 21, "#a49370");
          c.restore();
          return;
        }
        add(t.x, t.y, () => {
          if (selection === i || hover === i) {
            const p = project(t);
            ellipse(p.x, p.y + 8, 46, 23, "#f5e6a280");
          }
          box(t.x - 0.45, t.y - 0.4, 0.12, 0.12, 0.68, "#886243");
          box(t.x + 0.33, t.y + 0.25, 0.12, 0.12, 0.68, "#886243");
          box(t.x - 0.55, t.y - 0.5, 1.1, 1, 0.12, "#b27b4b", 0.65);
          box(t.x - 0.53, t.y - 0.48, 1.06, 0.96, 0.04, "#d5a76e", 0.77);
          // Linen runner and ceramic flower vase.
          poly(
            [
              { x: t.x - 0.17, y: t.y - 0.46, z: 0.82 },
              { x: t.x + 0.17, y: t.y - 0.46, z: 0.82 },
              { x: t.x + 0.17, y: t.y + 0.46, z: 0.82 },
              { x: t.x - 0.17, y: t.y + 0.46, z: 0.82 },
            ],
            "#f4e6c1",
          );
          const p = project({ x: t.x - 0.28, y: t.y - 0.25, z: 0.86 });
          ellipse(p.x, p.y, 3, 3, "#799b83");
          line(p.x, p.y, p.x, p.y - 10, "#739254", 1);
          ellipse(p.x, p.y - 11, 3, 3, "#e5bf5e");
          if (guest?.stage === "eating")
            plate(t.x + 0.15, t.y + 0.24, guest.dish);
          else {
            const p = project({ x: t.x + 0.24, y: t.y + 0.2, z: 0.83 });
            ellipse(p.x, p.y, 9, 4.5, "#eee7cd");
          }
        });
        add(t.x, t.y + 0.72, () => {
          box(t.x - 0.23, t.y + 0.54, 0.46, 0.42, 0.36, "#658b76");
          box(t.x - 0.23, t.y + 0.92, 0.46, 0.09, 0.5, "#537964", 0.15);
        });
        if (guest) {
          const progress = elapsed(guest.left, guest.duration);
          const pos =
            guest.stage === "arriving"
              ? along(guestRoute(i), progress)
              : { x: t.x, y: t.y + 0.7, dx: 0, dy: -1 };
          add(pos.x, pos.y + 0.05, () =>
            person(
              pos,
              guest.id,
              "guest",
              guest.stage === "arriving"
                ? "walk"
                : guest.stage === "eating"
                  ? "eat"
                  : "idle",
              pos.dx,
              pos.dy,
            ),
          );
        }
      });
      const drawWorker = (id: string, index: number) => {
        const isOwner = id === "player";
        const servingSeat = g.seats.findIndex(
          (s) => s?.stage === "serving" && s.worker === id,
        );
        const guest = g.seats[servingSeat];
        const returning = g.returning[id];
        if (servingSeat >= 0 && guest) {
          const pos = along(
            serviceRoute(servingSeat, id),
            elapsed(guest.left, guest.duration),
          );
          add(pos.x, pos.y + 0.08, () =>
            person(
              pos,
              isOwner ? 0 : index + 2,
              isOwner ? "chef" : "waiter",
              "walk",
              pos.dx,
              pos.dy,
              true,
              guest.dish,
            ),
          );
          return true;
        }
        if (returning) {
          const pos = along(
            [...serviceRoute(returning.seat, id)].reverse(),
            elapsed(returning.left, returning.duration),
          );
          add(pos.x, pos.y + 0.08, () =>
            person(
              pos,
              isOwner ? 0 : index + 2,
              isOwner ? "chef" : "waiter",
              "walk",
              pos.dx,
              pos.dy,
            ),
          );
          return true;
        }
        if (!isOwner) {
          const pos = { x: pass.x + index * 0.6, y: pass.y };
          add(pos.x, pos.y, () =>
            person(pos, index + 2, "waiter", "idle", 0, -1),
          );
        }
        return false;
      };
      const ownerAway = drawWorker("player", 0);
      if (!ownerAway)
        add(chefSpot.x, chefSpot.y, () =>
          person(
            chefSpot,
            0,
            "chef",
            g.seats.some((s) => s?.worker === "owner") ? "cook" : "idle",
            0,
            -1,
          ),
        );
      g.staff.forEach((id) => {
        const staff = candidates.find((s) => s.id === id)!;
        if (staff.role === "waiter") drawWorker(id, id === "luna" ? 0 : 1);
        else
          add(secondChefSpot.x, secondChefSpot.y, () =>
            person(
              secondChefSpot,
              2,
              "chef",
              g.seats.some((s) => s?.worker === id) ? "cook" : "idle",
              0,
              -1,
            ),
          );
      });
      g.departures.forEach((d) => {
        const pos = along(
          [...guestRoute(d.seat)].reverse(),
          elapsed(d.left, d.duration),
        );
        add(pos.x, pos.y + 0.05, () =>
          person(pos, d.id, "guest", "walk", pos.dx, pos.dy),
        );
      });
      objects.sort((a, b) => a.depth - b.depth).forEach((o) => o.draw());
      // Food at the pass, cooking steam and useful in-world signals.
      const ready = g.seats
        .map((s, i) => ({ s, i }))
        .filter(({ s }) => s?.stage === "ready");
      ready.forEach(({ s }, i) => plate(7, 1 + i * 0.42, s!.dish, 1));
      const cooking = g.seats.filter((s) => s?.stage === "cooking");
      cooking.forEach((guest, i) => {
        const p = project({
          x: guest?.worker === "owner" ? 9 : 10.5,
          y: 0.4,
          z: 1,
        });
        for (let j = 0; j < 3; j++) {
          const f = reduced.matches ? 0.5 : (visualTime * 0.55 + j * 0.33) % 1;
          c.globalAlpha = (1 - f) * 0.45;
          ellipse(
            p.x + Math.sin(f * 6 + j) * 5,
            p.y - f * 35,
            3 + f * 5,
            3 + f * 7,
            "#fff8de",
          );
        }
        c.globalAlpha = 1;
      });
      tables.forEach((t, i) => {
        const guest = g.seats[i];
        if (!guest || guest.stage === "arriving") return;
        const p = project({ x: t.x, y: t.y, z: 1.75 });
        if (guest.stage === "ready") {
          const bob = reduced.matches ? 0 : Math.sin(visualTime * 3) * 2;
          c.fillStyle = "#fff4cc";
          c.beginPath();
          c.roundRect(p.x - 21, p.y - 16 + bob, 42, 24, 8);
          c.fill();
          text("SERVE", p.x, p.y + bob, 8, "#81503e", 800);
        } else if (guest.stage === "cooking" || guest.stage === "eating") {
          c.fillStyle = "#354e4166";
          c.beginPath();
          c.roundRect(p.x - 17, p.y, 34, 5, 3);
          c.fill();
          c.fillStyle = guest.stage === "eating" ? "#f2c864" : "#a9c69e";
          c.beginPath();
          c.roundRect(
            p.x - 17,
            p.y,
            Math.max(2, 34 * elapsed(guest.left, guest.duration)),
            5,
            3,
          );
          c.fill();
        } else if (guest.stage === "ordered")
          text("•••", p.x, p.y, 13, "#fcf0cc");
      });
      g.departures.forEach((d) => {
        const progress = 1 - d.left / d.duration;
        if (progress > 0.4) return;
        const t = tables[d.seat],
          p = project({ x: t.x, y: t.y, z: 1.9 });
        c.globalAlpha = 1 - progress / 0.4;
        text(
          `+€${dishes[d.dish].price}`,
          p.x,
          p.y - progress * 65,
          16,
          "#426b43",
          800,
        );
        c.globalAlpha = 1;
      });
      // Entrance mat, open sign and a small lantern frame the front edge.
      poly(
        [
          { x: 0.3, y: 9.7 },
          { x: 1.7, y: 9.7 },
          { x: 1.7, y: 10.4 },
          { x: 0.3, y: 10.4 },
        ],
        "#657d65",
      );
      const mat = project({ x: 1, y: 10.1 });
      text("WELCOME", mat.x, mat.y + 2, 6, "#f2dfb6");
      c.restore();
    };
    const hit = (p: Point) => {
      const sx = (p.x - origin.x) / scale,
        sy = (p.y - origin.y) / scale;
      let best: number | null = null,
        distance = 1;
      tables.forEach((t, i) => {
        const owned = i < state.current.game.seats.length;
        const center = project({ ...t, z: owned ? 0.8 : 0 });
        const d = Math.hypot((center.x - sx) / 45, (center.y - sy) / 24);
        if (d < distance) {
          distance = d;
          best = i;
        }
        if (state.current.game.seats[i]?.stage === "ready") {
          const bubble = project({ ...t, z: 1.75 });
          if (
            Math.abs(sx - bubble.x) < 24 &&
            sy > bubble.y - 18 &&
            sy < bubble.y + 10
          )
            best = i;
        }
      });
      return best;
    };
    const local = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const pointerDown = (e: PointerEvent) => {
      canvas.setPointerCapture(e.pointerId);
      const p = local(e);
      pointers.set(e.pointerId, p);
      down = p;
      moved = false;
      if (pointers.size === 2) {
        const ps = [...pointers.values()];
        pinch = Math.hypot(ps[0].x - ps[1].x, ps[0].y - ps[1].y);
        moved = true;
      }
    };
    const pointerMove = (e: PointerEvent) => {
      const p = local(e),
        old = pointers.get(e.pointerId);
      const nextHover = hit(p);
      if (hover !== nextHover) dirty = true;
      hover = nextHover;
      canvas.style.cursor = hover !== null ? "pointer" : "grab";
      if (!old) return;
      pointers.set(e.pointerId, p);
      if (pointers.size === 2) {
        const ps = [...pointers.values()];
        const distance = Math.hypot(ps[0].x - ps[1].x, ps[0].y - ps[1].y);
        if (pinch) changeZoom(distance / pinch);
        pinch = distance;
        moved = true;
      } else {
        const dx = p.x - old.x,
          dy = p.y - old.y;
        if (down && Math.hypot(p.x - down.x, p.y - down.y) > 5) moved = true;
        if (moved) {
          camera.current.x += dx;
          camera.current.y += dy;
          canvas.style.cursor = "grabbing";
        }
      }
    };
    const pointerUp = (e: PointerEvent) => {
      if (e.type !== "pointercancel" && !moved && down) {
        const seat = hit(local(e));
        if (seat !== null) state.current.onSeat(seat);
      }
      pointers.delete(e.pointerId);
      down = null;
      pinch = 0;
    };
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      changeZoom(e.deltaY < 0 ? 1.08 : 1 / 1.08);
    };
    canvas.addEventListener("pointerdown", pointerDown);
    canvas.addEventListener("pointermove", pointerMove);
    canvas.addEventListener("pointerup", pointerUp);
    canvas.addEventListener("pointercancel", pointerUp);
    canvas.addEventListener("wheel", wheel, { passive: false });
    frame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      canvas.removeEventListener("pointerdown", pointerDown);
      canvas.removeEventListener("pointermove", pointerMove);
      canvas.removeEventListener("pointerup", pointerUp);
      canvas.removeEventListener("pointercancel", pointerUp);
      canvas.removeEventListener("wheel", wheel);
    };
  }, []);
  return (
    <div className="canvas-world">
      <canvas
        ref={canvasRef}
        aria-label="Isometric restaurant. Drag to pan, pinch or scroll to zoom. Select tables to inspect them; all actions are also available in the controls."
      />
      <div className="camera-controls">
        <button aria-label="Zoom out" onClick={() => changeZoom(1 / 1.2)}>
          −
        </button>
        <button
          aria-label="Reset camera"
          onClick={() => {
            camera.current = { x: 0, y: 0, zoom: 1 };
            setZoomLabel(100);
          }}
        >
          {zoomLabel}%
        </button>
        <button aria-label="Zoom in" onClick={() => changeZoom(1.2)}>
          +
        </button>
      </div>
      <div className="world-caption">
        DRAG TO EXPLORE <span>·</span> SCROLL TO ZOOM
      </div>
    </div>
  );
}
