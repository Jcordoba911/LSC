import './style.css';
import { createRouter } from './router';
import { gameIndexScreen, gameScreen } from './screens/game';
import { learnIndexScreen, learnThemeScreen } from './screens/learn';
import { menuScreen } from './screens/menu';
import { memoryIndexScreen, memoryScreen } from './screens/memory';
import { resultsScreen } from './screens/results';
import { sentenceGameScreen, sentenceIndexScreen } from './screens/sentence';

const root = document.querySelector<HTMLDivElement>('#app')!;

createRouter(root, {
  '/': menuScreen,
  '/aprende': learnIndexScreen,
  '/aprende/:tema': learnThemeScreen,
  '/aprende/:tema/:estilo': learnThemeScreen,
  '/jugar': gameIndexScreen,
  '/jugar/:tema': gameScreen,
  '/jugar/:tema/:estilo': gameScreen,
  '/memoria': memoryIndexScreen,
  '/memoria/:tema': memoryScreen,
  '/memoria/:tema/:estilo': memoryScreen,
  '/frases': sentenceIndexScreen,
  '/frases/:tema': sentenceGameScreen,
  '/frases/:tema/:variante': sentenceGameScreen,
  '/resultados': resultsScreen,
}).start();
