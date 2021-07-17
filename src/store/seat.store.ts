import { Exome } from 'exome';

import { ClientStore } from './client.store';
import { RestaurantStore } from './restaurant.store';

export class SeatStore extends Exome {
  public client: ClientStore | null = null;
  public status: 'walking' | 'waiting' | 'cooking' | 'eating' | null = null;

  constructor(public restaurant: RestaurantStore) {
    super();
  }

  public async seatClient(client: ClientStore) {
    this.restaurant.addLog(`🪑 Client was seated`);
    this.client = client;
    this.setStatus('walking');

    await new Promise((resolve) => setTimeout(resolve, client.walkingSpeed));

    this.setStatus('waiting');

    const cooking = await this.restaurant.orderFood();
    this.setStatus('cooking');
    const receipt = await cooking();

    this.setStatus('eating');
    await new Promise((resolve) => setTimeout(resolve, client.eatingSpeed));
    this.setStatus(null);

    this.restaurant.income(receipt);
    this.client = null;
    this.restaurant.addLog(`🍜 Client left with full belly`);
  }

  private setStatus(status: 'walking' | 'waiting' | 'cooking' | 'eating' | null) {
    this.status = status;
  }
}
