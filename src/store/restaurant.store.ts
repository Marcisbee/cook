import { Exome } from 'exome';

import { ChefStore } from './chef.store';
import { ClientStore } from './client.store';
import { SeatStore } from './seat.store';
import { WaiterStore } from './waiter.store';

export class RestaurantStore extends Exome {
  public money = 0;
  public seats: SeatStore[] = [
    new SeatStore(this),
  ];
  public popularity = 1;

  public log: string[] = [];

  public chefs: ChefStore[] = [];
  public foodQueue: (() => (price: number) => void)[] = [];

  public waiters: WaiterStore[] = [];
  public serveQueue: ((price: number) => void)[] = [];

  public clients: any[] = [];

  constructor(
    public name: string,
    public owner: string = 'John Doe',
  ) {
    super();

    this.hireChef(new ChefStore(owner, 2000));
    this.hireWaiter(new WaiterStore('Jane', 2000));

    const clientsComingIn = () => {
      setTimeout(() => {
        this.welcomeClients(1);

        clientsComingIn();
      }, 3000 / this.seats.length);
    }

    clientsComingIn();
  }

  public forceReload() {}

  public income(amount: number) {
    this.addLog(`🤑 Income: +${amount / 100}`);
    return this.money += amount;
  }

  public cost(amount: number) {
    this.addLog(`💸 Cost: -${amount / 100}`);
    return this.money -= amount;
  }

  public hireChef(chef: ChefStore) {
    chef.hire(this);

    this.chefs.push(chef);
  }

  public fireChef(
    chef: ChefStore,
  ) {
    chef.fire(this);

    this.chefs.splice(this.chefs.indexOf(chef), 1);
  }

  public hireWaiter(waiter: WaiterStore) {
    waiter.hire(this);

    this.waiters.push(waiter);
  }

  public fireWaiter(
    waiter: WaiterStore,
  ) {
    waiter.fire(this);

    this.waiters.splice(this.waiters.indexOf(waiter), 1);
  }

  public getSeatsPrice = (size: number) => {
    return (this.seats.length + size) * 100;
  }

  public buySeats(size: number) {
    const price = this.getSeatsPrice(size);

    this.cost(price);

    this.seats.push(new SeatStore(this));
  }

  public welcomeClients(size: number) {
    this.addLog(`❓ New client comes in`);
    const emptySeats = this.seats.filter((seat) => seat.client === null);

    if (emptySeats.length < this.clients.length + size) {
      this.addLog('📛 Not enough seats, client leaves');
      return false;
    }

    const newClients = new Array(size)
      .fill(0)
      .map(() => new ClientStore());

    newClients.forEach((client) => {
      const emptySeat = emptySeats.find((seat) => seat.client === null);

      if (!emptySeat) {
        return;
      }

      emptySeat.seatClient(client)
    });

    return true;
  }

  public async orderFood(): Promise<() => Promise<number>> {
    return await new Promise((cooking) => {
      const fn: () => (price: number) => void = () => {
        let finalResolve: (price: number) => void;

        const finishOrder = new Promise<number>((resolve) => {
          finalResolve = resolve;
        });

        cooking(() => finishOrder);

        return finalResolve!;
      }

      this.foodQueue.push(fn);
    });
  }

  public addLog = (message: string) => {
    this.log.push(message);

    if (this.log.length > 10) {
      this.log.shift();
    }
  }
}
