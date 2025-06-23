'use client';

import { useState, useEffect } from 'react';

interface BreakpointOptions {
  mobile?: number;
  tablet?: number;
  desktop?: number;
}

const defaultBreakpoints: Required<BreakpointOptions> = {
  mobile: 768,
  tablet: 1024,
  desktop: 1440
};

export function useResponsive(customBreakpoints?: BreakpointOptions) {
  const breakpoints = { ...defaultBreakpoints, ...customBreakpoints };
  
  const [screenSize, setScreenSize] = useState<{
    width: number;
    height: number;
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
    isLandscape: boolean;
    isPortrait: boolean;
  }>({
    width: 0,
    height: 0,
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    isLandscape: false,
    isPortrait: false
  });

  useEffect(() => {
    const updateScreenSize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setScreenSize({
        width,
        height,
        isMobile: width < breakpoints.mobile,
        isTablet: width >= breakpoints.mobile && width < breakpoints.desktop,
        isDesktop: width >= breakpoints.desktop,
        isLandscape: width > height,
        isPortrait: height > width
      });
    };

    // Inicializar
    updateScreenSize();

    // Adicionar listener
    window.addEventListener('resize', updateScreenSize);
    
    // Cleanup
    return () => window.removeEventListener('resize', updateScreenSize);
  }, [breakpoints.mobile, breakpoints.desktop]);

  return screenSize;
}

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    
    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
}

export function useOrientation() {
  const [orientation, setOrientation] = useState<{
    isLandscape: boolean;
    isPortrait: boolean;
    angle: number;
  }>({
    isLandscape: false,
    isPortrait: true,
    angle: 0
  });

  useEffect(() => {
    const updateOrientation = () => {
      const angle = (screen.orientation?.angle) || 0;
      setOrientation({
        isLandscape: window.innerWidth > window.innerHeight,
        isPortrait: window.innerHeight > window.innerWidth,
        angle
      });
    };

    updateOrientation();
    
    window.addEventListener('resize', updateOrientation);
    window.addEventListener('orientationchange', updateOrientation);
    
    return () => {
      window.removeEventListener('resize', updateOrientation);
      window.removeEventListener('orientationchange', updateOrientation);
    };
  }, []);

  return orientation;
}

// Hook para detectar se é um dispositivo touch
export function useTouchDevice(): boolean {
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    const checkTouchDevice = () => {
      return (
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        // @ts-ignore
        navigator.msMaxTouchPoints > 0
      );
    };

    setIsTouchDevice(checkTouchDevice());
  }, []);

  return isTouchDevice;
}
