import { getExomeId } from 'exome';
import { useStore } from 'exome/react';
import React from 'react';

import { ChefStore } from '../../store/chef.store';
import { ReceptionStore } from '../../store/reception.store';
import { SeatStore } from '../../store/seat.store';
import { WaiterStore } from '../../store/waiter.store';
import { useTransition } from '../../utils/use-transition';
import { Client } from '../client/client';
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

  if (type === 'reception') {
    return (
      <button
        className={styles.tile}
        style={{ backgroundColor: '#ccc' }}
      />
    )
  }

  if (type === 'leftDoor') {
    return (
      <button
        id="leftDoor"
        className={styles.tile}
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

export function TileReception({ reception }: { reception: ReceptionStore }) {
  const { guest, status } = useStore(reception);
  const [walkTransitionRef, walkTransition] = useTransition(guest?.speed || 0);

  React.useLayoutEffect(() => {
    if (status === 'entering') {
      const receptionElement = document.getElementById('leftDoor')!;

      walkTransition(receptionElement, true);
    }

    if (status === 'leaving') {
      const receptionElement = document.getElementById('leftDoor')!;

      walkTransition(receptionElement, false);
    }
  }, [status]);

  return (
    <button
      id={`reception-${getExomeId(reception)}`}
      className={styles.tile}
    >
      <GameObject>
        <span
          ref={walkTransitionRef}
          style={{ position: 'absolute' }}
        >
          {guest && (<Client />)}
        </span>
        <span style={{ color: 'transparent' }}>{`_`}</span>
      </GameObject>
    </button>
  );
}

export function TileWaiter({ waiter }: { waiter: WaiterStore }) {
  const { name, isBusy, speed, served, serving } = useStore(waiter);
  const [serveTransitionRef, serveTransition] = useTransition(speed);

  React.useLayoutEffect(() => {
    if (serving && isBusy) {
      const seatElement = document.getElementById('seat-' + getExomeId(serving))!;

      serveTransition(seatElement);
    }

    if (served && isBusy) {
      const seatElement = document.getElementById('seat-' + getExomeId(served))!;

      setTimeout(() => {
        serveTransition(seatElement, true);
      }, 10);
    }
  }, [serving, served, isBusy]);

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
        <span style={{ color: 'transparent' }}>{`_`}</span>
      </GameObject>
    </button>
  );
}

export function TileSeat({ seat }: { seat: SeatStore }) {
  const { client, status, reception } = useStore(seat);
  const [walkTransitionRef, walkTransition] = useTransition(client?.walkingSpeed || 0);

  React.useLayoutEffect(() => {
    if (status === 'walking') {
      const receptionElement = document.getElementById('reception-' + getExomeId(reception!))!;
      walkTransition(receptionElement, true);
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
            <>
              <span style={{ position: 'absolute' }}>
                <Client />
              </span>

              {status === 'eating' ? (
                <>
                  <span style={{ position: 'absolute' }}>🍲</span>
                </>
              ) : (
                status === 'ordered' ? (
                  <>
                    <span style={{ position: 'absolute', fontSize: 20, marginLeft: 10, marginTop: -28 }}>🔖</span>
                  </>
                ) : (
                  (status === 'waiting' || status === 'cooking' || status === 'serving') && (
                    <>
                      <span style={{ position: 'absolute', fontSize: 20, marginLeft: 10, marginTop: -28 }}>⏳</span>
                    </>
                  )
                )
              )}
            </>
          )}
        </span>
        🪑
      </GameObject>
    </button>
  );
}
