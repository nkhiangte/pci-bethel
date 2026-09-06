import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { db } from '../services/firebase';
import { App as CapApp } from '@capacitor/app';
import { LocalNotifications } from '@capacitor/local-notifications';
import { ArrowUpCircle, X, Download, Sparkles, ExternalLink } from 'lucide-react';

// Hardcoded app version info corresponding to the current native build
const CURRENT_VERSION_CODE = 28;
const CURRENT_VERSION_NAME = "2.8";

interface AppUpdateSettings {
  latestVersionCode: number;
  latestVersionName: string;
  updateUrl: string;
  updateMessage: string;
  isUpdateRequired: boolean;
  publishedAt?: string;
}

const AppUpdateChecker: React.FC = () => {
  const { language } = useLanguage();
  const location = useLocation();
  const [showModal, setShowModal] = useState<boolean>(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [updateSettings, setUpdateSettings] = useState<AppUpdateSettings | null>(null);
  
  // Local info retrieved from Capacitor at runtime
  const [localVersionCode, setLocalVersionCode] = useState<number>(CURRENT_VERSION_CODE);
  const [localVersionName, setLocalVersionName] = useState<string>(CURRENT_VERSION_NAME);

  useEffect(() => {
    // 1. Fetch current version dynamically from Capacitor if available
    const fetchLocalAppInfo = async () => {
      try {
        const info = await CapApp.getInfo();
        if (info) {
          if (info.version) {
            setLocalVersionName(info.version);
          }
          if (info.build) {
            const parsedBuild = parseInt(info.build, 10);
            if (!isNaN(parsedBuild)) {
              setLocalVersionCode(parsedBuild);
            }
          }
        }
      } catch (err) {
        console.log("Not running in Capacitor native environment, using code static defaults.");
      }
    };
    fetchLocalAppInfo();
  }, []);

  useEffect(() => {
    // 2. Setup Local Notification Action Listeners
    const setupNotificationListener = async () => {
      try {
        // Register notifications channel for Android 8.0+
        await LocalNotifications.createChannel({
          id: 'app_updates',
          name: 'Play Store App Updates',
          description: 'Notifications for Champhai Bethel App Updates available in Google Play Store',
          importance: 5,
          visibility: 1,
          vibration: true
        });

        await LocalNotifications.addListener('localNotificationActionPerformed', (notificationAction) => {
          console.log('Notification action performed', notificationAction);
          triggerPlayStoreRedirect();
        });
      } catch (err) {
        console.log("LocalNotifications channel/listener setup omitted:", err);
      }
    };
    
    setupNotificationListener();

    return () => {
      try {
        LocalNotifications.removeAllListeners();
      } catch (e) {}
    };
  }, []);

  // Helper to trigger Play Store redirect with fallback
  const triggerPlayStoreRedirect = (customUrl?: string) => {
    const playStoreHttpUrl = customUrl || updateSettings?.updateUrl || "https://play.google.com/store/apps/details?id=com.pcibethel.app";
    const marketUri = "market://details?id=com.pcibethel.app";

    // Attempt to open direct Play Store intent on mobile devices
    try {
      if (/android/i.test(navigator.userAgent)) {
        window.location.href = marketUri;
        // Fallback timer if market:// is not caught
        setTimeout(() => {
          window.open(playStoreHttpUrl, '_blank', 'noopener,noreferrer');
        }, 800);
        return;
      }
    } catch (e) {
      console.log("Direct market URI failed, opening web URL:", e);
    }
    
    window.open(playStoreHttpUrl, '_blank', 'noopener,noreferrer');
  };

  useEffect(() => {
    // 3. Listen to real-time remote update configurations from Firebase
    if (!db || !db.collection) return;

    const unsubscribe = db.collection('settings').doc('appUpdate').onSnapshot(async (doc) => {
      if (!doc.exists) {
        // Fallback to static version.json
        try {
          const res = await fetch(`/version.json?t=${Date.now()}`);
          const vData = await res.json();
          if (vData && vData.version) {
            const remoteVerCode = parseInt(vData.version.replace(/\./g, ''), 10) || 26;
            const fallbackSettings: AppUpdateSettings = {
              latestVersionCode: remoteVerCode,
              latestVersionName: vData.version,
              updateUrl: vData.playStoreUrl || "https://play.google.com/store/apps/details?id=com.pcibethel.app",
              updateMessage: vData.message || "A new version of Bethel Kohhran is available.",
              isUpdateRequired: false
            };
            setUpdateSettings(fallbackSettings);
            if (remoteVerCode > Number(localVersionCode) && !location.pathname.startsWith('/admin') && !isDismissed) {
              setShowModal(true);
            }
          }
        } catch (e) {
          console.log("version.json fallback error:", e);
        }
        return;
      }
      const data = doc.data() as AppUpdateSettings;
      if (!data) return;

      setUpdateSettings(data);

      const needsUpdate = Number(data.latestVersionCode) > Number(localVersionCode);

      if (needsUpdate) {
        // If not dismissed or if update is mandatory, show popup
        if (!isDismissed || data.isUpdateRequired) {
          // Don't show update modal while typing inside admin panel
          if (!location.pathname.startsWith('/admin')) {
            setShowModal(true);
          }
        }

        // Trigger native Local Notification
        try {
          const perms = await LocalNotifications.checkPermissions();
          let status = perms.display;
          if (status !== 'granted') {
            const req = await LocalNotifications.requestPermissions();
            status = req.display;
          }

          if (status === 'granted') {
            await LocalNotifications.cancel({ notifications: [{ id: 9999 }] });
            await LocalNotifications.schedule({
              notifications: [
                {
                  title: language === 'en' ? 'New App Update in Play Store' : 'Play Store-ah App Update Thar A Awm e',
                  body: language === 'en'
                    ? `Version ${data.latestVersionName} is now ready for download. Tap to update!`
                    : `Version ${data.latestVersionName} a chhuak thar e. Hmet la, Play Store-ah update rawh le!`,
                  id: 9999,
                  schedule: { at: new Date(Date.now() + 500) },
                  sound: 'default',
                  channelId: 'app_updates',
                  actionTypeId: 'OPEN_PRODUCT'
                }
              ]
            });
          }
        } catch (notifyErr) {
          console.log("Capacitor local notification:", notifyErr);
        }

        // Trigger Web Notification for Desktop / PWA users if enabled
        try {
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(
              language === 'en' ? 'Champhai Bethel: New Update Available' : 'Champhai Bethel: App Update Thar A Awm',
              {
                body: language === 'en'
                  ? `Version ${data.latestVersionName} is available in Google Play Store.`
                  : `Version ${data.latestVersionName} hi Play Store-ah update theih a ni tawh e.`,
                icon: 'https://i.ibb.co/mVw3Ftpw/PCI-logo.png'
              }
            );
          } else if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
          }
        } catch (e) {}
      } else {
        setShowModal(false);
      }
    }, (err) => {
      console.error("Failed to subscribe to app updates:", err);
    });

    return () => unsubscribe();
  }, [localVersionCode, localVersionName, location.pathname, language, isDismissed]);

  const hasUpdate = updateSettings && Number(updateSettings.latestVersionCode) > Number(localVersionCode);

  // Multilingual Strings
  const strings = language === 'en' ? {
    title: 'New Update Available',
    subtitle: `Version ${updateSettings?.latestVersionName || ''} is ready on Google Play Store`,
    desc: updateSettings?.updateMessage || 'We have introduced several bug fixes, UI adjustments, and scroll reading improvements for a better viewing experience.',
    btnUpdate: 'Update in Play Store',
    btnLater: 'Later',
    currentLabel: 'Your version',
    latestLabel: 'Latest version',
    floatingNotice: 'New Update in Play Store',
    floatingAction: 'Update'
  } : {
    title: 'Play Store-ah Update Thar A Awm',
    subtitle: `Version ${updateSettings?.latestVersionName || ''} hi Play Store-ah hmuh theih a ni tawh e`,
    desc: updateSettings?.updateMessage || 'Thuziak chhiar nuam zawk te, thlalak leh hriattirna siamthatna te hmuh theih turin i App hi Play Store atangin update rawh le.',
    btnUpdate: 'Play Store-ah Update Rawh',
    btnLater: 'La Dah Riho',
    currentLabel: 'I version hman lai',
    latestLabel: 'Version thar ber',
    floatingNotice: 'Update Thar A Awm',
    floatingAction: 'Update Rawh'
  };

  const handleDismiss = () => {
    setShowModal(false);
    setIsDismissed(true);
  };

  return (
    <>
      {/* Floating Persistent Pill when dismissed & update is available */}
      {hasUpdate && !showModal && !location.pathname.startsWith('/admin') && (
        <div className="fixed bottom-5 right-5 z-40 animate-fade-in">
          <div className="bg-church-900/95 backdrop-blur-md text-white border border-church-700 shadow-2xl rounded-2xl p-3 sm:px-4 sm:py-3 flex items-center gap-3 ring-1 ring-white/10 max-w-xs sm:max-w-sm">
            <div className="p-2 bg-church-600 rounded-xl flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
            </div>
            <div className="text-left flex-1 min-w-0">
              <div className="text-xs font-black tracking-wide text-white truncate">{strings.floatingNotice}</div>
              <div className="text-[11px] text-church-200">v{updateSettings.latestVersionName} (Play Store)</div>
            </div>
            <button
              onClick={() => triggerPlayStoreRedirect()}
              className="bg-amber-500 hover:bg-amber-600 active:scale-95 text-church-950 font-black text-xs px-3 py-2 rounded-xl transition flex items-center gap-1 shrink-0 shadow-sm"
            >
              <Download size={13} />
              {strings.floatingAction}
            </button>
            <button
              onClick={() => setIsDismissed(true)}
              className="text-slate-400 hover:text-white p-1"
              title="Close badge"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Main Update Modal Dialog */}
      {showModal && updateSettings && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
            
            {/* Top header bar styling */}
            <div className="bg-gradient-to-r from-church-700 to-church-600 px-6 py-8 text-white relative flex flex-col items-center text-center">
              {!updateSettings.isUpdateRequired && (
                <button 
                  onClick={handleDismiss}
                  className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition text-white"
                >
                  <X size={18} />
                </button>
              )}
              <div className="p-3.5 bg-white/10 rounded-full mb-3 ring-4 ring-white/10">
                <ArrowUpCircle className="w-10 h-10 text-amber-300 animate-bounce" />
              </div>
              <h2 className="text-xl font-serif font-black tracking-wide leading-tight">{strings.title}</h2>
              <p className="text-white/85 text-xs mt-1.5 font-medium">{strings.subtitle}</p>
            </div>

            {/* Content area */}
            <div className="p-6 space-y-5">
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-slate-500">
                  <span>{strings.currentLabel}:</span>
                  <span className="font-mono text-slate-700 bg-slate-200 px-2 py-0.5 rounded text-[10px]">
                    v{localVersionName} (Build {localVersionCode})
                  </span>
                </div>
                <div className="flex justify-between text-xs font-semibold text-slate-500">
                  <span>{strings.latestLabel}:</span>
                  <span className="font-mono text-church-700 bg-church-50 border border-church-200 px-2 py-0.5 rounded text-[10px] font-bold">
                    v{updateSettings.latestVersionName} (Build {updateSettings.latestVersionCode})
                  </span>
                </div>
              </div>

              <div className="text-sm text-slate-600 leading-relaxed max-h-36 overflow-y-auto pr-1">
                <p className="whitespace-pre-line text-justify">{strings.desc}</p>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col gap-2.5 pt-2">
                <button
                  onClick={() => triggerPlayStoreRedirect()}
                  className="w-full flex items-center justify-center gap-2 bg-church-600 hover:bg-church-700 active:scale-[0.99] text-white font-bold py-3.5 px-4 rounded-xl transition shadow-md shadow-church-500/20 text-[15px]"
                >
                  <Download size={18} />
                  {strings.btnUpdate}
                  <ExternalLink size={14} className="opacity-70" />
                </button>
                
                {!updateSettings.isUpdateRequired && (
                  <button
                    onClick={handleDismiss}
                    className="w-full py-2.5 text-center text-sm font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
                  >
                    {strings.btnLater}
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
};

export default AppUpdateChecker;

