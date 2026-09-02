import { Capacitor } from '@capacitor/core';

export const PATHIAN_RAM_WEB_URL = 'https://bethelptr.vercel.app';
export const PATHIAN_RAM_PLAYSTORE_URL = 'https://play.google.com/store/apps/details?id=com.champhaibethel.app';
export const PATHIAN_RAM_PACKAGE_ID = 'com.champhaibethel.app';

/**
 * Checks if the current client is a mobile device or running on Android.
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  if (Capacitor.isNativePlatform()) return true;
  const ua = navigator.userAgent || navigator.vendor || (window as any).opera || '';
  return /android|iphone|ipad|ipod|mobile|blackberry|iemobile|kindle|opera mini/i.test(ua);
}

export function isAndroidDevice(): boolean {
  if (typeof window === 'undefined') return false;
  if (Capacitor.getPlatform() === 'android') return true;
  const ua = navigator.userAgent || navigator.vendor || (window as any).opera || '';
  return /android/i.test(ua);
}

/**
 * Opens the Pathian Ram / Tithe Calculator:
 * - On desktop: Opens the web version directly in a new tab.
 * - On Android/Mobile: Opens Play Store app / Play Store link or triggers appropriate launcher.
 */
export function launchPathianRam(target: 'auto' | 'web' | 'android' = 'auto'): void {
  if (typeof window === 'undefined') return;

  if (target === 'web') {
    window.open(PATHIAN_RAM_WEB_URL, '_blank', 'noopener,noreferrer');
    return;
  }

  if (target === 'android') {
    // If Android market scheme works or direct Play Store URL
    window.open(PATHIAN_RAM_PLAYSTORE_URL, '_blank', 'noopener,noreferrer');
    return;
  }

  // Auto mode:
  if (isAndroidDevice() || isMobileDevice()) {
    // On mobile, open Play Store or Web according to device
    window.open(PATHIAN_RAM_PLAYSTORE_URL, '_blank', 'noopener,noreferrer');
  } else {
    // On desktop, open the web app
    window.open(PATHIAN_RAM_WEB_URL, '_blank', 'noopener,noreferrer');
  }
}
