import './style.css';
import { createRouter } from './router';
import { gameIndexScreen, gameScreen } from './screens/game';
import { learnIndexScreen, learnThemeScreen } from './screens/learn';
import { menuScreen } from './screens/menu';
import { resultsScreen } from './screens/results';

const root = document.querySelector<HTMLDivElement>('#app')!;

createRouter(root, {
  '/': menuScreen,
  '/aprende': learnIndexScreen,
  '/aprende/:tema': learnThemeScreen,
  '/jugar': gameIndexScreen,
  '/jugar/:tema': gameScreen,
  '/resultados': resultsScreen,
}).start();
