import { Exome } from 'exome';
import { parseFloorPlan, TileType } from '../components/scene/scene';

import { ChefStore } from './chef.store';
import { ClientStore } from './client.store';
import { ReceptionStore } from './reception.store';
import { SeatStore } from './seat.store';
import { WaiterStore } from './waiter.store';

export class RestaurantStore extends Exome {
  public money = 0;
  public seats: SeatStore[] = [
    new SeatStore(this),
    // new SeatStore(this),
  ];
  public popularity = 1;

  public maxChefs: number;
  public maxWaiters: number;
  public maxSeats: number;
  public maxReception: number;

  public floorPlan: TileType[][];

  public log: string[] = [];

  public chefs: ChefStore[] = [];
  public cookQueue: SeatStore[] = [];

  public waiters: WaiterStore[] = [];
  public serveQueue: (SeatStore | null)[] = [];

  public clients: ClientStore[] = [];
  public reception: ReceptionStore[] = [];

  constructor(
    public name: string,
    public owner: string = 'John Doe',
  ) {
    super();

    const layoutPlan = parseFloorPlan(`
xxxxxxxxxxxx
x..........x
x...T..T...x
x..........xxxxx
x...T..T..W_...x
[.R........_.C.x
].R........_.C.x
x...T..T..W_...x
x..........xxxxx
x...T..T...x
x..........x
xxxxxxxxxxxx
`);

    this.floorPlan = layoutPlan.floor;
    this.serveQueue = new Array(layoutPlan.counterSpaces).fill(null);
    this.maxChefs = layoutPlan.chefSpaces;
    this.maxWaiters = layoutPlan.waiterSpaces;
    this.maxSeats = layoutPlan.seatSpaces;
    this.maxReception = layoutPlan.receptionSpaces;

    this.reception = new Array(this.maxReception)
      .fill(null)
      .map(() => new ReceptionStore(this));

    this.hireChef(new ChefStore(owner, 1000));
    // this.hireWaiter(new WaiterStore('Jane', 1000));
  }

  public forceReload() {}

  public income(amount: number): boolean {
    this.addLog(`🤑 Income: +${amount / 100}`);
    this.money += amount;

    return true;
  }

  public cost(amount: number): boolean {
    if (this.money - amount < 0) {
      return false;
    }

    this.addLog(`💸 Cost: -${amount / 100}`);
    this.money -= amount;

    return true;
  }

  public hireChef(chef: ChefStore) {
    if (this.maxChefs <= this.chefs.length) {
      this.addLog(`🚨 Reached maximum of ${this.maxChefs} chefs`);
      return;
    }

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
    if (this.maxWaiters <= this.waiters.length) {
      this.addLog(`🚨 Reached maximum of ${this.maxWaiters} waiters`);
      return;
    }

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
    if (this.maxSeats <= this.seats.length) {
      this.addLog(`🚨 Reached maximum of ${this.maxSeats} seats`);
      return;
    }

    const price = this.getSeatsPrice(size);

    this.cost(price);

    this.seats.push(new SeatStore(this));
  }

  public orderFood(seat: SeatStore) {
    this.cookQueue.push(seat);
  }

  public addLog = (message: string) => {
    this.log.push(message);

    if (this.log.length > 10) {
      this.log.shift();
    }
  }
}
