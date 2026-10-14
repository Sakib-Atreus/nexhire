'use client';

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { useRouter } from 'next/navigation';

/*
 * Keeps people from leaving a video interview by accident while `active`:
 *  - Back with the chat open closes the chat (the chat gets its own history entry).
 *  - Back with the chat closed asks "Leave the interview?" instead of leaving.
 *  - Clicking any in-app link (top back arrow, sidebar, tab bar) asks first.
 *  - Closing or reloading the tab shows the browser's own "Leave site?" warning.
 *
 * History entries are added with history.pushState (no URL change). Next.js copies its own router state
 * into them, so going back to one of them simply re-renders the same call page. Browsers don't let a
 * site fully block Back (e.g. pressing it several times quickly), so this covers the normal single press.
 */

type Pending = { kind: 'back' } | { kind: 'link'; href: string };

const GUARD = { nexhireCall: 'guard' };
const CHAT = { nexhireCall: 'chat' };

/** LiveKit's chat panel inside `container`, and whether it's showing. */
function chatPanel(container: HTMLElement | null) {
  const el = container?.querySelector<HTMLElement>('.lk-chat') ?? null;
  return { el, open: !!el && el.style.display !== 'none' };
}

export function useCallGuard(active: boolean, containerRef: RefObject<HTMLElement | null>) {
  const router = useRouter();
  const [pending, setPending] = useState<Pending | null>(null);
  const guardOnTop = useRef(false); // our guard entry is in history above the call page
  const chatEntry = useRef(false); // our chat entry is in history above the guard
  const ignoreNextPop = useRef(false); // we called history.back() ourselves
  const leaving = useRef(false);

  // Push the guard entry when the call starts; when the call ends on this page (Leave button, disconnect),
  // take our entries back off so Back behaves normally again.
  useEffect(() => {
    if (!active) return;
    leaving.current = false;
    ignoreNextPop.current = false;
    chatEntry.current = false;
    window.history.pushState(GUARD, '');
    guardOnTop.current = true;
    return () => {
      if (leaving.current) return; // navigating away: leave history alone
      const extra = (guardOnTop.current ? 1 : 0) + (chatEntry.current ? 1 : 0);
      guardOnTop.current = false;
      chatEntry.current = false;
      if (extra > 0 && (window.history.state?.nexhireCall === 'guard' || window.history.state?.nexhireCall === 'chat')) {
        // The Back listener is already gone at this point, so no flag is needed for this one.
        window.history.go(-extra);
      }
    };
  }, [active]);

  // Back button.
  useEffect(() => {
    if (!active) return;
    const onPop = () => {
      if (ignoreNextPop.current) {
        ignoreNextPop.current = false;
        return;
      }
      if (leaving.current) return;
      if (chatEntry.current) {
        // Back while the chat is open: close the chat, stay in the call.
        chatEntry.current = false;
        const { el, open } = chatPanel(containerRef.current);
        if (open) el?.querySelector<HTMLElement>('.lk-close-button')?.click();
        return;
      }
      // Back from the call itself: ask first.
      guardOnTop.current = false;
      setPending({ kind: 'back' });
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [active, containerRef]);

  // Give the chat its own history entry while it's open, so Back closes it.
  useEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    if (!container) return;
    let wasOpen = chatPanel(container).open;
    const check = () => {
      const { open } = chatPanel(container);
      if (open === wasOpen) return;
      wasOpen = open;
      if (open) {
        window.history.pushState(CHAT, '');
        chatEntry.current = true;
      } else if (chatEntry.current) {
        // Closed with its own button: remove the chat entry we added.
        chatEntry.current = false;
        ignoreNextPop.current = true;
        window.history.back();
      }
    };
    const mo = new MutationObserver(check);
    mo.observe(container, { subtree: true, childList: true, attributes: true, attributeFilter: ['style'] });
    return () => mo.disconnect();
  }, [active, containerRef]);

  // In-app links: intercept before Next.js handles the click.
  useEffect(() => {
    if (!active) return;
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return;
      e.preventDefault();
      e.stopPropagation();
      setPending({ kind: 'link', href: url.pathname + url.search + url.hash });
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [active]);

  // Closing or reloading the tab.
  useEffect(() => {
    if (!active) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [active]);

  const stay = useCallback(() => {
    if (pending?.kind === 'back' && !guardOnTop.current) {
      window.history.pushState(GUARD, '');
      guardOnTop.current = true;
    }
    setPending(null);
  }, [pending]);

  const leave = useCallback(() => {
    const p = pending;
    setPending(null);
    leaving.current = true;
    if (p?.kind === 'back') window.history.back(); // the guard is already gone: this leaves the call page
    else if (p?.kind === 'link') router.push(p.href);
  }, [pending, router]);

  return { confirmOpen: pending !== null, stay, leave };
}
