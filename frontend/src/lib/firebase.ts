import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage, deleteToken } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);

export const messaging = typeof window !== "undefined" ? getMessaging(app) : null;

export const requestForToken = async () => {
  if (!messaging) return null;
  
  try {
    // Register Service Worker with versioning to force update
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js?v=1.0');
    
    const currentToken = await getToken(messaging, { 
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration
    });
    
    if (currentToken) {
      return currentToken;
    } else {
      return null;
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
