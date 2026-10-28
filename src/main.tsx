import React, { useEffect, useState, useRef } from "react";
import ReactDOM from "react-dom";
import RestaurantCanvas from "./RestaurantCanvas";
import {
  Game,
  Action,
  newGame,
  readSave,
  update,
  SAVE_KEY,
  candidates,
  dishes,
  upgrades,
  seatPrice,
  publicityPrice,
  isQueued,
} from "./game";
import "./index.css";
const money = (n: number) => "€" + Math.floor(n);
function App() {
  const [game, setGame] = useState<Game | null>(() => {
    try {
      return readSave(localStorage.getItem(SAVE_KEY));
    } catch {
      return null;
    }
  });
  const [panel, setPanel] = useState<"shop" | "help" | "settings" | null>(null);
  const [tab, setTab] = useState<"room" | "team" | "extras" | "menu">("room");
  const [name, setName] = useState("Little Ladle"),
    [owner, setOwner] = useState("Cook");
  const [saveError, setSaveError] = useState(false),
    [reset, setReset] = useState(false);
  const dispatch = (a: Action) => setGame((g) => (g ? update(g, a) : g));
  useEffect(() => {
    let last = performance.now();
    const timer = setInterval(() => {
      const now = performance.now();
      if (!document.hidden)
        setGame((g) =>
          g ? update(g, { type: "tick", seconds: (now - last) / 1000 }) : g,
        );
      last = now;
    }, 50);
    return () => clearInterval(timer);
  }, []);
  const latest = useRef(game);
  latest.current = game;
  useEffect(() => {
    const save = () => {
      if (latest.current)
        try {
          localStorage.setItem(SAVE_KEY, JSON.stringify(latest.current));
          setSaveError(false);
        } catch {
          setSaveError(true);
        }
    };
    const timer = setInterval(save, 1000);
    window.addEventListener("pagehide", save);
    return () => {
      clearInterval(timer);
      window.removeEventListener("pagehide", save);
    };
  }, []);
  useEffect(() => {
    if (!panel) return;
    const previous = document.activeElement as HTMLElement;
    const dialog = document.querySelector<HTMLElement>('[role="dialog"]')!;
    const buttons = () =>
      Array.from(
        dialog.querySelectorAll<HTMLElement>("button:not(:disabled),input"),
      );
    buttons()[0]?.focus();
    const trap = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const list = buttons(),
        first = list[0],
        last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    dialog.addEventListener("keydown", trap);
    return () => {
      dialog.removeEventListener("keydown", trap);
      previous?.focus();
    };
  }, [panel]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === "Escape") {
        setPanel(null);
        setReset(false);
      }
      if (e.key.toLowerCase() === "p") dispatch({ type: "pause" });
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  if (!game)
    return (
      <main className="welcome">
        <div className="title-art" aria-hidden="true" />
        <p className="eyebrow">A SMALL RESTAURANT. A BIG LITTLE DREAM.</p>
        <h1>Little Ladle</h1>
        <p>
          Take orders. Cook something lovely.
          <br />
          Make room for one more.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setGame(newGame(name, owner));
          }}
        >
          <label>
            Restaurant
            <input
              value={name}
              maxLength={40}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
          <label>
            Your name
            <input
              value={owner}
              maxLength={30}
              onChange={(e) => setOwner(e.target.value)}
              required
            />
          </label>
          <button className="primary" type="submit">
            Open the doors →
          </button>
        </form>
        <small>Playable design draft · saved on this device</small>
      </main>
    );
  const tasks = game.seats
    .map((s, i) => ({ s, i }))
    .filter(({ s }) => s && ["request", "dirty"].includes(s.stage));
  const ready = game.seats
    .map((s, i) => ({ s, i }))
    .filter(({ s }) => s?.stage === "ready");
  const busy = Object.values(game.actors).filter((a) => a.job).length;
  const hint =
    game.served === 0
      ? "1 Choose → 2 Take order → 3 Cook → 4 Click food → 5 Clean"
      : game.served < 8
        ? "Grow at your own pace. QR menus unlock after 8 meals."
        : game.log[0];
  const close = () => {
    setPanel(null);
    setReset(false);
  };
  return (
    <main className="game">
      <header>
        <div className="brand">
          <span className="logo">LL</span>
          <div>
            <strong>{game.name}</strong>
            <small>
              DAY {Math.floor(game.time / 180) + 1} · {game.served} meals
            </small>
          </div>
        </div>
        <div className="cash">
          {money(game.cash)}
          <small>{"★".repeat(game.popularity)}</small>
        </div>
        <div className="controls">
          <button
            aria-label={game.paused ? "Resume" : "Pause"}
            onClick={() => dispatch({ type: "pause" })}
          >
            {game.paused ? "▶" : "Ⅱ"}
          </button>
          <button
            aria-label="Change speed"
            onClick={() => dispatch({ type: "speed" })}
          >
            {game.speed}×
          </button>
          <button aria-label="Help" onClick={() => setPanel("help")}>
            ?
          </button>
          <button aria-label="Settings" onClick={() => setPanel("settings")}>
            ☰
          </button>
        </div>
      </header>
      <RestaurantCanvas game={game} dispatch={dispatch} />
      {game.paused && <div className="paused">PAUSED</div>}
      <div className="status">
        <span>{hint}</span>
        <span>
          {busy} working · {game.queue.length} queued
        </span>
      </div>
      <footer>
        <div className="service">
          <section aria-label="Table requests">
            <h2>TABLES</h2>
            <div className="chips">
              {tasks.length ? (
                tasks.map(({ s, i }) => (
                  <button
                    key={i}
                    disabled={game.paused || isQueued(game, i)}
                    onClick={() =>
                      dispatch({
                        type: s!.stage === "request" ? "order" : "clean",
                        seat: i,
                      })
                    }
                  >
                    {isQueued(game, i)
                      ? "Queued"
                      : s!.stage === "request"
                        ? "Order"
                        : "Clean"}{" "}
                    · {i + 1}
                  </button>
                ))
              ) : (
                <span className="empty">
                  {game.seats.some((s) => s?.stage === "choosing")
                    ? "Guests choosing…"
                    : "All caught up"}
                </span>
              )}
            </div>
          </section>
          <section aria-label="Prepared food">
            <h2>
              FOOD PASS <span>{ready.length}</span>
            </h2>
            <div className="chips">
              {ready.length ? (
                ready.map(({ s, i }) => (
                  <button
                    className="food"
                    key={i}
                    disabled={game.paused || isQueued(game, i)}
                    onClick={() => dispatch({ type: "serve", seat: i })}
                  >
                    <span className="mini-plate" />
                    {isQueued(game, i) ? "Queued" : "Serve"} · {i + 1}
                    <small>{dishes[s!.dish].name}</small>
                  </button>
                ))
              ) : (
                <span className="empty">
                  {game.seats.some((s) => s?.stage === "cooking")
                    ? "Cooking…"
                    : "Dishes appear here when ready"}
                </span>
              )}
            </div>
          </section>
        </div>
        <button className="shop-button" onClick={() => setPanel("shop")}>
          Shop <span>＋</span>
        </button>
      </footer>
      <div className="draft">
        DESIGN DRAFT{" "}
        {saveError
          ? "· Saving unavailable — keep this page open"
          : "· Auto-saved on this device"}
      </div>
      {panel && (
        <div className="scrim" onClick={close}>
          <section
            className="panel"
            role="dialog"
            aria-modal="true"
            aria-label={
              panel === "shop"
                ? "Shop"
                : panel === "help"
                  ? "How to play"
                  : "Settings"
            }
            onClick={(e) => e.stopPropagation()}
          >
            <div className="panel-head">
              <h2>
                {panel === "shop"
                  ? "A little better every day"
                  : panel === "help"
                    ? "Welcome to the kitchen"
                    : "Settings"}
              </h2>
              <button aria-label="Close" onClick={close}>
                ×
              </button>
            </div>
            {panel === "shop" && (
              <>
                <nav>
                  {(["room", "team", "extras", "menu"] as const).map((t) => (
                    <button
                      key={t}
                      aria-pressed={tab === t}
                      onClick={() => setTab(t)}
                    >
                      {t}
                    </button>
                  ))}
                </nav>
                <div className="shop-list">
                  {tab === "room" && (
                    <>
                      <article>
                        <div>
                          <h3>One more table</h3>
                          <p>
                            {game.seats.length}/8 tables · More room for guests
                          </p>
                        </div>
                        <button
                          disabled={
                            game.seats.length === 8 ||
                            game.cash < seatPrice(game)
                          }
                          onClick={() => dispatch({ type: "seat" })}
                        >
                          {game.seats.length === 8
                            ? "Max"
                            : money(seatPrice(game))}
                        </button>
                      </article>
                      <article>
                        <div>
                          <h3>Spread the word</h3>
                          <p>More people hear about your restaurant.</p>
                        </div>
                        <button
                          disabled={
                            game.popularity === 5 ||
                            game.cash < publicityPrice(game)
                          }
                          onClick={() => dispatch({ type: "publicity" })}
                        >
                          {game.popularity === 5
                            ? "Max"
                            : money(publicityPrice(game))}
                        </button>
                      </article>
                    </>
                  )}
                  {tab === "team" && (
                    <>
                      <p className="tip">
                        Waiters take orders and clean automatically. Click
                        prepared dishes to request delivery. Wages are paid each
                        minute.
                      </p>
                      {candidates.map((p) => {
                        const hired = game.staff.includes(p.id),
                          chefFull =
                            p.role === "chef" &&
                            game.staff.some(
                              (id) =>
                                candidates.find((p) => p.id === id)?.role ===
                                "chef",
                            );
                        return (
                          <article key={p.id}>
                            <div>
                              <h3>
                                {p.name} <small>{p.role}</small>
                              </h3>
                              <p>
                                {money(p.wage)}/min ·{" "}
                                {p.role === "chef"
                                  ? "Cooks while you work the floor"
                                  : "Orders, deliveries & cleanup"}
                              </p>
                            </div>
                            <button
                              disabled={
                                !hired && (game.cash < p.price || chefFull)
                              }
                              onClick={() =>
                                dispatch({
                                  type: hired ? "fire" : "hire",
                                  id: p.id,
                                })
                              }
                            >
                              {hired ? "Dismiss" : money(p.price)}
                            </button>
                          </article>
                        );
                      })}
                    </>
                  )}
                  {tab === "extras" &&
                    upgrades.map((u) => (
                      <article key={u.id}>
                        <div>
                          <h3>{u.name}</h3>
                          <p>{u.detail}</p>
                          {game.served < u.unlock && (
                            <small>{u.unlock} meals to unlock</small>
                          )}
                        </div>
                        <button
                          disabled={
                            game.upgrades.includes(u.id) ||
                            game.served < u.unlock ||
                            game.cash < u.price
                          }
                          onClick={() =>
                            dispatch({ type: "upgrade", id: u.id })
                          }
                        >
                          {game.upgrades.includes(u.id)
                            ? "Owned"
                            : money(u.price)}
                        </button>
                      </article>
                    ))}
                  {tab === "menu" &&
                    dishes.map((d, i) => (
                      <article key={d.name}>
                        <div>
                          <h3>{d.name}</h3>
                          <p>
                            {money(d.price)} per meal
                            {game.served < d.unlock
                              ? " · " + d.unlock + " meals to unlock"
                              : ""}
                          </p>
                        </div>
                        <button
                          disabled={game.served < d.unlock || game.dish === i}
                          onClick={() => dispatch({ type: "dish", dish: i })}
                        >
                          {game.dish === i ? "On menu" : "Select"}
                        </button>
                      </article>
                    ))}
                </div>
              </>
            )}
            {panel === "help" && (
              <div className="help">
                <ol>
                  <li>Guests walk in and choose a meal.</li>
                  <li>
                    Click <b>ORDER</b> at their table. You walk over to take it.
                  </li>
                  <li>You or a hired chef cook the meal.</li>
                  <li>
                    Click that dish on the kitchen counter or <b>food pass</b>.
                    An available worker delivers it; busy workers keep it
                    queued.
                  </li>
                  <li>
                    Guests eat and pay. Click <b>CLEAN</b> to make the table
                    available again.
                  </li>
                </ol>
                <p>
                  Hire waiters for orders and cleanup. Buy QR menus and kitchen
                  extras as your restaurant grows.
                </p>
                <p>
                  <b>P</b> pauses · <b>Esc</b> closes panels · All table and
                  food actions have keyboard buttons below the canvas.
                </p>
                <button className="primary" onClick={close}>
                  Let’s cook
                </button>
              </div>
            )}
            {panel === "settings" && (
              <div className="help">
                <p>
                  Progress stays in this browser. Closing a shop panel resumes
                  your view; the restaurant keeps running unless paused.
                </p>
                {!reset ? (
                  <button onClick={() => setReset(true)}>
                    Start a new restaurant…
                  </button>
                ) : (
                  <>
                    <p>Erase this restaurant and its saved progress?</p>
                    <button
                      className="danger"
                      onClick={() => {
                        localStorage.removeItem(SAVE_KEY);
                        setGame(null);
                        close();
                      }}
                    >
                      Erase and restart
                    </button>
                    <button onClick={() => setReset(false)}>
                      Keep playing
                    </button>
                  </>
                )}
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
ReactDOM.render(<App />, document.getElementById("root"));
