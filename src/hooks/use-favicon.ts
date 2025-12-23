import { useEffect } from 'react';

const useFavicon = (role?: string) => {
  useEffect(() => {
    const updateFavicon = () => {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      let faviconHref = '/favicon-login.svg'; // default

      if (role) {
        const theme = isDark ? 'dark' : 'light';
        faviconHref = `/favicon-${role}-${theme}.svg`;
      }

      const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
      if (link) {
        link.href = faviconHref;
      }
    };

    updateFavicon();

    // Listen for theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', updateFavicon);

    return () => {
      mediaQuery.removeEventListener('change', updateFavicon);
    };
  }, [role]);
};

export default useFavicon;