'use client';

import { useEffect, useState } from 'react';

/**
 * True after the first client render. Use it to gate UI that depends on the
 * persisted auth store so server and client markup match during hydration.
 */
export function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
