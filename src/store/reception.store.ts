import { Exome } from 'exome';
import { ClientStore } from './client.store';

import { RestaurantStore } from './restaurant.store';

interface Guest {
  name: string;
  speed: number;
}

export class ReceptionStore extends Exome {
  public status: 'entering' | 'leaving' | null = null;
  public guest: Guest | null = null;

  constructor(
    public restaurant: RestaurantStore,
    delay: number = 0,
  ) {
    super();

    setTimeout(this.refreshIncomingGuests, delay);
  }

  private setGuest(guest: Guest | null) {
    this.guest = guest;

    if (!guest) {
      this.status = null;
    }
  }

  private setStatus(status: 'entering' | 'leaving' | null) {
    this.status = status;
  }

  private getTimeout(): number {
    return 6000 / (this.restaurant?.popularity || 1);
  }

  private async refreshIncomingGuests() {
    this.setGuest({
      name: 'Omar',
      speed: 1000,
    });
    this.setStatus('entering');

    // Client walks through door
    await new Promise((resolve) => setTimeout(resolve, this.guest!.speed));

    // Looking for table
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Client checks if there are any empty seats
    const emptySeat = this.restaurant.seats
      .find((seat) => seat.client === null);

    if (!emptySeat) {
      // Client leaves

      this.setStatus('leaving');
      await new Promise((resolve) => setTimeout(resolve, this.guest!.speed));

      this.setGuest(null);

      setTimeout(
        this.refreshIncomingGuests,
        this.getTimeout(),
      );

      return;
    }

    const client = new ClientStore(this.guest!.speed);

    this.setGuest(null);

    await emptySeat.seatClient(client, this)

    setTimeout(
      this.refreshIncomingGuests,
      this.getTimeout(),
    );
  }
}
