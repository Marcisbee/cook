import { getExomeId } from 'exome';
import { useStore } from 'exome/react';
import React from 'react';
import { RestaurantStore } from '../../store/restaurant.store';

// import { Client } from '../client/client';
import { Grid } from '../grid/grid';
import { Row } from '../row/row';
import { Tile, TileChef, TileCounter, TileSeat, TileWaiter } from '../tile/tile';

import styles from './scene.module.scss';

export type TileType =
  | 'outerWall'
  | 'innerWall'

  | 'counter'

  | 'floor'

  | 'leftDoor'
  | 'rightDoor'

  | 'chef'

  | 'waiter'

  | 'table'

  | 'reception'

  | null;

export function parseFloorPlan(floorPlan: string): { floor: TileType[][], counterSpaces: number } {
  let counterSpaces = 0;
  const floor = floorPlan
    .split(/\n/)
    .slice(1, -1)
    .map((row) => (
      row
        .split('')
        .map<TileType>((t) => {
          switch (t) {
            case 'x':
              return 'outerWall';

            case '-':
              return 'innerWall';

            case '.':
              return 'floor';

            case '_':
              counterSpaces += 1;
              return 'counter';

            case '[':
              return 'leftDoor';

            case ']':
              return 'rightDoor';

            case 'C':
              return 'chef';

            case 'W':
              return 'waiter';

            case 'T':
              return 'table';

            case 'R':
              return 'reception';

            default:
              return null;
          }
        })
    ));

  return {
    floor,
    counterSpaces,
  };
}

interface SceneProps {
  restaurant: RestaurantStore;
}

export function Scene({ restaurant }: SceneProps) {
  const {
    floorPlan,
    chefs,
    waiters,
    seats,
    serveQueue,
  } = useStore(restaurant);

  const availableChefs = chefs.slice();
  const availableWaiters = waiters.slice();
  const availableSeats = seats.slice();
  const availableForServing = serveQueue.slice();

  return (
    <div className={styles.scene}>
      <Grid>
        {floorPlan.map((tiles, rIndex) => (
          <Row key={rIndex}>
            {tiles.map((type, tIndex) => {
              if (type === 'chef' && availableChefs.length > 0) {
                const chef = availableChefs.shift()!;

                return (
                  <TileChef
                    key={getExomeId(chef)}
                    chef={chef}
                  />
                );
              }

              if (type === 'waiter' && availableWaiters.length > 0) {
                const waiter = availableWaiters.shift()!;

                return (
                  <TileWaiter
                    key={getExomeId(waiter)}
                    waiter={waiter}
                  />
                );
              }

              if (type === 'table' && availableSeats.length > 0) {
                const seat = availableSeats.shift()!;

                return (
                  <TileSeat
                    key={getExomeId(seat)}
                    seat={seat}
                  />
                );
              }

              if (type === 'counter') {
                const seat = availableForServing.shift();

                if (!seat) {
                  return (
                    <Tile
                      key={tIndex}
                      type={type}
                    />
                  );
                }

                return (
                  <TileCounter
                    key={'counter-' + getExomeId(seat)}
                    seat={seat}
                  />
                );
              }

              return (
                <Tile
                  key={tIndex}
                  type={type}
                />
              );
            })}
          </Row>
        ))}
      </Grid>
    </div>
  );
}
