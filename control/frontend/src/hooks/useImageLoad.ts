import { useState, useEffect, useCallback, useRef } from 'react';

interface UseImageLoadOptions {
  src: string | null;
  maxRetries?: number;
  retryDelayMs?: number;
}

interface UseImageLoadResult {
  isLoading: boolean;
  hasError: boolean;
  imgSrc: string | null;
  handleLoad: () => void;
  handleError: () => void;
}

export function useImageLoad({
  src,
  maxRetries = 3,
  retryDelayMs = 2000,
}: UseImageLoadOptions): UseImageLoadResult {
  const [isLoading, setIsLoading] = useState(!!src);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // Reset state when src changes
  useEffect(() => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = undefined;
    }

    if (src) {
      setIsLoading(true);
      setHasError(false);
      setRetryCount(0);
    } else {
      setIsLoading(false);
      setHasError(false);
      setRetryCount(0);
    }
  }, [src]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
      }
    };
  }, []);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
  }, []);

  const handleError = useCallback(() => {
    if (retryCount < maxRetries) {
      retryTimerRef.current = setTimeout(() => {
        setRetryCount(prev => prev + 1);
      }, retryDelayMs);
    } else {
      setIsLoading(false);
      setHasError(true);
    }
  }, [retryCount, maxRetries, retryDelayMs]);

  // Build the actual src with cache-busting for retries
  const imgSrc = src
    ? retryCount > 0
      ? `${src}?retry=${retryCount}`
      : src
    : null;

  return { isLoading, hasError, imgSrc, handleLoad, handleError };
}
