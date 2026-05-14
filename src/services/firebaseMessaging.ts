const FIREBASE_MESSAGING_SW = "/firebase-messaging-sw.js";

const getFirebaseConfig = () => {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  const messagingSenderId =
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;

  if (
    !apiKey ||
    !authDomain ||
    !projectId ||
    !storageBucket ||
    !messagingSenderId ||
    !appId
  ) {
    return null;
  }

  return {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
  };
};

const isClient = () => typeof window !== "undefined";

export async function getFirebaseMessagingToken(requestPermission = true) {
  if (
    !isClient() ||
    !("Notification" in window) ||
    !("serviceWorker" in navigator)
  ) {
    return null;
  }

  const firebaseConfig = getFirebaseConfig();
  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

  if (!firebaseConfig || !vapidKey) {
    return null;
  }

  const [{ initializeApp, getApps }, { getMessaging, getToken, isSupported }] =
    await Promise.all([import("firebase/app"), import("firebase/messaging")]);

  const supported = await isSupported();
  if (!supported) return null;

  const permission =
    Notification.permission === "granted"
      ? "granted"
      : requestPermission
        ? await Notification.requestPermission()
        : Notification.permission;

  if (permission !== "granted") return null;

  const app = getApps()[0] ?? initializeApp(firebaseConfig);
  const messaging = getMessaging(app);

  const registration = await navigator.serviceWorker.register(
    FIREBASE_MESSAGING_SW,
  );

  const token = await getToken(messaging, {
    vapidKey,
    serviceWorkerRegistration: registration,
  });

  if (token) {
    localStorage.setItem("firebaseMessagingToken", token);
  }

  return token || null;
}

export async function subscribeToForegroundMessages(
  onPayload: (payload: any) => void,
) {
  if (!isClient()) return () => {};

  const firebaseConfig = getFirebaseConfig();
  if (!firebaseConfig) return () => {};

  const [{ initializeApp, getApps }, { getMessaging, onMessage, isSupported }] =
    await Promise.all([import("firebase/app"), import("firebase/messaging")]);

  const supported = await isSupported();
  if (!supported) return () => {};

  const app = getApps()[0] ?? initializeApp(firebaseConfig);
  const messaging = getMessaging(app);
  return onMessage(messaging, onPayload);
}
