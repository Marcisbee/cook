import { Exome, getExomeId } from 'exome';

import { RestaurantStore } from './restaurant.store';

export class ChefStore extends Exome {
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

      if (restaurant.foodQueue.length > 0) {
        const food = restaurant.foodQueue.shift()!;

        this.cook(food);
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

  private async cook(food: () => (price: number) => void) {
    this.isBusy = true;

    this.restaurant?.addLog(`👨🏻‍🍳 "${this.name}" is cooking for ${this.speed / 1000}s`);
    this.restaurant?.forceReload();

    const serve = food();

    await new Promise((resolve) => setTimeout(resolve, this.speed));

    serve(100);

    console.log('finished cooking')
    this.isBusy = false;
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
