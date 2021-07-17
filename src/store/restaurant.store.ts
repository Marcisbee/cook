import { Exome } from 'exome';

import { ChefStore } from './chef.store';

export class RestaurantStore extends Exome {
  public money = 0;
  public seats = 1;

  public log: string[] = [];

  public chefs: ChefStore[] = [];

  constructor(
    public name: string,
    public owner: string = 'John Doe',
  ) {
    super();

    this.hireChef(new ChefStore(owner, 100, 1000));
  }

  public income(amount: number) {
    this.addLog(`Income: +${amount / 100}`);
    return this.money += amount;
  }

  public cost(amount: number) {
    this.addLog(`Cost: -${amount / 100}`);
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

  public addLog = (message: string) => {
    this.log.push(message);

    if (this.log.length > 10) {
      this.log.shift();
    }
  }
}
