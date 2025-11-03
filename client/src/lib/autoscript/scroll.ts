/**
 * Auto-scroll functionality for song display
 */

export interface AutoScrollConfig {
  speedPxPerSec: number;
  smoothScroll: boolean;
  respectReducedMotion: boolean;
}

export class AutoScroller {
  private element: HTMLElement | null = null;
  private isScrolling = false;
  private animationId: number | null = null;
  private startTime: number | null = null;
  private startPosition = 0;
  private config: AutoScrollConfig = {
    speedPxPerSec: 30,
    smoothScroll: true,
    respectReducedMotion: true
  };

  constructor(element?: HTMLElement, config?: Partial<AutoScrollConfig>) {
    if (element) {
      this.setElement(element);
    }
    if (config) {
      this.updateConfig(config);
    }
  }

  /**
   * Set the element to scroll
   */
  setElement(element: HTMLElement): void {
    this.element = element;
  }

  /**
   * Update scroll configuration
   */
  updateConfig(config: Partial<AutoScrollConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Start auto-scrolling
   */
  start(): void {
    if (!this.element || this.isScrolling) return;

    // Check for reduced motion preference
    if (this.config.respectReducedMotion) {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) {
        console.log('Auto-scroll disabled due to prefers-reduced-motion');
        return;
      }
    }

    this.isScrolling = true;
    this.startTime = performance.now();
    this.startPosition = this.element.scrollTop;

    this.animate();
  }

  /**
   * Stop auto-scrolling
   */
  stop(): void {
    this.isScrolling = false;
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.startTime = null;
  }

  /**
   * Pause/resume scrolling
   */
  toggle(): void {
    if (this.isScrolling) {
      this.stop();
    } else {
      this.start();
    }
  }

  /**
   * Set scroll speed in pixels per second
   */
  setSpeed(speedPxPerSec: number): void {
    this.config.speedPxPerSec = Math.max(0, speedPxPerSec);
  }

  /**
   * Get current scroll speed
   */
  getSpeed(): number {
    return this.config.speedPxPerSec;
  }

  /**
   * Check if currently scrolling
   */
  isActive(): boolean {
    return this.isScrolling;
  }

  /**
   * Animation loop
   */
  private animate = (): void => {
    if (!this.isScrolling || !this.element || this.startTime === null) return;

    const currentTime = performance.now();
    const elapsed = (currentTime - this.startTime) / 1000; // Convert to seconds
    const targetPosition = this.startPosition + (this.config.speedPxPerSec * elapsed);

    // Check if we've reached the bottom
    const maxScroll = this.element.scrollHeight - this.element.clientHeight;

    if (targetPosition >= maxScroll) {
      this.element.scrollTop = maxScroll;
      this.stop();
      this.onComplete();
      return;
    }

    // Apply scroll
    if (this.config.smoothScroll) {
      // Smooth scroll with easing
      const diff = targetPosition - this.element.scrollTop;
      this.element.scrollTop += diff * 0.1; // Easing factor
    } else {
      this.element.scrollTop = targetPosition;
    }

    // Continue animation
    this.animationId = requestAnimationFrame(this.animate);
  };

  /**
   * Called when scrolling completes
   */
  private onComplete(): void {
    // Can be overridden or emit an event
    console.log('Auto-scroll completed');
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.stop();
    this.element = null;
  }
}

/**
 * React hook for auto-scroll
 */
export function useAutoScroll(
  elementRef: React.RefObject<HTMLElement>,
  config?: Partial<AutoScrollConfig>
): {
  start: () => void;
  stop: () => void;
  toggle: () => void;
  setSpeed: (speed: number) => void;
  isScrolling: boolean;
} {
  const scrollerRef = React.useRef<AutoScroller | null>(null);
  const [isScrolling, setIsScrolling] = React.useState(false);

  React.useEffect(() => {
    if (elementRef.current) {
      const scroller = new AutoScroller(elementRef.current, config);
      scrollerRef.current = scroller;

      // Monitor scrolling state
      const checkState = setInterval(() => {
        setIsScrolling(scroller.isActive());
      }, 100);

      return () => {
        clearInterval(checkState);
        scroller.destroy();
      };
    }
  }, [elementRef, config]);

  const start = React.useCallback(() => {
    scrollerRef.current?.start();
    setIsScrolling(true);
  }, []);

  const stop = React.useCallback(() => {
    scrollerRef.current?.stop();
    setIsScrolling(false);
  }, []);

  const toggle = React.useCallback(() => {
    scrollerRef.current?.toggle();
    setIsScrolling(scrollerRef.current?.isActive() ?? false);
  }, []);

  const setSpeed = React.useCallback((speed: number) => {
    scrollerRef.current?.setSpeed(speed);
  }, []);

  return {
    start,
    stop,
    toggle,
    setSpeed,
    isScrolling
  };
}

// Import React for the hook
import * as React from 'react';