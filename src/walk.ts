import type { Point } from "./world";

// Locomotion advances with ground travel, not wall time. Turns preserve phase,
// pauses cannot advance it, and standing actors never walk on the spot.
export class WalkCycles {
  private actors = new Map<
    string,
    { x: number; y: number; distance: number }
  >();
  private seen = new Set<string>();
  beginFrame() {
    this.seen.clear();
  }
  frame(key: string, position: Point, moving: boolean, count = 8) {
    this.seen.add(key);
    const previous = this.actors.get(key);
    const delta = previous
      ? Math.hypot(position.x - previous.x, position.y - previous.y)
      : 0;
    const distance =
      (previous?.distance || 0) + (moving && delta < 3 ? delta : 0);
    this.actors.set(key, { ...position, distance });
    return Math.floor((distance / 1.6) * count) % count;
  }
  endFrame() {
    for (const key of this.actors.keys())
      if (!this.seen.has(key)) this.actors.delete(key);
  }
}
