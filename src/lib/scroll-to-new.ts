import { useCallback, useLayoutEffect, useRef } from 'react';
import type { ScrollView } from 'react-native';

/**
 * Scrolls a list to the bottom when an item is appended, so a freshly added name is never
 * hidden below the fold. Removing items or re-rendering leaves the scroll position alone.
 * Spread the result onto the ScrollView.
 */
export const useScrollToNew = (count: number) => {
  const ref = useRef<ScrollView>(null);
  const previous = useRef(count);
  const pending = useRef(false);

  // Layout effect, so the flag is set before the native size change reports back.
  useLayoutEffect(() => {
    if (count > previous.current) pending.current = true;
    previous.current = count;
  }, [count]);

  const onContentSizeChange = useCallback(() => {
    if (!pending.current) return;
    pending.current = false;
    ref.current?.scrollToEnd({ animated: true });
  }, []);

  return { ref, onContentSizeChange };
};
