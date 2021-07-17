import { getExomeId } from 'exome';
import { useStore } from 'exome/react';
import React from 'react';

import { allChefs } from '../store/chef.store';
import { SeatStore } from '../store/seat.store';
import { store } from '../store/store';

function formatMoney(amountInCents: number) {
  return `€${(amountInCents / 100).toFixed(2)}`;
}

function Seat({ seat }: { seat: SeatStore }) {
  const { client, status } = useStore(seat);

  return (
    <div>
      {!client && <span>🪑 Seat is empty</span>}

      {client && (
        <div>
          {status === 'walking' && <span>🚶 {status}</span>}
          {status === 'waiting' && <span>🧍 {status}</span>}
          {status === 'cooking' && <span>👨🏻‍🍳 {status}</span>}
          {status === 'eating' && <span>🍜 {status}</span>}
        </div>
      )}
    </div>
  );
}


export function Restaurant() {
  const [active, setActive] = React.useState(0);
  const { restaurants, totalMoney } = useStore(store.game!);
  const {
    name,
    money,

    seats,
    getSeatsPrice,
    buySeats,

    chefs,
    hireChef,
    fireChef,

    log
  } = useStore(restaurants[active]);

  return (
    <div>
      <div style={{ width: '70%' }}>
        Your restaurants:
        <ul>
          {restaurants.map((restaurant, index) => (
            <li key={index}>
              <button onClick={() => setActive(index)}>Restaurant "{restaurant.name}" {formatMoney(restaurant.money)}</button>
            </li>
          ))}
        </ul>

        <hr />

        Total money in bank: {formatMoney(totalMoney)}

        <hr />

        <h1>Restaurant "{name}" {formatMoney(money)}</h1>

        Seats: {seats.length}
        <br />
        <ul>
          {seats.map((seat) => (
            <li key={getExomeId(seat)}>
              <Seat seat={seat} />
            </li>
          ))}
        </ul>

        <br />
        <br />

        Buy more seats:
        <ul>
          <li>
            1 seat (+ 1 client)
            {` `}
            <button
              onClick={() => {
                buySeats(1);
              }}
              disabled={getSeatsPrice(1) > totalMoney}
            >
              Buy ({formatMoney(getSeatsPrice(1))})
            </button>
          </li>
        </ul>

        <br />
        <br />
        <hr />

        Your chefs:
        <ul>
          {chefs.map((chef, index) => (
            <li key={index}>
              👨🏻‍🍳 Chef "{chef.name}" ({chef.speed / 1000}s per food)
              {` `}
              {index !== 0 && (
                <button onClick={() => fireChef(chef)}>
                  Fire
                </button>
              )}
            </li>
          ))}
        </ul>

        Hire chefs:
        <ul>
          {allChefs.filter((chef) => chefs.indexOf(chef) === -1).map((chef, index) => (
            <li key={index}>
              👨🏻‍🍳 Chef "{chef.name}"
              ({chef.speed / 1000}s per food)
              (salary {formatMoney(chef.costAmount)} / {chef.costInterval / 1000}s)
              {` `}
              <button
                onClick={() => {
                  hireChef(chef);
                }}
                disabled={chef.costInitial > money}
              >
                Hire ({formatMoney(chef.costInitial)})
              </button>
            </li>
          ))}
        </ul>

      </div>

      <div style={{ position: 'absolute', top: 0, right: 0, width: 200 }}>
        {log.map((entry, index) => (
          <div key={index} style={{ padding: '10px' }}>
            {entry}
          </div>
        ))}
      </div>
    </div>
  )
}
