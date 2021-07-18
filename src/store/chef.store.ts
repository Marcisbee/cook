import { Exome, getExomeId } from 'exome';

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

      if (restaurant.cookQueue.length > 0) {
        const seat = restaurant.cookQueue.shift()!;

        this.cook(seat);
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

  private async cook(seat: SeatStore) {
    this.isBusy = true;

    this.restaurant?.addLog(`👨🏻‍🍳 "${this.name}" is cooking for ${this.speed / 1000}s`);
    this.restaurant?.forceReload();

    await seat.cook(new Promise((resolve) => setTimeout(resolve, this.speed)));

    this.isBusy = false;

    this.restaurant?.serveQueue.push(seat);
  }
}

const chefRodrigoSanchez = new ChefStore(
  'Rodrigo Sánchez',
  3000,
  500,
  2000,
  30000,
);

const chefFernandoGusto = new ChefStore(
  'Fernando Gusto',
  2000,
  1000,
  2000,
  55000,
);

const chefJohnWick = new ChefStore(
  'John Wick',
  1000,
  2000,
  5000,
  30000,
);

export const allChefs = [
  chefRodrigoSanchez,
  chefFernandoGusto,
  chefJohnWick,
];
