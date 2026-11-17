import './style.css';
import { createRouter } from './router';
import { gameIndexScreen, gameScreen } from './screens/game';
import { learnIndexScreen, learnThemeScreen } from './screens/learn';
import { menuScreen } from './screens/menu';
import { memoryIndexScreen, memoryScreen } from './screens/memory';
import { modesScreen } from './screens/modes';
import { resultsScreen } from './screens/results';
import { sentenceGameScreen, sentenceIndexScreen } from './screens/sentence';

const root = document.querySelector<HTMLDivElement>('#app')!;

createRouter(root, {
  '/': menuScreen,
  '/modos': modesScreen,
  '/aprende': learnIndexScreen,
  '/aprende/:tema': learnThemeScreen,
  '/aprende/:tema/:estilo': learnThemeScreen,
  '/jugar': gameIndexScreen,
  '/jugar/:tema': gameScreen,
  '/jugar/:tema/:estilo': gameScreen,
  '/memoria': memoryIndexScreen,
  '/memoria/:dificultad': memoryScreen,
  '/frases': sentenceIndexScreen,
  '/frases/:tema': sentenceGameScreen,
  '/frases/:tema/:variante': sentenceGameScreen,
  '/resultados': resultsScreen,
}).start();
