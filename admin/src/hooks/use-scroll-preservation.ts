import { useCallback, useRef, useEffect } from 'react';

/**
 * Custom hook for preserving scroll position during state updates
 * Useful for pagination and filtering operations that shouldn't scroll to top
 */
export function useScrollPreservation() {
  const scrollPositionRef = useRef<number>(0);
  
  // Disable automatic scroll restoration
  useEffect(() => {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    
    // Set CSS to prevent smooth scrolling during updates
    document.documentElement.style.scrollBehavior = 'auto';
    
    return () => {
      if ('scrollRestoration' in history) {
        history.scrollRestoration = 'auto';
      }
    };
  }, []);

  const preserveScroll = useCallback((callback: () => void) => {
    // Save current scroll position
    const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
    scrollPositionRef.current = currentScroll;
    
    // Execute the callback (state update)
    callback();
    
    // Immediately restore scroll position
    const restoreScroll = () => {
      window.scrollTo(0, scrollPositionRef.current);
    };
    
    // Use multiple restoration attempts
    restoreScroll(); // Immediate
    setTimeout(restoreScroll, 0); // Next tick
    requestAnimationFrame(restoreScroll); // Next frame
    setTimeout(restoreScroll, 16); // ~1 frame at 60fps
    setTimeout(restoreScroll, 100); // Fallback
  }, []);

  const preserveScrollAsync = useCallback(async (callback: () => Promise<void>) => {
    // Save current scroll position
    const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
    scrollPositionRef.current = currentScroll;
    
    // Execute the async callback
    await callback();
    
    // Immediately restore scroll position
    const restoreScroll = () => {
      window.scrollTo(0, scrollPositionRef.current);
    };
    
    // Use multiple restoration attempts
    restoreScroll(); // Immediate
    setTimeout(restoreScroll, 0); // Next tick
    requestAnimationFrame(restoreScroll); // Next frame
    setTimeout(restoreScroll, 16); // ~1 frame at 60fps
    setTimeout(restoreScroll, 100); // Fallback
  }, []);

  return {
    preserveScroll,
    preserveScrollAsync
  };
}
