import { Exome, getExomeId, onAction } from 'exome';
import { ChefStore } from './chef.store';

import { RestaurantStore } from './restaurant.store';
import { SeatStore } from './seat.store';

export class WaiterStore extends Exome {
  public restaurant: RestaurantStore | null = null;

  public foodIntervalHolder: Record<string, () => void> = {};
  public costIntervalHolder: Record<string, () => void> = {};

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

    this.foodIntervalHolder[id]?.();
    this.costIntervalHolder[id]?.();
  }

  public hire(restaurant: RestaurantStore) {
    const id = getExomeId(restaurant);

    this.restaurant = restaurant;

    this.foodIntervalHolder[id]?.();
    this.costIntervalHolder[id]?.();

    this.foodIntervalHolder[id] = onAction(ChefStore, 'cook', () => {
      if (!this.restaurant) {
        return;
      }

      this.checkIfNeedsServing();
    });

    if (this.costAmount) {
      const target = setInterval(() => {
        const paid = restaurant.cost(this.costAmount);

        if (!paid) {
          this.restaurant?.addLog(`Waiter ${this.name} left, because salary can't be paid.`);
          this.restaurant?.fireWaiter(this);
        }
      }, this.costInterval);
      this.costIntervalHolder[id] = () => clearInterval(target);
    }

    if (this.costInitial) {
      restaurant.cost(this.costInitial);
    }
  }

  public checkIfNeedsServing() {
    if (this.isBusy) {
      return;
    }

    const food = this.restaurant?.serveQueue.findIndex((q) => !!q);

    if (food! > -1) {
      const [seat] = this.restaurant?.serveQueue.splice(food!, 1, null)!;

      this.serve(seat!);
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

    this.checkIfNeedsServing();
  }
}

const waiterLunaLindrome = new WaiterStore(
  'Luna Lindrome',
  1500,
  500,
  500,
  30000,
);

const waiterSpeedyGonzales = new WaiterStore(
  'Speedy Gonzales',
  1000,
  1000,
  500,
  50000,
);

export const allWaiters = [
  waiterLunaLindrome,
  waiterSpeedyGonzales,
];
