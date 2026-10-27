import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import {
  Action,
  candidates,
  dishes,
  Game,
  newGame,
  publicityPrice,
  readSave,
  SAVE_KEY,
  seatPrice,
  update,
} from "./game";
import "./index.css";

const money = (n: number) =>
  `€${n.toLocaleString("en", { maximumFractionDigits: 0 })}`;
const labels = {
  arriving: "Taking a seat",
  ordered: "Order placed",
  cooking: "In the kitchen",
  ready: "Ready to serve",
  serving: "On its way",
  eating: "Enjoying a meal",
};
function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    const game = readSave(raw);
    return { game, error: !!raw && !game };
  } catch {
    return { game: null, error: true };
  }
}
function App() {
  const [initial] = useState(load);
  const [game, setGame] = useState<Game | null>(initial.game);
  const [started, setStarted] = useState(false);
  const [tab, setTab] = useState("Grow");
  const [help, setHelp] = useState(false);
  const [reset, setReset] = useState(false);
  const [saveError, setSaveError] = useState(initial.error);
  const latest = useRef(game);
  latest.current = game;
  const act = (action: Action) => setGame((g) => (g ? update(g, action) : g));
  useEffect(() => {
    if (!started) return;
    let last = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now();
      const seconds = (now - last) / 1000;
      last = now;
      if (!document.hidden) act({ type: "tick", seconds });
    }, 100);
    const save = () => {
      if (!latest.current) return;
      try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(latest.current));
        setSaveError(false);
      } catch {
        setSaveError(true);
      }
    };
    const autosave = window.setInterval(save, 2000);
    window.addEventListener("pagehide", save);
    document.addEventListener("visibilitychange", save);
    return () => {
      save();
      clearInterval(timer);
      clearInterval(autosave);
      window.removeEventListener("pagehide", save);
      document.removeEventListener("visibilitychange", save);
    };
  }, [started]);
  function begin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setGame(newGame(String(data.get("restaurant")), String(data.get("owner"))));
    setStarted(true);
  }
  if (!started || !game)
    return (
      <main className="welcome">
        <div className="brand">
          <span className="brand-icon">c.</span> cook{" "}
          <span className="eyebrow">A LITTLE RESTAURANT GAME</span>
        </div>
        <div className="welcome-grid">
          <section>
            <span className="eyebrow accent">GOOD FOOD. BIG DREAMS.</span>
            <h1>
              A little place.
              <br />A lot of possibility.
            </h1>
            <p>
              Open the doors, feed your neighbors, and turn one little table
              into the place everyone talks about.
            </p>
            {game && !reset ? (
              <div className="resume">
                <h2>{game.name}</h2>
                <p>
                  {game.served} happy guests · {money(game.cash)} in the till
                </p>
                <button className="primary" onClick={() => setStarted(true)}>
                  Continue your restaurant →
                </button>
                <button className="text-button" onClick={() => setReset(true)}>
                  Start a new restaurant
                </button>
              </div>
            ) : (
              <form onSubmit={begin}>
                {reset && (
                  <p className="warning">
                    Opening a new restaurant replaces your saved progress.
                  </p>
                )}
                <label>
                  Restaurant name
                  <input
                    name="restaurant"
                    maxLength={40}
                    required
                    defaultValue="Black Oasis"
                    autoComplete="off"
                  />
                </label>
                <label>
                  Your name
                  <input
                    name="owner"
                    maxLength={30}
                    required
                    defaultValue="John Cook"
                    autoComplete="given-name"
                  />
                </label>
                <button className="primary" type="submit">
                  Open for business <span>→</span>
                </button>
                {game && (
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => setReset(false)}
                  >
                    Keep my restaurant
                  </button>
                )}
              </form>
            )}
            <small>
              {saveError
                ? "Saved progress could not be loaded. You can start fresh."
                : "No sign-up. Progress saved in this browser."}
            </small>
          </section>
          <div className="welcome-art" aria-hidden="true">
            <div className="awning" />
            <div className="shop-sign">
              THE GOOD
              <br />
              <em>little</em> LIFE
            </div>
            <div className="shop-window">
              🌿<span>🍝</span>🌿
            </div>
            <div className="shop-door">OPEN</div>
            <div className="pavement">Made with a little love.</div>
          </div>
        </div>
        <footer>Cook something good. Build something yours.</footer>
      </main>
    );
  const ready = game.seats.filter((s) => s?.stage === "ready").length;
  const wages = game.staff.reduce(
    (sum, id) => sum + candidates.find((s) => s.id === id)!.wage,
    0,
  );
  const goals = [
    {
      title: "Your first regulars",
      detail: "Serve 15 guests to unlock house pasta.",
      value: game.served,
      max: 15,
    },
    {
      title: "A neighborhood favorite",
      detail: "Serve 50 guests to unlock the chef’s special.",
      value: game.served,
      max: 50,
    },
    {
      title: "A full house",
      detail: "Grow your dining room to all 8 seats.",
      value: game.seats.length,
      max: 8,
    },
    {
      title: "The talk of the town",
      detail: "Reach popularity level 5.",
      value: game.popularity,
      max: 5,
    },
  ];
  const goal = goals.find((g) => g.value < g.max);
  return (
    <div className="app">
      <header>
        <div className="brand">
          <span className="brand-icon">c.</span> cook{" "}
          <span className="header-divider" />{" "}
          <span className="restaurant-name">{game.name}</span>
        </div>
        <div className="header-actions">
          <span className="save-status">
            {saveError ? "Saving unavailable" : "Saved on this device"}
          </span>
          <button aria-label="How to play" onClick={() => setHelp(!help)}>
            ?
          </button>
          <button
            onClick={() => {
              setStarted(false);
              setReset(false);
            }}
          >
            Menu
          </button>
        </div>
      </header>
      <main className="dashboard">
        <div className="page-heading">
          <div>
            <div className="eyebrow">YOUR LITTLE CORNER OF THE WORLD</div>
            <h1>Good things are cooking.</h1>
            <p>Welcome back to the floor, {game.owner}.</p>
          </div>
          <div className="clock">
            <span className={game.paused ? "dot paused" : "dot"} />
            {game.paused ? "Service paused" : "Open for business"}
            <div className="playback">
              <button
                aria-label={game.paused ? "Resume service" : "Pause service"}
                onClick={() => act({ type: "pause" })}
              >
                {game.paused ? "▶ Resume" : "Ⅱ Pause"}
              </button>
              <button
                aria-label="Change game speed"
                onClick={() => act({ type: "speed" })}
              >
                {game.speed}×
              </button>
            </div>
          </div>
        </div>
        {(help || saveError) && (
          <section className="help" aria-label="How to play">
            <div>
              <strong>
                {saveError
                  ? "Progress cannot be saved"
                  : "A small guide to a great restaurant"}
              </strong>
              <p>
                {saveError
                  ? "Browser storage is unavailable. Keep this tab open to keep playing; reloading may lose progress."
                  : "You cook automatically. When a meal is ready, press Serve a meal. Guests pay after eating. Buy seats for more guests, hire waiters to serve automatically, and use publicity to bring people in. Wages are paid every game minute. Service rests while this tab is hidden."}
              </p>
            </div>
            <button
              onClick={() => setHelp(false)}
              aria-label="Close guide"
              hidden={saveError}
            >
              ×
            </button>
          </section>
        )}
        <section className="stats" aria-label="Restaurant statistics">
          <div>
            <span className="stat-icon">€</span>
            <div>
              <small>IN THE TILL</small>
              <strong data-testid="cash">{money(game.cash)}</strong>
            </div>
          </div>
          <div>
            <span className="stat-icon">♡</span>
            <div>
              <small>HAPPY GUESTS</small>
              <strong data-testid="served">{game.served}</strong>
            </div>
          </div>
          <div>
            <span className="stat-icon">▦</span>
            <div>
              <small>SEATS</small>
              <strong>
                {game.seats.filter(Boolean).length}
                <i> / {game.seats.length}</i>
              </strong>
            </div>
          </div>
          <div>
            <span className="stat-icon">✦</span>
            <div>
              <small>POPULARITY</small>
              <strong>
                {game.popularity}
                <i> / 5</i>
              </strong>
            </div>
          </div>
        </section>
        <div className="game-layout">
          <section className="floor-panel">
            <div className="panel-heading">
              <div>
                <h2>The dining room</h2>
                <p>A seat at the table. A meal to remember.</p>
              </div>
              <span className="tag">{game.seats.length} of 8 seats</span>
            </div>
            <div className="restaurant">
              <div className="wall">
                <span>🌿</span>
                <div className="wall-sign">
                  {game.name}
                  <small>FRESH FOOD · GOOD COMPANY</small>
                </div>
                <span>🌿</span>
              </div>
              <div className="room">
                <div className="tables">
                  {Array.from({ length: 8 }, (_, i) => {
                    const guest = game.seats[i];
                    const owned = i < game.seats.length;
                    return (
                      <div
                        className={`table-space ${owned ? "" : "unowned"}`}
                        key={i}
                      >
                        {owned ? (
                          <>
                            <div className={`table ${guest ? "occupied" : ""}`}>
                              <span className="table-number">
                                {String(i + 1).padStart(2, "0")}
                              </span>
                              <span className="plate" aria-hidden="true">
                                {guest &&
                                ["ready", "serving", "eating"].includes(
                                  guest.stage,
                                )
                                  ? dishes[guest.dish].icon
                                  : "·"}
                              </span>
                            </div>
                            <div className="chair" />
                            <span className="guest" aria-hidden="true">
                              {guest
                                ? ["🧑🏽", "👩🏻", "👨🏾", "👩🏼"][guest.id % 4]
                                : ""}
                            </span>
                            <div
                              className={`seat-label ${guest?.stage === "ready" ? "ready" : ""}`}
                            >
                              {guest ? labels[guest.stage] : "Free seat"}
                            </div>
                            {guest && guest.duration > 0 && (
                              <progress
                                aria-label={`Seat ${i + 1}: ${labels[guest.stage]}`}
                                value={guest.duration - guest.left}
                                max={guest.duration}
                              />
                            )}
                          </>
                        ) : (
                          <div className="empty-seat">
                            <span>＋</span>Room to grow
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="kitchen">
                  <span className="eyebrow">THE KITCHEN</span>
                  <div className="stove">♨ &nbsp; ♨</div>
                  <span className="chef-avatar" aria-hidden="true">
                    👨‍🍳
                  </span>
                  <strong>{game.owner}</strong>
                  <small>Owner · always cooking</small>
                  {game.staff
                    .filter(
                      (id) =>
                        candidates.find((s) => s.id === id)?.role === "chef",
                    )
                    .map((id) => (
                      <div className="kitchen-staff" key={id}>
                        👩‍🍳 {candidates.find((s) => s.id === id)!.name}
                      </div>
                    ))}
                  <div className="pass">
                    <span>THE PASS</span>
                    <strong>{ready ? `${ready} ready` : "All clear"}</strong>
                  </div>
                  <div
                    className="waiter-icons"
                    aria-label={`${game.staff.filter((id) => candidates.find((s) => s.id === id)?.role === "waiter").length} waiters working`}
                  >
                    {game.staff
                      .filter(
                        (id) =>
                          candidates.find((s) => s.id === id)?.role ===
                          "waiter",
                      )
                      .map((id) => (
                        <span
                          key={id}
                          title={candidates.find((s) => s.id === id)!.name}
                        >
                          🧑‍💼
                        </span>
                      ))}
                  </div>
                </div>
              </div>
              <div className="front-door">
                <span>WELCOME IN</span>
                <span>{game.missed} guests found a full house</span>
              </div>
            </div>
            <div className="service-bar">
              <div>
                <strong>
                  {ready
                    ? `${ready} meal${ready > 1 ? "s" : ""} ready to go`
                    : "A little patience. A lovely meal."}
                </strong>
                <p>
                  {ready
                    ? "Give your guests something to smile about."
                    : "Your chef is taking care of the orders."}
                </p>
              </div>
              <button
                className="primary"
                disabled={!ready || game.paused}
                onClick={() => act({ type: "serve" })}
              >
                Serve a meal <span>↗</span>
              </button>
            </div>
          </section>
          <aside className="management">
            <div className="tabs" role="tablist" aria-label="Manage restaurant">
              {["Grow", "Team", "Menu"].map((t) => (
                <button
                  key={t}
                  id={`tab-${t}`}
                  role="tab"
                  aria-selected={tab === t}
                  aria-controls="management-panel"
                  onClick={() => setTab(t)}
                >
                  {t}
                </button>
              ))}
            </div>
            <div
              className="tab-content"
              id="management-panel"
              role="tabpanel"
              aria-labelledby={`tab-${tab}`}
            >
              {tab === "Grow" && (
                <>
                  <span className="eyebrow">SMALL STEPS, BIG DREAMS</span>
                  <h2>Make room for more.</h2>
                  <p>Build a little bigger. Get a little busier.</p>
                  <div className="upgrade">
                    <span className="upgrade-icon">🪑</span>
                    <h3>One more seat</h3>
                    <p>
                      Welcome another guest at a time.
                      <br />
                      {game.seats.length} of 8 seats placed.
                    </p>
                    <button
                      disabled={
                        game.seats.length === 8 || game.cash < seatPrice(game)
                      }
                      onClick={() => act({ type: "seat" })}
                    >
                      {game.seats.length === 8
                        ? "Dining room complete"
                        : `Add a seat · ${money(seatPrice(game))}`}
                    </button>
                  </div>
                  <div className="upgrade">
                    <span className="upgrade-icon">📣</span>
                    <h3>Spread the word</h3>
                    <p>
                      Bring more neighbors through the door. Popularity{" "}
                      {game.popularity} of 5.
                    </p>
                    <button
                      disabled={
                        game.popularity === 5 ||
                        game.cash < publicityPrice(game)
                      }
                      onClick={() => act({ type: "publicity" })}
                    >
                      {game.popularity === 5
                        ? "The talk of the town"
                        : `Buy publicity · ${money(publicityPrice(game))}`}
                    </button>
                  </div>
                  <small>
                    Prices include everything. No running costs for seats or
                    publicity.
                  </small>
                </>
              )}
              {tab === "Team" && (
                <>
                  <span className="eyebrow">MANY HANDS, HAPPY GUESTS</span>
                  <h2>Your kitchen crew.</h2>
                  <p>You cook for free. Add one chef and up to two waiters.</p>
                  <div className="payroll">
                    Wages <strong>{money(wages)} / game minute</strong>
                    <small>Next payday in {Math.ceil(game.payroll)}s</small>
                  </div>
                  {candidates.map((person) => {
                    const hired = game.staff.includes(person.id);
                    const full =
                      person.role === "chef" &&
                      game.staff.some(
                        (id) =>
                          candidates.find((s) => s.id === id)?.role === "chef",
                      );
                    return (
                      <div className="staff-card" key={person.id}>
                        <div className="staff-heading">
                          <span aria-hidden="true">
                            {person.role === "chef" ? "👩‍🍳" : "🧑‍💼"}
                          </span>
                          <div>
                            <h3>{person.name}</h3>
                            <small>
                              {person.role === "chef" ? "Chef" : "Waiter"} ·{" "}
                              {person.speed}s /{" "}
                              {person.role === "chef" ? "soup" : "meal"}
                            </small>
                          </div>
                        </div>
                        <p>{money(person.wage)} per game minute</p>
                        <button
                          disabled={
                            !hired && (!!full || game.cash < person.price)
                          }
                          onClick={() =>
                            act({
                              type: hired ? "fire" : "hire",
                              id: person.id,
                            })
                          }
                        >
                          {hired
                            ? `Let ${person.name.split(" ")[0]} go`
                            : full
                              ? "Chef position filled"
                              : `Hire ${person.name.split(" ")[0]} · ${money(person.price)}`}
                        </button>
                      </div>
                    );
                  })}
                </>
              )}
              {tab === "Menu" && (
                <>
                  <span className="eyebrow">FRESH FROM YOUR KITCHEN</span>
                  <h2>Today’s good thing.</h2>
                  <p>
                    Choose a dish for new arrivals. Existing orders stay the
                    same.
                  </p>
                  {dishes.map((dish, i) => (
                    <div className="dish-card" key={dish.name}>
                      <span className="dish-icon" aria-hidden="true">
                        {dish.icon}
                      </span>
                      <div>
                        <h3>{dish.name}</h3>
                        <p>
                          {money(dish.price)} per meal · {6 * dish.time}s with
                          owner
                        </p>
                        <button
                          aria-pressed={game.dish === i}
                          disabled={
                            game.served < dish.unlock || game.dish === i
                          }
                          onClick={() => act({ type: "dish", dish: i })}
                        >
                          {game.served < dish.unlock
                            ? `Unlock at ${dish.unlock} happy guests`
                            : game.dish === i
                              ? "On the menu ✓"
                              : "Put on the menu"}
                        </button>
                      </div>
                    </div>
                  ))}
                  <small>
                    Meal earnings are net of ingredients. Slower dishes earn
                    more per guest.
                  </small>
                </>
              )}
            </div>
          </aside>
        </div>
        <div className="bottom-row">
          <section className="goal">
            <span className="goal-icon">✦</span>
            <div>
              <span className="eyebrow">
                {goal ? "YOUR NEXT CHAPTER" : "LOOK WHAT YOU BUILT"}
              </span>
              <h3>{goal?.title || "A neighborhood institution"}</h3>
              <p>
                {goal?.detail ||
                  "Every milestone complete. Keep the good food coming!"}
              </p>
              {goal && (
                <progress
                  aria-label={goal.title}
                  value={goal.value}
                  max={goal.max}
                />
              )}
            </div>
            <strong>
              {goal ? `${Math.min(goal.value, goal.max)} / ${goal.max}` : "✓"}
            </strong>
          </section>
          <section className="activity">
            <h3>
              From the floor <span>LIVE NOTES</span>
            </h3>
            <ul>
              {game.log.slice(0, 3).map((line, i) => (
                <li key={`${i}-${line}`}>{line}</li>
              ))}
            </ul>
          </section>
        </div>
        <footer>
          Made with a little love.
          <span>
            {money(game.earned)} earned all time · Progress saves every 2
            seconds
          </span>
        </footer>
      </main>
    </div>
  );
}
ReactDOM.render(<App />, document.getElementById("root"));
