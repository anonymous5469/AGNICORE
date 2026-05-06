export type DeviceTier = 'high' | 'medium' | 'low';

interface NavigatorWithMemory extends Navigator {
  deviceMemory?: number;
}

export function detectDeviceTier(): DeviceTier {
  const cores = navigator.hardwareConcurrency || 2;
  const memory = (navigator as NavigatorWithMemory).deviceMemory || 4;
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  if (isMobile && (cores < 4 || memory < 4)) return 'low';
  if (cores >= 8 && memory >= 8) return 'high';
  return 'medium';
}

export interface QualitySettings {
  particleCount: number;
  shadows: boolean;
  bloom: boolean;
  pixelRatio: number;
  antialias: boolean;
}

export function getQualitySettings(tier: DeviceTier): QualitySettings {
  switch (tier) {
    case 'high':
      return {
        particleCount: 2000,
        shadows: true,
        bloom: true,
        pixelRatio: Math.min(window.devicePixelRatio, 2),
        antialias: true,
      };
    case 'medium':
      return {
        particleCount: 800,
        shadows: false,
        bloom: true,
        pixelRatio: Math.min(window.devicePixelRatio, 1.5),
        antialias: true,
      };
    case 'low':
      return {
        particleCount: 200,
        shadows: false,
        bloom: false,
        pixelRatio: 1,
        antialias: false,
      };
  }
}
