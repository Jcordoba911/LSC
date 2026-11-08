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
      await route.screen(root, params);
      return;
    }
    navigate(fallback);
  };

  window.addEventListener('hashchange', resolve);
  return { start: resolve };
}

export function navigate(path: string): void {
  location.hash = path;
}
