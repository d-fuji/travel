'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  content: string;
  children: React.ReactElement;
  show: boolean;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export default function Tooltip({ 
  content, 
  children, 
  show, 
  position = 'top',
  className = ''
}: TooltipProps) {
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const triggerRef = useRef<HTMLElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!show) {
      setIsVisible(false);
      return;
    }

    const trigger = triggerRef.current;
    if (!trigger) return;

    const updatePosition = () => {
      const rect = trigger.getBoundingClientRect();
      const tooltipRect = tooltipRef.current?.getBoundingClientRect();
      
      let x = 0;
      let y = 0;

      switch (position) {
        case 'top':
          x = rect.left + rect.width / 2;
          y = rect.top - 8;
          if (tooltipRect) {
            x -= tooltipRect.width / 2;
          }
          break;
        case 'bottom':
          x = rect.left + rect.width / 2;
          y = rect.bottom + 8;
          if (tooltipRect) {
            x -= tooltipRect.width / 2;
          }
          break;
        case 'left':
          x = rect.left - 8;
          y = rect.top + rect.height / 2;
          if (tooltipRect) {
            x -= tooltipRect.width;
            y -= tooltipRect.height / 2;
          }
          break;
        case 'right':
          x = rect.right + 8;
          y = rect.top + rect.height / 2;
          if (tooltipRect) {
            y -= tooltipRect.height / 2;
          }
          break;
      }

      setTooltipPosition({ x, y });
    };

    updatePosition();
    setIsVisible(true);

    const handleResize = () => updatePosition();
    const handleScroll = () => updatePosition();

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [show, position]);

  const clonedChild = React.cloneElement(children, {
    ref: triggerRef,
  });

  const getPositionClasses = () => {
    switch (position) {
      case 'top':
        return 'mb-2';
      case 'bottom':
        return 'mt-2';
      case 'left':
        return 'mr-2';
      case 'right':
        return 'ml-2';
      default:
        return 'mb-2';
    }
  };

  const getArrowClasses = () => {
    const baseClasses = 'absolute w-0 h-0 border-solid';
    switch (position) {
      case 'top':
        return `${baseClasses} border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-red-600 top-full left-1/2 transform -translate-x-1/2`;
      case 'bottom':
        return `${baseClasses} border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-red-600 bottom-full left-1/2 transform -translate-x-1/2`;
      case 'left':
        return `${baseClasses} border-t-4 border-b-4 border-l-4 border-t-transparent border-b-transparent border-l-red-600 left-full top-1/2 transform -translate-y-1/2`;
      case 'right':
        return `${baseClasses} border-t-4 border-b-4 border-r-4 border-t-transparent border-b-transparent border-r-red-600 right-full top-1/2 transform -translate-y-1/2`;
      default:
        return `${baseClasses} border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-red-600 top-full left-1/2 transform -translate-x-1/2`;
    }
  };

  return (
    <>
      {clonedChild}
      {typeof document !== 'undefined' && isVisible && createPortal(
        <div
          ref={tooltipRef}
          className={`fixed z-50 px-3 py-2 text-sm text-white bg-red-600 rounded-lg shadow-lg pointer-events-none transition-opacity duration-200 ${
            show ? 'opacity-100' : 'opacity-0'
          } ${getPositionClasses()} ${className}`}
          style={{
            left: tooltipPosition.x,
            top: tooltipPosition.y,
          }}
        >
          {content}
          <div className={getArrowClasses()} />
        </div>,
        document.body
      )}
    </>
  );
}

// React import for cloneElement
import React from 'react';