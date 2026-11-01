import { useEffect, useState } from 'react';

export type Route =
  | { name: 'list' }
  | { name: 'new' }
  | { name: 'project'; id: string }
  | { name: 'edit'; id: string }
  | { name: 'settings' };

export function parseRoute(hash: string): Route {
  const path = hash.replace(/^#/, '') || '/';
  let m: RegExpMatchArray | null;
  if (path === '/new') return { name: 'new' };
  if (path === '/settings') return { name: 'settings' };
  if ((m = path.match(/^\/p\/([\w-]+)\/edit$/))) return { name: 'edit', id: m[1] };
  if ((m = path.match(/^\/p\/([\w-]+)$/))) return { name: 'project', id: m[1] };
  return { name: 'list' };
}

export function useRoute(): Route {
  const [hash, setHash] = useState(() => window.location.hash);
  useEffect(() => {
    const onChange = () => {
      setHash(window.location.hash);
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return parseRoute(hash);
}

export const navigate = (path: string) => {
  window.location.hash = path;
};
