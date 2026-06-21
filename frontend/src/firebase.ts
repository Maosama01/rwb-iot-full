import { initializeApp, getApps, getApp } from 'firebase/app';
import { getMessaging, getToken as firebaseGetToken, onMessage, Messaging } from 'firebase/messaging';

// Firebase configuration using environment variables
// It will gracefully fall back if variables are not provided
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Check if basic config is present to avoid initialization errors
const hasConfig = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.messagingSenderId);

let app;
let messaging: Messaging | null = null;

if (hasConfig) {
  try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    messaging = getMessaging(app);
  } catch (error) {
    console.error("Failed to initialize Firebase SDK:", error);
  }
} else {
  console.warn("Firebase config is missing in .env. Push notifications will be disabled in the frontend.");
}

/**
 * Requests permission and returns the FCM device token.
 * Returns null if messaging is not initialized or permission is denied.
 */
export const requestPushToken = async (): Promise<string | null> => {
  if (!messaging) return null;

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await firebaseGetToken(messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY, // Optional: recommended for web push
      });
      return token;
    }
    return null;
  } catch (error) {
    console.error('An error occurred while retrieving token:', error);
    return null;
  }
};

/**
 * Sets up the foreground message listener.
 */
export const onForegroundMessage = (callback: (payload: any) => void) => {
  if (!messaging) return () => {};
  return onMessage(messaging, callback);
};

export { messaging };
