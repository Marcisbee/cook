import { Exome, getExomeId } from 'exome';

import { RestaurantStore } from './restaurant.store';
import { SeatStore } from './seat.store';

export class WaiterStore extends Exome {
  public restaurant: RestaurantStore | null = null;

  public foodIntervalHolder: Record<string, any> = {};
  public costIntervalHolder: Record<string, any> = {};

  public isBusy = false;
  public serving: SeatStore | null = null;
  public served: SeatStore | null = null;

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

    clearInterval(this.foodIntervalHolder[id]);
    clearInterval(this.costIntervalHolder[id]);
  }

  public hire(restaurant: RestaurantStore) {
    const id = getExomeId(restaurant);

    this.restaurant = restaurant;

    clearInterval(this.foodIntervalHolder[id]);
    clearInterval(this.costIntervalHolder[id]);

    this.foodIntervalHolder[id] = setInterval(() => {
      if (this.isBusy) {
        return;
      }

      const food = restaurant.serveQueue.findIndex((q) => !!q);

      if (food > -1) {
        const [seat] = restaurant.serveQueue.splice(food, 1, null);

        this.serve(seat!);
      }
    }, 1000);

    if (this.costAmount) {
      this.costIntervalHolder[id] = setInterval(() => {
        const paid = restaurant.cost(this.costAmount);

        if (!paid) {
          this.restaurant?.addLog(`Chef ${this.name} left, because salary can't be paid.`);
          this.restaurant?.fireWaiter(this);
        }
      }, this.costInterval);
    }

    if (this.costInitial) {
      restaurant.cost(this.costInitial);
    }
  }

  public async serve(seat: SeatStore) {
    this.serving = seat;
    this.isBusy = true;

    this.restaurant?.forceReload();

    await seat.serve(new Promise((resolve) => setTimeout(resolve, this.speed)));

    this.serving = null;
    this.served = seat;

    this.returnFromTable();
  }

  private async returnFromTable() {
    await new Promise((resolve) => setTimeout(resolve, this.speed));

    this.isBusy = false;
    this.served = null;
  }
}

const chefSpeedyGonzales = new WaiterStore(
  'Speedy Gonzales',
  1000,
  500,
  500,
  50000,
);

export const allWaiters = [
  chefSpeedyGonzales,
];
