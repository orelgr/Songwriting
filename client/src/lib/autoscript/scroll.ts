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
  private isPaused = false;
  private pauseTimer: NodeJS.Timeout | null = null;
  private lastManualScrollTime = 0;
  private isManualScrolling = false;
  private touchStartY = 0;
  private wheelTimer: NodeJS.Timeout | null = null;

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
    // Remove listeners from previous element
    if (this.element) {
      this.removeEventListeners();
    }

    this.element = element;

    // Add event listeners for manual scrolling detection
    this.addEventListeners();
  }

  /**
   * Add event listeners for manual scroll detection
   */
  private addEventListeners(): void {
    if (!this.element) return;

    // Touch events for mobile
    this.element.addEventListener('touchstart', this.handleTouchStart, { passive: true });
    this.element.addEventListener('touchmove', this.handleTouchMove, { passive: true });
    this.element.addEventListener('touchend', this.handleTouchEnd, { passive: true });

    // Mouse wheel events for desktop
    this.element.addEventListener('wheel', this.handleWheel, { passive: true });

    // General scroll event
    this.element.addEventListener('scroll', this.handleScroll, { passive: true });

    // Mouse drag scroll (for desktop)
    this.element.addEventListener('mousedown', this.handleMouseDown, { passive: true });
    this.element.addEventListener('mouseup', this.handleMouseUp, { passive: true });
  }

  /**
   * Remove event listeners
   */
  private removeEventListeners(): void {
    if (!this.element) return;

    this.element.removeEventListener('touchstart', this.handleTouchStart);
    this.element.removeEventListener('touchmove', this.handleTouchMove);
    this.element.removeEventListener('touchend', this.handleTouchEnd);
    this.element.removeEventListener('wheel', this.handleWheel);
    this.element.removeEventListener('scroll', this.handleScroll);
    this.element.removeEventListener('mousedown', this.handleMouseDown);
    this.element.removeEventListener('mouseup', this.handleMouseUp);
  }

  /**
   * Handle touch start
   */
  private handleTouchStart = (e: TouchEvent): void => {
    if (!this.isScrolling) return;

    this.touchStartY = e.touches[0].clientY;
    this.pauseAutoScroll();
  };

  /**
   * Handle touch move
   */
  private handleTouchMove = (e: TouchEvent): void => {
    if (!this.isScrolling) return;

    this.isManualScrolling = true;
    this.lastManualScrollTime = Date.now();
  };

  /**
   * Handle touch end
   */
  private handleTouchEnd = (e: TouchEvent): void => {
    if (!this.isScrolling) return;

    this.scheduleResume();
  };

  /**
   * Handle mouse wheel
   */
  private handleWheel = (e: WheelEvent): void => {
    if (!this.isScrolling) return;

    this.pauseAutoScroll();
    this.isManualScrolling = true;
    this.lastManualScrollTime = Date.now();

    // Clear existing timer
    if (this.wheelTimer) {
      clearTimeout(this.wheelTimer);
    }

    // Set new timer to resume after wheel stops
    this.wheelTimer = setTimeout(() => {
      this.scheduleResume();
    }, 150);
  };

  /**
   * Handle general scroll
   */
  private handleScroll = (e: Event): void => {
    // Only track if we're in auto-scroll mode
    if (!this.isScrolling || this.isPaused) return;

    // Check if this scroll event is likely manual
    const now = Date.now();
    if (now - this.lastManualScrollTime < 100) {
      this.isManualScrolling = true;
    }
  };

  /**
   * Handle mouse down (for drag scrolling)
   */
  private handleMouseDown = (e: MouseEvent): void => {
    if (!this.isScrolling) return;

    // Check if clicking on scrollbar
    const rect = this.element!.getBoundingClientRect();
    const isScrollbar = e.clientX > rect.right - 20 || e.clientY > rect.bottom - 20;

    if (isScrollbar) {
      this.pauseAutoScroll();
      this.isManualScrolling = true;
    }
  };

  /**
   * Handle mouse up
   */
  private handleMouseUp = (e: MouseEvent): void => {
    if (!this.isScrolling || !this.isManualScrolling) return;

    this.scheduleResume();
  };

  /**
   * Pause auto-scrolling
   */
  private pauseAutoScroll(): void {
    if (!this.isScrolling || this.isPaused) return;

    this.isPaused = true;

    // Cancel current animation
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    // Clear any existing resume timer
    if (this.pauseTimer) {
      clearTimeout(this.pauseTimer);
      this.pauseTimer = null;
    }
  }

  /**
   * Schedule resuming auto-scroll after delay
   */
  private scheduleResume(): void {
    if (!this.isScrolling || !this.isPaused) return;

    // Clear existing timer
    if (this.pauseTimer) {
      clearTimeout(this.pauseTimer);
    }

    // Schedule resume after 1.5 seconds of no manual activity
    this.pauseTimer = setTimeout(() => {
      this.resumeAutoScroll();
    }, 1500);
  }

  /**
   * Resume auto-scrolling
   */
  private resumeAutoScroll(): void {
    if (!this.isScrolling || !this.isPaused) return;

    this.isPaused = false;
    this.isManualScrolling = false;

    // Update start position and time for smooth continuation
    if (this.element) {
      this.startPosition = this.element.scrollTop;
      this.startTime = performance.now();
    }

    // Restart animation
    this.animate();
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
    this.isPaused = false;
    this.isManualScrolling = false;
    this.startTime = performance.now();
    this.startPosition = this.element.scrollTop;

    this.animate();
  }

  /**
   * Stop auto-scrolling
   */
  stop(): void {
    this.isScrolling = false;
    this.isPaused = false;
    this.isManualScrolling = false;

    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    if (this.pauseTimer) {
      clearTimeout(this.pauseTimer);
      this.pauseTimer = null;
    }

    if (this.wheelTimer) {
      clearTimeout(this.wheelTimer);
      this.wheelTimer = null;
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
    return this.isScrolling && !this.isPaused;
  }

  /**
   * Check if paused
   */
  isPausedState(): boolean {
    return this.isPaused;
  }

  /**
   * Animation loop
   */
  private animate = (): void => {
    if (!this.isScrolling || !this.element || this.startTime === null || this.isPaused) return;

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

    // Continue animation only if not paused
    if (!this.isPaused) {
      this.animationId = requestAnimationFrame(this.animate);
    }
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
    this.removeEventListeners();
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
  isPaused: boolean;
} {
  const scrollerRef = React.useRef<AutoScroller | null>(null);
  const [isScrolling, setIsScrolling] = React.useState(false);
  const [isPaused, setIsPaused] = React.useState(false);

  React.useEffect(() => {
    if (elementRef.current) {
      const scroller = new AutoScroller(elementRef.current, config);
      scrollerRef.current = scroller;

      // Monitor scrolling and pause state
      const checkState = setInterval(() => {
        setIsScrolling(scroller.isActive());
        setIsPaused(scroller.isPausedState());
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
    setIsPaused(false);
  }, []);

  const stop = React.useCallback(() => {
    scrollerRef.current?.stop();
    setIsScrolling(false);
    setIsPaused(false);
  }, []);

  const toggle = React.useCallback(() => {
    scrollerRef.current?.toggle();
    setIsScrolling(scrollerRef.current?.isActive() ?? false);
    setIsPaused(scrollerRef.current?.isPausedState() ?? false);
  }, []);

  const setSpeed = React.useCallback((speed: number) => {
    scrollerRef.current?.setSpeed(speed);
  }, []);

  return {
    start,
    stop,
    toggle,
    setSpeed,
    isScrolling,
    isPaused
  };
}

// Import React for the hook
import * as React from 'react';