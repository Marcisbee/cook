import { Exome, addMiddleware } from 'exome';
import { exomeDevtools } from 'exome/devtools';

import { MainMenu } from '../scenes/main-menu';
import { Restaurant } from '../scenes/restaurant';

import { GameStore } from './game.store';

addMiddleware(exomeDevtools({ name: 'Cooker Game' }));

export const scenes = {
  MainMenu,
  Restaurant,
}

class Store extends Exome {
  public game?: GameStore;
  public scene: keyof typeof scenes = 'MainMenu';

  public setScene(scene: keyof typeof scenes) {
    this.scene = scene;
  }

  public startGame() {
    this.game = new GameStore();
    this.scene = 'Restaurant';
  }
}

export const store = new Store();
