import { useStore } from 'exome/react';
import React from 'react';
import { store } from '../store/store';

export function MainMenu() {
  const { startGame } = useStore(store);

  return (
    <div>
      <h1>👨🏻‍🍳 Cooker game</h1>

      <button onClick={startGame}>
        Play
      </button>
    </div>
  );
}
