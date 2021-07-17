import { Exome } from 'exome';

import { RestaurantStore } from './restaurant.store';

export class GameStore extends Exome {
  public restaurants = [
    new RestaurantStore(),
  ];

  public get totalMoney(): number {
    return this.restaurants?.reduce((total, restaurant) => total + restaurant.money, 0);
  }
}
