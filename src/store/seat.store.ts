import { Exome } from 'exome';
import { ChefStore } from './chef.store';

import { ClientStore } from './client.store';
import { ReceptionStore } from './reception.store';
import { RestaurantStore } from './restaurant.store';
import { WaiterStore } from './waiter.store';

export class SeatStore extends Exome {
  public client: ClientStore | null = null;
  public reception: ReceptionStore | null = null;
  public status: 'serving' | 'waiting' | 'walking' | 'ordered' | 'cooking' | 'eating' | null = null;

  public chef?: ChefStore;
  public waiter?: WaiterStore;

  constructor(public restaurant: RestaurantStore) {
    super();
  }

  public async seatClient(client: ClientStore, reception: ReceptionStore) {
    this.client = client;
    this.reception = reception;
    this.setStatus('walking');

    await new Promise((resolve) => setTimeout(resolve, client.walkingSpeed));

    this.restaurant.orderFood(this);
    this.setStatus('ordered');
  }

  public async cook(task: Promise<void>) {
    this.setStatus('cooking');

    await task;

    this.setStatus('waiting');
  }

  public async serve(task: Promise<void>) {
    this.setStatus('serving');

    await task;

    this.eat();
  }

  public async eat() {
    this.setStatus('eating');

    await new Promise((resolve) => setTimeout(resolve, this.client!.eatingSpeed));

    this.setStatus(null);

    this.client = null;
    this.reception = null;
    this.restaurant.income(100);
  }

  private setStatus(status: 'serving' | 'waiting' | 'walking' | 'ordered' | 'cooking' | 'eating' | null) {
    this.status = status;
  }
}
