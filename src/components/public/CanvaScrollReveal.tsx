import React, { useRef, useState, useEffect } from 'react';

interface CanvaScrollRevealProps {
  children: React.ReactNode;
  direction?: 'left' | 'right' | 'up' | 'pop';
  delay?: number; // In milliseconds
  duration?: number; // In milliseconds
  className?: string;
  threshold?: number;
  once?: boolean;
  enabled?: boolean;
}

/**
 * CanvaScrollReveal
 * Dynamically slides content into view from left to right (or right/up/pop)
 * WHEN the user scrolls it into the viewport, just like a Canva kinetic presentation.
 */
export const CanvaScrollReveal: React.FC<CanvaScrollRevealProps> = ({
  children,
  direction = 'left',
  delay = 0,
  duration = 750,
  className = '',
  threshold = 0.12,
  once = false,
  enabled = true,
}) => {
  const domRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setIsVisible(true);
      return;
    }

    const element = domRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        } else if (!once) {
          // Reset when scrolled past so returning re-triggers the lively presentation!
          setIsVisible(false);
        }
      },
      {
        threshold,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold, once, enabled]);

  if (!enabled) {
    return <div className={className}>{children}</div>;
  }

  // Calculate transform according to direction
  const getTransform = () => {
    if (isVisible) return 'translate3d(0, 0, 0) scale(1)';
    switch (direction) {
      case 'left':
        return 'translate3d(-64px, 0, 0)';
      case 'right':
        return 'translate3d(64px, 0, 0)';
      case 'up':
        return 'translate3d(0, 48px, 0)';
      case 'pop':
        return 'scale(0.85) translate3d(0, 20px, 0)';
      default:
        return 'translate3d(-64px, 0, 0)';
    }
  };

  return (
    <div
      ref={domRef}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: getTransform(),
        transitionProperty: 'opacity, transform',
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
        transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
        willChange: 'transform, opacity',
      }}
    >
      {children}
    </div>
  );
};

interface CanvaKineticWordsProps {
  text: string;
  className?: string;
  wordClassName?: string;
  delayOffset?: number;
  enabled?: boolean;
}

/**
 * CanvaKineticWords
 * Takes a heading and animates each word sliding in sequentially from left to right as you scroll!
 */
export const CanvaKineticWords: React.FC<CanvaKineticWordsProps> = ({
  text,
  className = '',
  wordClassName = '',
  delayOffset = 0,
  enabled = true,
}) => {
  const domRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setIsVisible(true);
      return;
    }

    const element = domRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        } else {
          setIsVisible(false);
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [enabled]);

  const words = text.split(' ');

  return (
    <div ref={domRef} className={`inline-flex flex-wrap gap-x-2 gap-y-1 ${className}`}>
      {words.map((word, idx) => (
        <span
          key={idx}
          className={`inline-block ${wordClassName}`}
          style={{
            opacity: !enabled || isVisible ? 1 : 0,
            transform: !enabled || isVisible ? 'translate3d(0, 0, 0)' : 'translate3d(-36px, 0, 0)',
            transitionProperty: 'opacity, transform',
            transitionDuration: '650ms',
            transitionDelay: enabled ? `${delayOffset + idx * 85}ms` : '0ms',
            transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {word}
        </span>
      ))}
    </div>
  );
};
