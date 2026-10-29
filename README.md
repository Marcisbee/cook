# Cook

A playable restaurant game built around an isometric canvas world, animated character sprite sheets and a detailed pixel-art furniture set.

## Play

1. Guests enter, sit down and choose a meal.
2. Click **ORDER** on a table to send a worker to take the request.
3. The owner or a hired chef cooks it. The owner handles one job at a time.
4. Click the prepared dish on the kitchen counter or its **Food pass** button. An available worker picks it up and delivers it. Requests remain queued while workers are busy.
5. Guests eat, pay and leave a dirty table. Click **CLEAN** before another guest can use it.

Waiters take orders and clean automatically. With a waiter hired, the owner stays in the kitchen and table jobs wait for an available waiter. A trip already underway finishes before the owner returns to cooking. If the last waiter leaves, the owner can handle table jobs again. Delivery still requires selecting a prepared meal. Drag the world to pan, and use the camera buttons to zoom or reset. Table and food actions also have keyboard-accessible buttons below the canvas. **P** pauses; **Esc** closes a panel. Speed changes affect work and wages together.

The compact **Shop** contains tables, publicity, staff, dishes and upgrades. QR menus bypass order-taking visits; a quick stove speeds cooking; a dishwasher speeds cleanup; a later dispatch bell automatically queues prepared dishes. Hire an extra chef to keep the kitchen running while the owner works the floor. Staff charge displayed wages each game minute and leave if unpaid. The owner remains available without money.

Progress saves on this device every second and when leaving the page. Earlier draft saves retain money, tables, staff and menu progress; their live service resets for the new loop. Hidden tabs do not earn offline income or charge wages. Settings provides a confirmed reset. Storage failures show a warning. Reduced motion removes decorative limb cycles and steam animation while preserving necessary travel.

This is a playable design draft pending visual approval.

## Development

Use Node.js 22.12+ or a supported newer release.

```sh
npm ci
npm run dev -- --host 127.0.0.1 --port 5189 --strictPort
npm run check
npm test
npx playwright install chromium
npm run test:e2e
npm run build
```

No backend, remote assets, accounts or API keys are required. Browser tests start a server on port 5188. The static production build is in `dist/`.

- `src/game.ts`: service stages, FIFO worker jobs, economy, upgrades and save migration.
- `src/world.ts`: floor geometry and shared collision-aware walking routes.
- `src/RestaurantCanvas.tsx`: animated sprites, isometric depth sorting, camera and scene hit targets.
- `src/art.ts`: transparent sprite-atlas loading and anchored drawing. Asset specifications and prompts are in `docs/art.md`.
- `src/main.tsx`: compact controls, shop, browser clock and persistence.

Simulation checks cover the complete service cycle, queued work, automation, purchases, firing workers and save continuity. Browser checks exercise a real canvas dish click, mandatory cleanup, pause, persistence and mobile shop controls.
