import { initializeApp, FirebaseApp } from "firebase/app";
import { getMessaging, getToken, onMessage, deleteToken, Messaging } from "firebase/messaging";

let app: FirebaseApp | null = null;
let messaging: Messaging | null = null;
let storedVapidKey: string | undefined = undefined;

export const initializeFirebase = (config: any) => {
  if (!config || !config.apiKey) {
    console.warn('[Firebase] No config provided');
    return;
  }
  
  if (app) return; // Already initialized

  try {
    app = initializeApp(config);
    if (typeof window !== "undefined") {
      messaging = getMessaging(app);
    }
    // Store VAPID key if provided in config (it might be passed as a separate property or part of the object)
    // We assume the backend sends 'vapidKey' or we look for it in the passed config
    storedVapidKey = config.vapidKey || process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY; 
    
    console.log('[Firebase] Initialized successfully');
  } catch (error) {
    console.error('[Firebase] Initialization failed:', error);
  }
};

export const requestForToken = async () => {
  if (!messaging) {
    console.warn('[Firebase] Messaging not initialized yet');
    return null;
  }
  
  try {
    // Register Service Worker with versioning to force update
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js?v=1.0');
    
    const currentToken = await getToken(messaging, { 
      vapidKey: storedVapidKey,
      serviceWorkerRegistration: registration
    });
    
    if (currentToken) {
      return currentToken;
    } else {
      return null;
    }
  } catch (err) {
    console.error('[Firebase] Error retrieving token:', err);
    return null;
  }
};

// Alias for consistency
export const getFcmToken = requestForToken;

export const onMessageListener = () =>
  new Promise((resolve) => {
    if (!messaging) return;
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });

export const deleteFcmToken = async () => {
  if (!messaging) return false;
  try {
    // We don't need to get the token to delete it, deleteToken handles the current registration
    await deleteToken(messaging);
    return true;
  } catch (err) {
    // Error occurred while deleting token
    return false;
  }
};
