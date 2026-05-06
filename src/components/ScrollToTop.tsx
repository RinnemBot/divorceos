import { useEffect, useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

const scrollPageToTop = () => {
  if (typeof window === 'undefined') return;
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
};

export function ScrollToTop() {
  const location = useLocation();
  const focusChat = Boolean((location.state as { focusChat?: boolean } | null)?.focusChat);
  const shouldHonorHash = focusChat || location.state?.fromAppNavigation === true;

  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.history.scrollRestoration = 'manual';

    const handlePageShow = () => {
      if (window.location.pathname === '/' && window.location.hash === '#chat') {
        window.history.replaceState(window.history.state, '', '/');
      }
      scrollPageToTop();
    };

    window.addEventListener('pageshow', handlePageShow);
    return () => {
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, []);

  useLayoutEffect(() => {
    if (typeof window === 'undefined') return;

    window.history.scrollRestoration = 'manual';

    if (focusChat && !location.hash) return;

    if (location.hash && shouldHonorHash) {
      const elementId = decodeURIComponent(location.hash.replace(/^#/, ''));
      window.setTimeout(() => {
        document.getElementById(elementId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 80);
      return;
    }

    scrollPageToTop();
    window.requestAnimationFrame(scrollPageToTop);
    window.setTimeout(scrollPageToTop, 0);
    window.setTimeout(scrollPageToTop, 120);
  }, [location.pathname, location.search, location.hash, focusChat, shouldHonorHash]);

  return null;
}
