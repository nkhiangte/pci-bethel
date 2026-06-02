import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { db } from '../services/firebase';
import { App as CapApp } from '@capacitor/app';
import { LocalNotifications } from '@capacitor/local-notifications';
import { ArrowUpCircle, X, Download } from 'lucide-react';

// Hardcoded app version info corresponding to the current native build
const CURRENT_VERSION_CODE = 16;
const CURRENT_VERSION_NAME = "1.6";

interface AppUpdateSettings {
  latestVersionCode: number;
  latestVersionName: string;
  updateUrl: string;
  updateMessage: string;
  isUpdateRequired: boolean;
}

const AppUpdateChecker: React.FC = () => {
  const { language } = useLanguage();
  const location = useLocation();
  const [showModal, setShowModal] = useState<boolean>(false);
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
          name: 'App Updates',
          description: 'Notifications for Champhai Bethel App Updates',
          importance: 5,
          visibility: 1,
          vibration: true
        });

        await LocalNotifications.addListener('localNotificationActionPerformed', (notificationAction) => {
          console.log('Notification action performed', notificationAction);
          const playStoreUrl = "https://play.google.com/store/apps/details?id=com.pcibethel.app";
          window.open(playStoreUrl, '_blank', 'noopener,noreferrer');
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

  useEffect(() => {
    // 3. Fetch remote update configurations from Firebase
    if (!db || !db.collection) return;

    // Don't show update prompt if currently inside admin panel
    if (location.pathname.startsWith('/admin')) {
      setShowModal(false);
      return;
    }

    const checkUpdates = async () => {
      try {
        const appUpdateDoc = await db.collection('settings').doc('appUpdate').get();
        if (appUpdateDoc.exists) {
          const data = appUpdateDoc.data() as AppUpdateSettings;
          if (data) {
            setUpdateSettings(data);
            
            // Compare version code or version name
            const needsUpdate = data.latestVersionCode > localVersionCode;
            
            if (needsUpdate) {
              // Show absolute notification prompt inside React layer
              setShowModal(true);

              // Issue system tray notification for native device
              try {
                const perms = await LocalNotifications.checkPermissions();
                let status = perms.display;
                if (status !== 'granted') {
                  const req = await LocalNotifications.requestPermissions();
                  status = req.display;
                }

                if (status === 'granted') {
                  // Cancel any active notification under the same ID to avoid flooding
                  await LocalNotifications.cancel({ notifications: [{ id: 9999 }] });

                  await LocalNotifications.schedule({
                    notifications: [
                      {
                        title: language === 'en' ? 'New App Update Available' : 'App Update Thar A Awm e',
                        body: language === 'en'
                          ? `Version ${data.latestVersionName} is now ready in the Play Store.`
                          : `Version ${data.latestVersionName} hi Play Store-ah hmuh theih a ni tawh e.`,
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
                console.log("System local notification couldn't be triggered:", notifyErr);
              }
            }
          }
        }
      } catch (err) {
        console.error("Failed to check app updates:", err);
      }
    };

    // Delay checking slightly to ensure initialization and avoid initial rendering flicker
    const timer = setTimeout(() => {
      checkUpdates();
    }, 1500);

    return () => clearTimeout(timer);
  }, [localVersionCode, localVersionName, location.pathname, language]);

  if (!showModal || !updateSettings) return null;

  // Handle Play Store redirect
  const handleUpdate = () => {
    const playStoreUrl = updateSettings.updateUrl || "https://play.google.com/store/apps/details?id=com.pcibethel.app";
    window.open(playStoreUrl, '_blank', 'noopener,noreferrer');
  };

  // Multilingual Strings
  const strings = language === 'en' ? {
    title: 'New Update Available',
    subtitle: `Version ${updateSettings.latestVersionName} is now standard in the Play Store.`,
    desc: updateSettings.updateMessage || 'We have introduced several bug fixes, UI adjustments, and scroll reading improvements for a better viewing experience.',
    btnUpdate: 'Update Now',
    btnLater: 'Later',
    currentLabel: 'Your version',
    latestLabel: 'Latest version'
  } : {
    title: 'App Update Thar A Awm e',
    subtitle: `Build thar (Version ${updateSettings.latestVersionName}) hi Play Store-ah hmuh theih a ni tawh e.`,
    desc: updateSettings.updateMessage || 'Thlalak chhiar zawmna, word split chungchang dika rualpui scrolling siamremna te hmuh theih turin i App hi update rawh le.',
    btnUpdate: 'Update Rawh',
    btnLater: 'La Dah Riho',
    currentLabel: 'I version hman lai',
    latestLabel: 'Version thar ber'
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
        
        {/* Colorful top bar styling */}
        <div className="bg-church-600 px-6 py-8 text-white relative flex flex-col items-center text-center">
          {!updateSettings.isUpdateRequired && (
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition text-white"
            >
              <X size={18} />
            </button>
          )}
          <div className="p-3.5 bg-white/10 rounded-full mb-3 ring-4 ring-white/10">
            <ArrowUpCircle className="w-10 h-10 text-white animate-bounce" />
          </div>
          <h2 className="text-xl font-serif font-black tracking-wide leading-tight">{strings.title}</h2>
          <p className="text-white/80 text-xs mt-1.5 font-medium">{strings.subtitle}</p>
        </div>

        {/* Content area */}
        <div className="p-6 space-y-5">
          <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl space-y-1.5">
            <div className="flex justify-between text-xs font-semibold text-slate-500">
              <span>{strings.currentLabel}:</span>
              <span className="font-mono text-slate-700 bg-slate-200 px-2 py-0.5 rounded text-[10px]">{localVersionName} ({localVersionCode})</span>
            </div>
            <div className="flex justify-between text-xs font-semibold text-slate-500">
              <span>{strings.latestLabel}:</span>
              <span className="font-mono text-church-600 bg-church-50 px-2 py-0.5 rounded text-[10px] font-bold">{updateSettings.latestVersionName} ({updateSettings.latestVersionCode})</span>
            </div>
          </div>

          <div className="text-sm text-slate-600 leading-relaxed max-h-36 overflow-y-auto pr-1">
            <p className="whitespace-pre-line text-justify">{strings.desc}</p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-2.5 pt-2">
            <button
              onClick={handleUpdate}
              className="w-full flex items-center justify-center gap-2 bg-church-600 hover:bg-church-700 active:scale-[0.99] text-white font-bold py-3 px-4 rounded-xl transition shadow-md shadow-church-500/10 text-[15px]"
            >
              <Download size={18} />
              {strings.btnUpdate}
            </button>
            
            {!updateSettings.isUpdateRequired && (
              <button
                onClick={() => setShowModal(false)}
                className="w-full py-2.5 text-center text-sm font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
              >
                {strings.btnLater}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AppUpdateChecker;
