import { Exome, getExomeId, onAction } from 'exome';

import { RestaurantStore } from './restaurant.store';
import { SeatStore } from './seat.store';

export class ChefStore extends Exome {
  public restaurant: RestaurantStore | null = null;

  public foodIntervalHolder: Record<string, any> = {};
  public costIntervalHolder: Record<string, any> = {};

  public isBusy = false;

  constructor(
    public name: string,
    public speed: number,
    public costInitial: number = 0,
    public costAmount: number = 0,
    public costInterval: number = 0,
  ) {
    super();
  }

  public fire(restaurant: RestaurantStore) {
    const id = getExomeId(restaurant);

    // this.restaurant = null;

    this.foodIntervalHolder[id]?.();
    this.costIntervalHolder[id]?.();
  }

  public hire(restaurant: RestaurantStore) {
    const id = getExomeId(restaurant);

    this.restaurant = restaurant;

    this.foodIntervalHolder[id]?.();
    this.costIntervalHolder[id]?.();

    this.foodIntervalHolder[id] = onAction(SeatStore, 'seatClient', () => {
      if (!this.restaurant) {
        return;
      }

      this.checkIfNeedsCooking();
    });

    if (this.costAmount) {
      const target = setInterval(() => {
        const paid = restaurant.cost(this.costAmount);

        if (!paid) {
          this.restaurant?.addLog(`Chef ${this.name} left, because salary can't be paid.`);
          this.restaurant?.fireChef(this);
        }
      }, this.costInterval);
      this.costIntervalHolder[id] = () => clearInterval(target);
    }

    if (this.costInitial) {
      restaurant.cost(this.costInitial);
    }
  }

  public checkIfNeedsCooking() {
    if (this.isBusy) {
      return;
    }

    if (this.restaurant!.serveQueue.indexOf(null) === -1) {
      return;
    }

    if (this.restaurant!.cookQueue.length > 0) {
      const seat = this.restaurant!.cookQueue.shift()!;

      this.cook(seat);
    }
  }

  public async cook(seat: SeatStore) {
    this.isBusy = true;

    this.restaurant?.forceReload();

    await seat.cook(new Promise((resolve) => setTimeout(resolve, this.speed)));

    this.isBusy = false;

    const index = this.restaurant?.serveQueue.indexOf(null)!;

    this.restaurant!.serveQueue[index] = seat;
    this.restaurant!.forceReload();

    this.checkIfNeedsCooking();
  }
}

const chefRodrigoSanchez = new ChefStore(
  'Rodrigo Sánchez',
  3000,
  500,
  2000,
  120000,
);

const chefFernandoGusto = new ChefStore(
  'Fernando Gusto',
  2000,
  1000,
  2000,
  120000,
);

const chefJohnWick = new ChefStore(
  'John Wick',
  1000,
  2000,
  5000,
  120000,
);

export const allChefs = [
  chefRodrigoSanchez,
  chefFernandoGusto,
  chefJohnWick,
];
