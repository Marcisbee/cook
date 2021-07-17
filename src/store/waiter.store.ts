import { Exome, getExomeId } from 'exome';

import { RestaurantStore } from './restaurant.store';

export class WaiterStore extends Exome {
  public restaurant: RestaurantStore | null = null;

  public foodIntervalHolder: Record<string, any> = {};
  public costIntervalHolder: Record<string, any> = {};

  private isBusy = false;

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

    this.restaurant = null;

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

      if (restaurant.serveQueue.length > 0) {
        const food = restaurant.serveQueue.shift()!;

        this.wait(food);
      }
    }, 1000);

    if (this.costAmount) {
      this.costIntervalHolder[id] = setInterval(() => {
        restaurant.cost(this.costAmount);
      }, this.costInterval);
    }

    if (this.costInitial) {
      restaurant.cost(this.costInitial);
    }
  }

  public async wait(serve: (price: number) => void) {
    this.isBusy = true;

    this.restaurant?.addLog(`🧍 "${this.name}" is serving for ${this.speed / 1000}s`);
    this.restaurant?.forceReload();

    await new Promise((resolve) => setTimeout(resolve, this.speed));

    serve(100);

    this.isBusy = false;
  }
}

const chefSpeedyGonzales = new WaiterStore(
  'Speedy Gonzales',
  3000,
  500,
  2000,
  30000,
);

export const allWaiters = [
  chefSpeedyGonzales,
];
