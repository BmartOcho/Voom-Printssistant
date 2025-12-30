/**
 * Hook to analyze selected images for DPI relative to print dimensions.
 * Gracefully handles cases where pixel dimensions are unavailable.
 * 
 * Note: The Canva SDK uses selection.registerOnChange() for selection events,
 * which requires setting up a listener. For simplicity, this implementation
 * provides a manual analyze button that shows a placeholder/guidance since
 * direct image pixel access may require additional SDK integration.
 */

import { useCallback, useState } from 'react';
import { calculateDPI } from '../lib/formatting';
import { getDPIStatus, type DPIThreshold } from '../data/dpiGuidelines';

export interface ImageAnalysisResult {
  id: string;
  name: string;
  dpi: number | null;
  status: DPIThreshold | null;
  error?: string;
}

export interface ImageAnalysisState {
  results: ImageAnalysisResult[];
  overallStatus: 'excellent' | 'good' | 'acceptable' | 'warning' | 'low' | 'unknown' | null;
  loading: boolean;
  error: string | null;
  analyze: (targetWidthIn: number, targetHeightIn: number) => Promise<void>;
  clear: () => void;
}

export function useImageAnalysis(): ImageAnalysisState {
  const [results, setResults] = useState<ImageAnalysisResult[]>([]);
  const [overallStatus, setOverallStatus] = useState<ImageAnalysisState['overallStatus']>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(async (_targetWidthIn: number, _targetHeightIn: number) => {
    setLoading(true);
    setError(null);
    setResults([]);
    setOverallStatus(null);

    try {
      // The Canva SDK provides selection.registerOnChange() for listening to selection events.
      // Direct access to image pixel dimensions requires the app to be listening for
      // selection changes. For this implementation, we provide guidance instead.
      //
      // To fully implement:
      // 1. Import { selection } from '@canva/design'
      // 2. Use selection.registerOnChange({ scope: 'image' }) to listen for image selections
      // 3. In the callback, access image content and dimensions
      //
      // For now, we show a helpful message:
      setError(
        'To analyze image DPI, select images in your design and ensure they are high resolution for print. ' +
        'For best results, use images with at least 300 DPI at print size.'
      );
      setOverallStatus('unknown');
      
      // Example of what the results would look like if we had access:
      // const mockResults: ImageAnalysisResult[] = [
      //   { id: 'img-1', name: 'Image 1', dpi: 300, status: getDPIStatus(300) },
      // ];
      // setResults(mockResults);

    } catch (err) {
      console.error('[useImageAnalysis] Error:', err);
      setError(
        'Unable to analyze images. Make sure you have selected images in your design.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setResults([]);
    setOverallStatus(null);
    setError(null);
  }, []);

  return {
    results,
    overallStatus,
    loading,
    error,
    analyze,
    clear,
  };
}
