import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function ScrollToTop() {
  const location = useLocation();
  const focusChat = Boolean((location.state as { focusChat?: boolean } | null)?.focusChat);

  useEffect(() => {
    if (typeof window !== 'undefined' && !focusChat) {
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    }
  }, [location.key, focusChat]);

  return null;
}
