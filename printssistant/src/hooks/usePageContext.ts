/**
 * Hook to get current page context from Canva design.
 * Converts points to inches (72 points = 1 inch).
 */

import { useCallback, useEffect, useState } from 'react';
import { getCurrentPageContext } from '@canva/design';
import { pointsToInches } from '../lib/formatting';

export interface PageContextResult {
  widthIn: number;
  heightIn: number;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function usePageContext(): PageContextResult {
  const [widthIn, setWidthIn] = useState<number>(0);
  const [heightIn, setHeightIn] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContext = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const context = await getCurrentPageContext();
      
      if (context && context.dimensions) {
        // Canva returns dimensions in points (72 points = 1 inch)
        const { width, height } = context.dimensions;
        setWidthIn(pointsToInches(width));
        setHeightIn(pointsToInches(height));
      } else {
        setError('Unable to get page dimensions');
      }
    } catch (err) {
      console.error('[usePageContext] Error:', err);
      setError('Failed to load page context');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchContext();
  }, [fetchContext]);

  return {
    widthIn,
    heightIn,
    loading,
    error,
    refresh: fetchContext,
  };
}
