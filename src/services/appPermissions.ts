import { Capacitor } from '@capacitor/core';
import { Camera } from '@capacitor/camera';
import { LocalNotifications } from '@capacitor/local-notifications';

export interface PermissionStatusResult {
  camera: 'granted' | 'denied' | 'prompt' | 'unknown';
  notifications: 'granted' | 'denied' | 'prompt' | 'unknown';
}

/**
 * Check the status of app permissions across Native (Android/iOS) and Web
 */
export async function checkAppPermissions(): Promise<PermissionStatusResult> {
  const result: PermissionStatusResult = {
    camera: 'unknown',
    notifications: 'unknown',
  };

  const isNative = Capacitor.isNativePlatform();

  // Check Camera
  if (isNative) {
    try {
      const cam = await Camera.checkPermissions();
      result.camera = cam.camera === 'granted' ? 'granted' : cam.camera === 'denied' ? 'denied' : 'prompt';
    } catch {
      result.camera = 'unknown';
    }
  } else {
    try {
      if (navigator.permissions && (navigator.permissions as any).query) {
        const queryRes = await navigator.permissions.query({ name: 'camera' as any });
        result.camera = (queryRes.state as any) || 'unknown';
      }
    } catch {
      result.camera = 'unknown';
    }
  }

  // Check Notifications
  if (isNative) {
    try {
      const notif = await LocalNotifications.checkPermissions();
      result.notifications = notif.display === 'granted' ? 'granted' : notif.display === 'denied' ? 'denied' : 'prompt';
    } catch {
      result.notifications = 'unknown';
    }
  } else {
    try {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        result.notifications = Notification.permission === 'granted' ? 'granted' : Notification.permission === 'denied' ? 'denied' : 'prompt';
      }
    } catch {
      result.notifications = 'unknown';
    }
  }

  return result;
}

/**
 * Specifically request camera permission (native Capacitor or web getUserMedia)
 */
export async function requestCameraPermission(): Promise<{ granted: boolean; error?: string }> {
  const isNative = Capacitor.isNativePlatform();

  if (isNative) {
    try {
      const req = await Camera.requestPermissions({ permissions: ['camera'] });
      const granted = req.camera === 'granted';
      return { granted };
    } catch (err: any) {
      console.warn('Native camera permission request error:', err);
      // Fallback to web getUserMedia below if available
    }
  }

  // Web / PWA / Webview fallback
  if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      // Stop stream immediately once permission is verified
      stream.getTracks().forEach((track) => track.stop());
      return { granted: true };
    } catch (err: any) {
      console.warn('Web mediaDevices getUserMedia error:', err);
      return {
        granted: false,
        error: err?.message || 'Camera permission denied or not available',
      };
    }
  }

  return { granted: false, error: 'Camera API not supported on this device/browser' };
}

/**
 * Specifically request notifications permission
 */
export async function requestNotificationPermission(): Promise<{ granted: boolean }> {
  const isNative = Capacitor.isNativePlatform();

  if (isNative) {
    try {
      const req = await LocalNotifications.requestPermissions();
      return { granted: req.display === 'granted' };
    } catch (err) {
      console.warn('Native notifications request error:', err);
    }
  }

  if (typeof window !== 'undefined' && 'Notification' in window) {
    try {
      const res = await Notification.requestPermission();
      return { granted: res === 'granted' };
    } catch (err) {
      console.warn('Web notification request error:', err);
    }
  }

  return { granted: false };
}

/**
 * Triggered on app launch to prompt all necessary permissions (Camera & Notifications)
 * so that when the user opens the app on mobile, permissions are requested upfront.
 */
export async function requestAppStartupPermissions(): Promise<void> {
  const isNative = Capacitor.isNativePlatform();

  // 1. Native Android / iOS permissions
  if (isNative) {
    try {
      // Request Notifications
      const notifStatus = await LocalNotifications.checkPermissions();
      if (notifStatus.display !== 'granted') {
        await LocalNotifications.requestPermissions();
      }
    } catch (e) {
      console.log('Error requesting startup notification permission:', e);
    }

    try {
      // Request Camera
      const camStatus = await Camera.checkPermissions();
      if (camStatus.camera !== 'granted') {
        await Camera.requestPermissions({ permissions: ['camera'] });
      }
    } catch (e) {
      console.log('Error requesting startup camera permission:', e);
    }
  } else {
    // 2. Web / PWA startup check
    const hasPrompted = sessionStorage.getItem('bethel_startup_permissions_prompted');
    if (!hasPrompted) {
      sessionStorage.setItem('bethel_startup_permissions_prompted', 'true');
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
        try {
          await Notification.requestPermission();
        } catch {
          // ignore
        }
      }
    }
  }
}
