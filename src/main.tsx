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
import { RestaurantCanvas } from "./RestaurantCanvas";
import "./index.css";
const money = (n: number) =>
  `€${n.toLocaleString("en", { maximumFractionDigits: 0 })}`;
const labels = {
  arriving: "Walking to their seat",
  ordered: "Waiting for the kitchen",
  cooking: "Their meal is cooking",
  ready: "A hot meal is ready",
  serving: "Food is on the way",
  eating: "Enjoying their meal",
};
function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY),
      game = readSave(raw);
    return { game, error: !!raw && !game };
  } catch {
    return { game: null, error: true };
  }
}
function Icon({ name }: { name: string }) {
  const paths: Record<string, React.ReactNode> = {
    grow: <path d="M5 3v8m4-8v8M5 8h4m-2 3v10M16 3v18m0-18c6 3 5 9 0 9" />,
    team: (
      <>
        <circle cx="9" cy="7" r="3" />
        <path d="M3 21v-4a6 6 0 0 1 12 0v4M17 5a3 3 0 0 1 0 6m1 3a5 5 0 0 1 4 5v2" />
      </>
    ),
    menu: (
      <path d="M4 4h7a3 3 0 0 1 3 3v14a4 4 0 0 0-4-3H4zM14 7a3 3 0 0 1 3-3h4v14h-3a4 4 0 0 0-4 3" />
    ),
    bell: <path d="M3 17h18M5 17a7 7 0 0 1 14 0M2 21h20M12 10V7m-2 0h4" />,
    star: <path d="m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" />,
    coin: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M15 7h-4a4 4 0 0 0 0 10h4M7 10h7m-7 4h7" />
      </>
    ),
    heart: (
      <path d="M12 21S1 14 2 7c1-6 9-6 10 0 1-6 9-6 10 0 1 7-10 14-10 14z" />
    ),
  };
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] || paths.grow}
    </svg>
  );
}
function App() {
  const [initial] = useState(load);
  const [game, setGame] = useState<Game>(
    initial.game || newGame("Black Oasis", "John Cook"),
  );
  const [hasSave, setHasSave] = useState(!!initial.game),
    [started, setStarted] = useState(false),
    [reset, setReset] = useState(false);
  const [panel, setPanel] = useState<string | null>(null),
    [help, setHelp] = useState(false),
    [saveError, setSaveError] = useState(initial.error),
    [selected, setSelected] = useState<number | null>(null);
  const latest = useRef(game);
  latest.current = game;
  const act = (action: Action) => setGame((g) => update(g, action));
  useEffect(() => {
    if (!started) return;
    let last = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now(),
        seconds = (now - last) / 1000;
      last = now;
      if (!document.hidden) act({ type: "tick", seconds });
    }, 50);
    const save = () => {
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
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target instanceof HTMLButtonElement && e.code === "Space") ||
        !started
      )
        return;
      if (e.code === "Space") {
        e.preventDefault();
        act({ type: "serve" });
      }
      if (e.code === "KeyP") act({ type: "pause" });
      if (e.code === "Escape") {
        setPanel(null);
        setHelp(false);
        setSelected(null);
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [started]);
  function begin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setGame(newGame(String(data.get("restaurant")), String(data.get("owner"))));
    setStarted(true);
    setHasSave(true);
    setPanel(null);
    setSelected(null);
    setReset(false);
  }
  const ready = game.seats.filter((s) => s?.stage === "ready").length;
  const ownerAway =
    !!game.returning.player || game.seats.some((s) => s?.worker === "player");
  const wages = game.staff.reduce(
    (n, id) => n + candidates.find((s) => s.id === id)!.wage,
    0,
  );
  const goal =
    game.served < 15
      ? {
          title: "First impressions",
          detail: "Serve 15 guests to unlock house pasta",
          value: game.served,
          max: 15,
        }
      : game.served < 50
        ? {
            title: "A local favorite",
            detail: "Serve 50 guests to unlock the chef’s special",
            value: game.served,
            max: 50,
          }
        : game.seats.length < 8
          ? {
              title: "Room for everyone",
              detail: "Grow your restaurant to 8 seats",
              value: game.seats.length,
              max: 8,
            }
          : game.popularity < 5
            ? {
                title: "Talk of the town",
                detail: "Reach popularity level 5",
                value: game.popularity,
                max: 5,
              }
            : null;
  const chooseSeat = (seat: number) => {
    setSelected(seat);
    if (seat >= game.seats.length) setPanel("Grow");
    else if (game.seats[seat]?.stage === "ready" && !ownerAway)
      act({ type: "serve", seat });
  };
  return (
    <main className={`game-shell ${!started ? "title-screen" : ""}`}>
      <RestaurantCanvas
        game={started ? game : { ...game, paused: true }}
        panelOpen={!!panel && started}
        selected={selected}
        onSeat={started ? chooseSeat : () => {}}
      />
      {!started ? (
        <div className="title-overlay">
          <section className="title-card">
            <div className="title-kicker">
              <span>✦</span> A LITTLE RESTAURANT STORY
            </div>
            <h1>
              cook<span>.</span>
            </h1>
            <p className="title-description">
              Your kitchen. Your crew.
              <br />
              Your little corner of the world.
            </p>
            {hasSave && !reset ? (
              <div className="resume">
                <span className="eyebrow">YOUR RESTAURANT</span>
                <h2>{game.name}</h2>
                <p>
                  {game.served} happy guests · {money(game.cash)} in the till
                </p>
                <button className="primary" onClick={() => setStarted(true)}>
                  Continue your restaurant <span>→</span>
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
                    required
                    maxLength={40}
                    defaultValue="Black Oasis"
                    autoComplete="off"
                  />
                </label>
                <label>
                  Your name
                  <input
                    name="owner"
                    required
                    maxLength={30}
                    defaultValue="John Cook"
                    autoComplete="given-name"
                  />
                </label>
                <button className="primary" type="submit">
                  Open for business <span>→</span>
                </button>
                {hasSave && (
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
                : "A cozy little game. Saved right here in your browser."}
            </small>
          </section>
          <span className="title-version">COOK · RESTAURANT STORIES</span>
        </div>
      ) : (
        <>
          <header className="game-hud">
            <div className="restaurant-badge">
              <span className="badge-icon">
                <Icon name="grow" />
              </span>
              <div>
                <span className="eyebrow">
                  {game.paused ? "SERVICE PAUSED" : "OPEN FOR GOOD TIMES"}
                </span>
                <h1>{game.name}</h1>
              </div>
            </div>
            <div className="resources" aria-label="Restaurant statistics">
              <div className="resource coins" title="Money in the till">
                <Icon name="coin" />
                <strong data-testid="cash">{money(game.cash)}</strong>
              </div>
              <div className="resource" title="Happy guests">
                <Icon name="heart" />
                <strong data-testid="served">{game.served}</strong>
              </div>
              <div className="resource popularity" title="Popularity">
                <Icon name="star" />
                <strong>
                  {game.popularity}
                  <small>/5</small>
                </strong>
              </div>
            </div>
            <div className="session-controls">
              <button aria-label="How to play" onClick={() => setHelp(true)}>
                ?
              </button>
              <button
                aria-label="Change game speed"
                onClick={() => act({ type: "speed" })}
              >
                {game.speed}×
              </button>
              <button
                aria-label={game.paused ? "Resume service" : "Pause service"}
                onClick={() => act({ type: "pause" })}
              >
                {game.paused ? "▶" : "Ⅱ"}
              </button>
              <button
                aria-label="Menu"
                onClick={() => {
                  setStarted(false);
                  setReset(false);
                  setPanel(null);
                }}
              >
                ☰
              </button>
            </div>
          </header>
          {game.paused && (
            <div className="paused-banner" role="status">
              Service paused{" "}
              <button onClick={() => act({ type: "pause" })}>Resume →</button>
            </div>
          )}
          {saveError && (
            <div className="storage-warning" role="alert">
              Saving unavailable. Keep this tab open to keep your progress.
            </div>
          )}
          <div className="chapter">
            <span className="chapter-star">✦</span>
            <div>
              <span className="eyebrow">
                {goal ? "YOUR NEXT CHAPTER" : "LOOK WHAT YOU BUILT"}
              </span>
              <h2>{goal?.title || "A neighborhood institution"}</h2>
              <p>
                {goal?.detail ||
                  "All milestones complete. Keep the good food coming."}
              </p>
              {goal && (
                <div className="goal-progress">
                  <progress
                    aria-label={goal.title}
                    value={goal.value}
                    max={goal.max}
                  />
                  <span>
                    {goal.value}/{goal.max}
                  </span>
                </div>
              )}
            </div>
          </div>
          {selected !== null && (
            <div className="table-inspector" role="status">
              <div>
                <span className="eyebrow">
                  TABLE {String(selected + 1).padStart(2, "0")}
                </span>
                <strong>
                  {selected >= game.seats.length
                    ? "Room for a new table"
                    : game.seats[selected]
                      ? labels[game.seats[selected]!.stage]
                      : "Ready for the next guest"}
                </strong>
              </div>
              <button
                aria-label="Close table details"
                onClick={() => setSelected(null)}
              >
                ×
              </button>
            </div>
          )}
          <div className="floor-note">
            <span>●</span>
            {game.log[0]}
          </div>
          <nav className="game-toolbar" aria-label="Restaurant controls">
            <div className="management-buttons">
              {[
                ["Grow", "grow", "Build"],
                ["Team", "team", "Team"],
                ["Menu", "menu", "Menu"],
              ].map(([key, icon, label]) => (
                <button
                  key={key}
                  aria-label={
                    key === "Menu"
                      ? "Food menu"
                      : key === "Grow"
                        ? "Grow restaurant"
                        : "Manage team"
                  }
                  aria-expanded={panel === key}
                  className={panel === key ? "active" : ""}
                  onClick={() => setPanel(panel === key ? null : key)}
                >
                  <Icon name={icon} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
            <button
              aria-label="Serve a meal"
              className="serve-button"
              disabled={!ready || ownerAway || game.paused}
              onClick={() => act({ type: "serve" })}
            >
              <Icon name="bell" />
              <span>
                {ownerAway ? "Owner is serving" : "Serve a meal"}
                <small>
                  {ownerAway
                    ? "Back in a moment"
                    : ready
                      ? `${ready} ready at the pass`
                      : "Waiting for the kitchen"}
                </small>
              </span>
              <kbd>SPACE</kbd>
            </button>
          </nav>
          {panel && (
            <aside className="management-panel" aria-label="Manage restaurant">
              <div className="panel-title">
                <span className="eyebrow">MAKE IT YOURS</span>
                <button
                  aria-label="Close management"
                  onClick={() => setPanel(null)}
                >
                  ×
                </button>
              </div>
              <div
                className="tabs"
                role="tablist"
                aria-label="Manage restaurant"
              >
                {["Grow", "Team", "Menu"].map((t) => (
                  <button
                    role="tab"
                    aria-selected={panel === t}
                    aria-controls="management-panel"
                    id={`tab-${t}`}
                    key={t}
                    onClick={() => setPanel(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div
                className="panel-content"
                id="management-panel"
                role="tabpanel"
                aria-labelledby={`tab-${panel}`}
              >
                {panel === "Grow" && (
                  <>
                    <h2>A little room to grow.</h2>
                    <p>More seats. More neighbors. More stories.</p>
                    <article className="upgrade">
                      <div className="upgrade-symbol">▦</div>
                      <h3>Add a table & seat</h3>
                      <p>
                        Welcome another guest at a time.
                        <br />
                        {game.seats.length} of 8 tables placed.
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
                    </article>
                    <article className="upgrade">
                      <div className="upgrade-symbol">✦</div>
                      <h3>Spread the word</h3>
                      <p>
                        Bring more neighbors through the door.
                        <br />
                        Popularity {game.popularity} of 5.
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
                    </article>
                    <small>One-time purchases. No running costs.</small>
                  </>
                )}
                {panel === "Team" && (
                  <>
                    <h2>Meet your crew.</h2>
                    <p>
                      You cook for free. When you serve, cooking waits until you
                      return. Hire help to keep both moving.
                    </p>
                    <div className="payroll">
                      <span>Team wages</span>
                      <strong>{money(wages)} / game minute</strong>
                      <small>Next payday in {Math.ceil(game.payroll)}s</small>
                    </div>
                    {candidates.map((person) => {
                      const hired = game.staff.includes(person.id),
                        full =
                          person.role === "chef" &&
                          game.staff.some(
                            (id) =>
                              candidates.find((s) => s.id === id)?.role ===
                              "chef",
                          );
                      return (
                        <article className="staff-card" key={person.id}>
                          <div className="staff-heading">
                            <span className={`staff-portrait ${person.role}`}>
                              <Icon
                                name={person.role === "chef" ? "grow" : "bell"}
                              />
                            </span>
                            <div>
                              <h3>{person.name}</h3>
                              <small>
                                {person.role === "chef"
                                  ? `Chef · ${person.speed}s per soup`
                                  : "Waiter · automatic delivery"}
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
                        </article>
                      );
                    })}
                    <small>
                      One extra chef and two waiters fit in this kitchen. Staff
                      leave if their wages cannot be paid.
                    </small>
                  </>
                )}
                {panel === "Menu" && (
                  <>
                    <h2>On today’s menu.</h2>
                    <p>
                      New arrivals order your selected dish. Existing orders
                      stay the same.
                    </p>
                    {dishes.map((dish, i) => (
                      <article className="dish-card" key={dish.name}>
                        <span
                          className={`dish-illustration dish-${i}`}
                          aria-hidden="true"
                        >
                          <i />
                          <i />
                          <i />
                        </span>
                        <div>
                          <h3>{dish.name}</h3>
                          <p>
                            {money(dish.price)} per meal · {6 * dish.time}s to
                            cook
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
                      </article>
                    ))}
                    <small>
                      Meal earnings are net of ingredients. Slower dishes earn
                      more per guest.
                    </small>
                  </>
                )}
              </div>
            </aside>
          )}
          {help && (
            <div className="modal-scrim">
              <section
                className="help-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="help-title"
              >
                <button
                  className="close-help"
                  aria-label="Close guide"
                  onClick={() => setHelp(false)}
                  autoFocus
                >
                  ×
                </button>
                <span className="eyebrow">
                  WELCOME TO YOUR LITTLE RESTAURANT
                </span>
                <h2 id="help-title">
                  A good day starts
                  <br />
                  in the kitchen.
                </h2>
                <ol>
                  <li>
                    <strong>Let them settle in.</strong> Guests walk in and
                    order. You cook automatically.
                  </li>
                  <li>
                    <strong>Dinner is served.</strong> Tap a ready table or
                    press Serve a meal. Your owner walks the food over, then
                    returns to the stove.
                  </li>
                  <li>
                    <strong>Make yourself at home.</strong> Add seats, hire a
                    crew, and buy publicity. Waiters deliver meals
                    automatically.
                  </li>
                </ol>
                <p>
                  Drag to pan. Scroll or pinch to zoom. Space serves; P pauses.
                  Progress saves every 2 seconds. Hidden tabs rest without wages
                  or offline income.
                </p>
                <button className="primary" onClick={() => setHelp(false)}>
                  Let’s cook →
                </button>
              </section>
            </div>
          )}
        </>
      )}
    </main>
  );
}
ReactDOM.render(<App />, document.getElementById("root"));
