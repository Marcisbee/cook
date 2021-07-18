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
  ) {
    super();

    this.refreshIncomingGuests();
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

  private async refreshIncomingGuests() {
    this.setGuest({
      name: 'Jane',
      speed: 1000,
    });
    this.setStatus('entering');

    // Client walks through door
    await new Promise((resolve) => setTimeout(resolve, this.guest!.speed));

    // Looking for table
    await new Promise((resolve) => setTimeout(resolve, 500));

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
        (2000 * (Math.random() * 4)),
      );

      return;
    }

    const client = new ClientStore(this.guest!.speed);

    this.setGuest(null);

    await emptySeat.seatClient(client, this)

    setTimeout(
      this.refreshIncomingGuests,
      (2000 * (Math.random() * 4)),
    );
  }
}
