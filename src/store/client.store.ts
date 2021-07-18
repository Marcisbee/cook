import { Exome } from 'exome';

export class ClientStore extends Exome {
  constructor(
    public walkingSpeed = 1000,
    public eatingSpeed = 2000,
  ) {
    super();
  }
}
