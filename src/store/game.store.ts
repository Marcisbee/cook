import { Exome } from 'exome';

import { RestaurantStore } from './restaurant.store';

export class GameStore extends Exome {
  public restaurants: RestaurantStore[] = [];

  public get totalMoney(): number {
    return this.restaurants?.reduce((total, restaurant) => total + restaurant.money, 0);
  }

  constructor(
    name: string,
    public owner: string,
  ) {
    super();

    this.addRestaurant(new RestaurantStore(name, owner));
  }

  public addRestaurant(restaurant: RestaurantStore) {
    this.restaurants.push(restaurant);
  }
}
