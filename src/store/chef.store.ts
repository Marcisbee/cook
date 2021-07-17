import { Exome, getExomeId } from 'exome';

import { RestaurantStore } from './restaurant.store';

export class ChefStore extends Exome {
  public incomeIntervalHolder: Record<string, any> = {};
  public costIntervalHolder: Record<string, any> = {};

  constructor(
    public name: string,
    public incomeAmount: number,
    public incomeInterval: number,
    public costInitial: number = 0,
    public costAmount: number = 0,
    public costInterval: number = 0,
  ) {
    super();
  }

  public fire(restaurant: RestaurantStore) {
    const id = getExomeId(restaurant);

    clearInterval(this.incomeIntervalHolder[id]);
    clearInterval(this.costIntervalHolder[id]);
  }

  public hire(restaurant: RestaurantStore) {
    const id = getExomeId(restaurant);

    clearInterval(this.incomeIntervalHolder[id]);
    clearInterval(this.costIntervalHolder[id]);

    this.incomeIntervalHolder[id] = setInterval(() => {
      restaurant.income(this.incomeAmount);
    }, this.incomeInterval);

    if (this.costAmount) {
      this.costIntervalHolder[id] = setInterval(() => {
        restaurant.cost(this.costAmount);
      }, this.costInterval);
    }

    if (this.costInitial) {
      restaurant.cost(this.costInitial);
    }
  }
}

const chefRodrigoSanchez = new ChefStore(
  'Rodrigo Sánchez',
  50,
  1000,
  500,
  2000,
  30000,
);

const chefFernandoGusto = new ChefStore(
  'Fernando Gusto',
  50,
  1000,
  500,
  2000,
  55000,
);

const chefJohnWick = new ChefStore(
  'John Wick',
  200,
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
