import { useStore } from 'exome/react';
import React from 'react';
import { allChefs } from '../store/chef.store';
import { store } from '../store/store';

function formatMoney(amountInCents: number) {
  return `€${(amountInCents / 100).toFixed(2)}`;
}

export function Restaurant() {
  const [active, setActive] = React.useState(0);
  const { restaurants, totalMoney } = useStore(store.game!);
  const {
    name,
    money,
    chefs,
    hireChef,
    fireChef,
    log
  } = useStore(restaurants[active]);

  return (
    <div>
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

      Your chefs:
      <ul>
        {chefs.map((chef, index) => (
          <li key={index}>
            👨🏻‍🍳 Chef "{chef.name}" (+{formatMoney(chef.incomeAmount)} / {chef.incomeInterval / 1000}s)
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
            (+{formatMoney(chef.incomeAmount)} / {chef.incomeInterval / 1000}s)
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
