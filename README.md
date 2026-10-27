# Cook

A small, browser-based restaurant management game, grown from the original Cook prototype.

Name your restaurant and owner, cook for arriving guests, and serve ready meals to earn money. Expand to eight seats, hire a chef and two waiters, and buy publicity to attract more guests. Unlock dishes after 15 and 50 happy guests. Complete the growth milestones or keep running your restaurant for as long as you like.

## Play

- The owner cooks automatically and never charges wages. Press **Serve a meal** to deliver food, or hire a waiter to do it for you.
- Guests pay after eating. Dish income is net of ingredients. Additional staff charge the displayed hiring fee and wages every game minute; unpaid staff leave. Manual service always remains available.
- Seat and publicity purchases are permanent. A full dining room turns away new arrivals. More publicity increases arrivals; it does not speed up cooking.
- Pause freezes service and wages. The 2× control speeds both up. Hidden tabs rest without offline earnings or wage charges.
- Progress saves every two seconds and when leaving the game. **Menu** returns to the title screen. Starting a new restaurant requires explicitly opening it after a replacement warning.
- Saves belong to this browser and device. Private browsing, storage restrictions, or clearing site data may prevent retention. The game shows a warning when saving fails.

## Run locally

Use Node.js 22.12+ (or a supported newer release).

```sh
npm ci
npm run dev -- --host 127.0.0.1 --port 5188 --strictPort
```

Open `http://127.0.0.1:5188`. No backend, accounts, API keys, or network services are needed to play.

```sh
npm run check
npm test
npx playwright install chromium
npm run test:e2e
npm run build
```

The production build is in `dist/` and can be hosted on a static web server. `npm run serve -- --host 127.0.0.1` previews that build locally.

## Structure

`src/game.ts` owns the simulation and validates saved progress. `src/main.tsx` renders the game and manages the browser clock and storage. Model tests exercise the economy, progression, dismissal recovery and save boundaries; Playwright tests exercise the real browser loop and mobile controls.
