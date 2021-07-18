import { useStore } from 'exome/react';
import React from 'react';

import { store } from '../store/store';
import { parseFloorPlan, Scene } from '../components/scene/scene';

export function MainMenu() {
  const { startGame } = useStore(store);

  return (
    <div>
      <h1>👨🏻‍🍳 Cooker game</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();

          const restaurant = (e.target as any).restaurant.value;
          const owner = (e.target as any).owner.value;

          startGame(restaurant, owner);
        }}
      >
        <label>
          <strong>Restaurant name:</strong>
          <br />
          <input type="text" name="restaurant" defaultValue="Black Oasis" />
        </label>

        <br />
        <br />

        <label>
          <strong>Owner name:</strong>
          <br />
          <input type="text" name="owner" defaultValue="John Cook" />
        </label>

        <br />
        <br />

        <button type="submit">
          Play
        </button>
      </form>
    </div>
  );
}
