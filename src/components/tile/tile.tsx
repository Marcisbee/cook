import { getExomeId } from 'exome';
import { useStore } from 'exome/react';
import React from 'react';

import { ChefStore } from '../../store/chef.store';
import { SeatStore } from '../../store/seat.store';
import { WaiterStore } from '../../store/waiter.store';
import { useTransition } from '../../utils/use-transition';
import { GameObject } from '../game-object/game-object';
import { TileType } from '../scene/scene';

import styles from './tile.module.scss';

interface TileProps {
  type: TileType;
}

export function Tile({ type }: TileProps) {
  if (type === null) {
    return null;
  }

  if (type === 'floor') {
    return (
      <button
        className={styles.tile}
      />
    )
  }

  if (type === 'outerWall') {
    return (
      <button
        className={styles.tile}
        style={{ backgroundColor: '#aaa' }}
      />
    )
  }

  if (type === 'innerWall') {
    return (
      <button
        className={styles.tile}
        style={{ backgroundColor: '#aaa' }}
      />
    )
  }

  if (type === 'counter') {
    return (
      <button
        className={styles.tile}
        style={{ backgroundColor: '#ccc' }}
      />
    )
  }

  // if (type === 'table') {
  //   return (
  //     <button className={styles.tile}>
  //       <GameObject>
  //         🪑
  //       </GameObject>
  //     </button>
  //   )
  // }

  // if (type === 'waiter') {
  //   return (
  //     <button className={styles.tile}>
  //       <GameObject>
  //         🧍
  //       </GameObject>
  //     </button>
  //   )
  // }

  return (
    <button className={styles.tile} />
  );
}

export function TileCounter({ seat }: { seat: SeatStore }) {
  const { restaurant } = useStore(seat);

  return (
    <button
      id={`counter-${getExomeId(seat)}`}
      className={`${styles.tile} ${styles.tileClick}`}
      onClick={async () => {
        const index = restaurant.serveQueue.indexOf(seat);
        const [foodForSeat] = restaurant.serveQueue.splice(index, 1, null);

        await foodForSeat!.serve(Promise.resolve());
        restaurant.forceReload();
      }}
    >
      <GameObject>
        🍲
      </GameObject>
    </button>
  );
}

export function TileChef({ chef }: { chef: ChefStore }) {
  const { name, isBusy } = useStore(chef);

  return (
    <button
      id={`chef-${getExomeId(chef)}`}
      title={name}
      className={styles.tile}
    >
      <GameObject>
        {!isBusy && '👨🏻‍🍳'}
        {isBusy && <><span style={{ position: 'absolute' }}>🥘</span>👨🏻‍🍳</>}
      </GameObject>
    </button>
  );
}

export function TileWaiter({ waiter }: { waiter: WaiterStore }) {
  const { name, isBusy, speed, serving } = useStore(waiter);
  const [serveTransitionRef, serveTransition] = useTransition(speed);

  React.useLayoutEffect(() => {
    if (serving) {
      const seatElement = document.getElementById('seat-' + getExomeId(serving))!;

      serveTransition(seatElement);
    }
  }, [serving]);

  return (
    <button
      id={`waiter-${getExomeId(waiter)}`}
      title={name}
      className={styles.tile}
    >
      <GameObject>
        <span
          ref={serveTransitionRef}
          style={{ position: 'absolute' }}
        >
          {serving && <span style={{ position: 'absolute' }}>🍲</span>}
          🧍
        </span>
        {`__`}
      </GameObject>
    </button>
  );
}

export function TileSeat({ seat }: { seat: SeatStore }) {
  const { client, status } = useStore(seat);
  const [walkTransitionRef, walkTransition] = useTransition(client?.walkingSpeed || 0);

  React.useLayoutEffect(() => {
    if (status === 'walking') {
      // walkTransition();
    }
  }, [status]);

  return (
    <button
      id={`seat-${getExomeId(seat)}`}
      className={styles.tile}
    >
      <GameObject>
        <span
          ref={walkTransitionRef}
          style={{ position: 'absolute' }}
        >
          {client && (
            status === 'eating' ? (
              <>
                <span style={{ position: 'absolute' }}>🧍‍♂️</span>
                <span style={{ position: 'absolute' }}>🍜</span>
              </>
            ) : (
              status === 'ordered' ? (
                <>
                  <span style={{ position: 'absolute' }}>🧍‍♂️</span>
                  <span style={{ position: 'absolute' }}>🔖</span>
                </>
              ) : (
                status === 'waiting' || status === 'cooking' || status === 'serving' ? (
                  <>
                    <span style={{ position: 'absolute' }}>🧍‍♂️</span>
                    <span style={{ position: 'absolute' }}>⏳</span>
                  </>
                ) : (
                  <>
                    <span style = {{ position: 'absolute' }}>🧍‍♂️</span>
                  </>
                )
              )
            )
          )}
        </span>
        🪑
        {/* {client && (
          <span>
            {status === 'walking' && <span>🚶</span>}
            {status === 'ordered' && <span>🔖</span>}
            {status === 'cooking' && <span>👨🏻‍🍳</span>}
            {status === 'waiting' && <span>⏳</span>}
            {status === 'serving' && <span>🍴</span>}
            {status === 'eating' && <span>🍖</span>}
          </span>
        )} */}
      </GameObject>
    </button>
  );
}
