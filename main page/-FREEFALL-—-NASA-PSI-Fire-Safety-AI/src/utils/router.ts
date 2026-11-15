import { useState, useEffect, useCallback } from 'react';

export interface RouteState {
  path: string;
  params: Record<string, string>;
}

/**
 * Parses the current window.location.hash into a path and key-value params.
 * Example: "#/hardware?q=MOXIE&filter=spinoff" -> path: "/hardware", params: { q: "MOXIE", filter: "spinoff" }
 */
export function parseHash(hashString?: string, defaultPath = '/welcome'): RouteState {
  const raw = typeof hashString === 'string' ? hashString : (typeof window !== 'undefined' ? window.location.hash : '');
  const clean = raw.replace(/^#\/?/, '/');

  if (!clean || clean === '/') {
    return { path: defaultPath, params: {} };
  }

  const [pathPart, queryPart] = clean.split('?');
  let normalizedPath = pathPart.startsWith('/') ? pathPart : `/${pathPart}`;
  if (normalizedPath.length > 1 && normalizedPath.endsWith('/')) {
    normalizedPath = normalizedPath.replace(/\/+$/, '');
  }

  const params: Record<string, string> = {};
  if (queryPart) {
    const searchParams = new URLSearchParams(queryPart);
    searchParams.forEach((val, key) => {
      params[key] = val;
    });
  }

  // Graceful legacy redirect for /predictor bookmarks: redirect to simulator prediction tab
  if (normalizedPath === '/predictor') {
    normalizedPath = '/simulator';
    if (!params.tab) {
      params.tab = 'prediction';
    }
  }

  return { path: normalizedPath, params };
}

/**
 * Lightweight, zero-dependency hook for hash-based routing.
 * Works seamlessly across GitHub Pages, Vercel, Netlify,
 * or local preview without server-side rewrite configuration.
 */
export function useHashRoute(defaultPath = '/welcome') {
  const [route, setRoute] = useState<RouteState>(() => {
    if (typeof window === 'undefined') {
      return { path: defaultPath, params: {} };
    }
    const parsed = parseHash(undefined, defaultPath);
    return parsed.path === '/' ? { path: defaultPath, params: {} } : parsed;
  });

  useEffect(() => {
    const handleHashChange = () => {
      const parsed = parseHash(undefined, defaultPath);
      if (parsed.path === '/') {
        setRoute({ path: defaultPath, params: {} });
      } else {
        setRoute(parsed);
      }
    };

    // If initial hash is empty, set default hash
    if (typeof window !== 'undefined' && (!window.location.hash || window.location.hash === '#/')) {
      window.location.hash = `#${defaultPath}`;
    }

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [defaultPath]);

  const navigate = useCallback((targetPath: string, queryParams?: Record<string, string>) => {
    if (typeof window === 'undefined') return;
    const cleanPath = targetPath.startsWith('/') ? targetPath : `/${targetPath}`;
    let hashStr = `#${cleanPath}`;

    if (queryParams && Object.keys(queryParams).length > 0) {
      const search = new URLSearchParams(queryParams).toString();
      hashStr += `?${search}`;
    }

    if (window.location.hash === hashStr) {
      // Force update if hash is identical
      setRoute({ path: cleanPath, params: queryParams || {} });
    } else {
      window.location.hash = hashStr;
    }
  }, []);

  return {
    path: route.path,
    params: route.params,
    navigate,
  };
}
