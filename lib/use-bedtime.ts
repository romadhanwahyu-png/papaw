'use client';

import { useState, useEffect } from 'react';
import { getBedtimeContext } from './time';
import type { BedtimeContext } from '@/types';

/**
 * Detect the current bedtime context on the client.
 *
 * Time is client-only, so we start from a stable default and update once after
 * mount — this keeps SSR/client hydration consistent (the server can't know the
 * viewer's local time). The single deferred setState is intentional and lives
 * here so pages don't each repeat the pattern.
 */
export function useBedtime(initial: BedtimeContext = 'bedtime'): BedtimeContext {
  const [mode, setMode] = useState<BedtimeContext>(initial);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client-only time, deferred post-mount to keep hydration stable
    setMode(getBedtimeContext(new Date()));
  }, []);

  return mode;
}
