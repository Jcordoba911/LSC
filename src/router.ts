export type Params = Record<string, string>;
export type Screen = (root: HTMLElement, params: Params) => void | Promise<void>;

interface Route {
  pattern: RegExp;
  keys: string[];
  screen: Screen;
}

/** Router por hash: '#/aprende/animales' coincide con '/aprende/:tema'. */
export function createRouter(root: HTMLElement, routes: Record<string, Screen>, fallback = '/') {
  const compiled: Route[] = Object.entries(routes).map(([path, screen]) => {
    const keys: string[] = [];
    const pattern = new RegExp(
      '^' + path.replace(/:(\w+)/g, (_, key: string) => (keys.push(key), '([^/]+)')) + '$',
    );
    return { pattern, keys, screen };
  });

  const resolve = async () => {
    const path = location.hash.replace(/^#/, '') || '/';
    for (const route of compiled) {
      const match = route.pattern.exec(path);
      if (!match) continue;
      const params: Params = {};
      route.keys.forEach((key, i) => (params[key] = decodeURIComponent(match[i + 1])));
      root.replaceChildren();
      window.scrollTo(0, 0);
      try {
        await route.screen(root, params);
      } catch (err) {
        console.error(err);
        root.replaceChildren(errorView());
      }
      return;
    }
    navigate(fallback);
  };

  window.addEventListener('hashchange', resolve);
  return { start: resolve };
}

function errorView(): HTMLElement {
  const section = document.createElement('section');
  section.className = 'screen center';
  const title = document.createElement('h2');
  title.textContent = 'No se pudo cargar el contenido';
  const retry = document.createElement('button');
  retry.className = 'btn btn-primary';
  retry.textContent = 'Reintentar';
  retry.addEventListener('click', () => window.dispatchEvent(new HashChangeEvent('hashchange')));
  const home = document.createElement('a');
  home.className = 'btn';
  home.href = '#/';
  home.textContent = 'Menú';
  const actions = document.createElement('div');
  actions.className = 'actions center';
  actions.append(retry, home);
  section.append(title, actions);
  return section;
}

export function navigate(path: string): void {
  location.hash = path;
}
