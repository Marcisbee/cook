# Cook

A playable isometric restaurant-management game, grown from the original Cook prototype.

Name your restaurant, feed your neighbors, build out the dining room, and hire a kitchen crew. The full-screen Canvas 2D world uses shaded isometric geometry, depth-sorted characters, directional walk cycles, cooking and eating animation, steam, and meal delivery. Customers and staff follow routes around tables and the kitchen counter.

## Play

- The owner cooks automatically. Click a ready table, press **Serve a meal**, or use **Space** to deliver an order. The owner walks it to the guest and returns to the stove; their cooking pauses during that trip.
- Hire a waiter to deliver orders automatically. Each delivery includes the walk out and back. Hire an extra chef to keep cooking while you serve.
- Guests pay after eating and then walk out. An empty till never prevents manual service. Hired staff charge the displayed fee and wages every game minute; unpaid staff leave.
- Use **Build** for additional tables and publicity, **Team** for staff, and **Menu** for dishes. Grow to eight seats, unlock dishes after 15 and 50 happy guests, and reach popularity level five.
- Drag to pan; pinch, scroll, or use the camera buttons to zoom. Reset the camera with the percentage button. Click a table to inspect it or an empty footprint to open Build. All management actions also have ordinary keyboard-accessible buttons.
- **P** pauses. The **2×** control speeds up both service and wages. Hidden tabs rest without offline income or wage charges.
- Progress saves in this browser every two seconds and when leaving the game, including active orders and return trips. **Menu** in the top-right returns to the title screen. Starting a new restaurant explicitly replaces existing progress after a warning.
- Private browsing, storage restrictions, or clearing site data may prevent retention. The game displays a warning when saving fails. Reduced-motion preferences disable decorative bobbing and limb cycles while keeping necessary travel visible.

## Run locally

Use Node.js 22.12+ (or a supported newer release).

```sh
npm ci
npm run dev -- --host 127.0.0.1 --port 5189 --strictPort
```

Open `http://127.0.0.1:5189`. No backend, accounts, API keys, or remote assets are needed to play.

```sh
npm run check
npm test
npx playwright install chromium
npm run test:e2e
npm run build
```

Playwright starts its own server on port 5188. The production build is in `dist/` and can be hosted on a static web server. `npm run serve -- --host 127.0.0.1` previews that build locally.

## Structure

- `src/game.ts`: simulation, economy, staff, travel timing and save validation.
- `src/world.ts`: floor layout and shared routes used by the simulation and renderer.
- `src/RestaurantCanvas.tsx`: isometric geometry, animated characters, depth sorting, camera and hit testing.
- `src/main.tsx`: game HUD, management controls, browser clock and local saves.

Simulation tests cover progression, purchase constraints, staff dismissal, wages, saves and delivery round trips. Browser tests cover the actual gameplay loop, mobile controls, canvas interaction, animation, zoom and pause.
