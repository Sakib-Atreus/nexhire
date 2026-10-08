/** localStorage key for the theme choice; also read by THEME_INIT_SCRIPT before first paint. */
export const THEME_STORAGE_KEY = 'nexhire-theme';

/** Inline, render-blocking script: sets the theme class before the page paints (no light flash). */
export const THEME_INIT_SCRIPT = `(function(){try{var p=localStorage.getItem('${THEME_STORAGE_KEY}');var d=p==='dark'||(p!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);var e=document.documentElement;if(d)e.classList.add('dark');e.style.colorScheme=d?'dark':'light';}catch(e){}})();`;
