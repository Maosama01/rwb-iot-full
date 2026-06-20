/* global importScripts, firebase */

// Give the service worker access to Firebase Messaging.
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in the
// messagingSenderId.
// Note: In a real app, you can use URL params to pass this config from the window, 
// or hardcode it since the sender ID is public.
// Without Webpack/Vite in the SW, we don't have access to process.env or import.meta.env easily unless injected.
// Since we want this to gracefully not crash if missing, we'll try to pick it up from URL query string
// or hardcoded fallback.

const firebaseConfig = {
  // We only absolutely need messagingSenderId and appId in the SW to receive background messages
  // We'll leave them empty here. The user needs to populate them or use a build step to inject them
  // if they want background notifications to work on the web.
  apiKey: "PLACEHOLDER_API_KEY",
  projectId: "PLACEHOLDER_PROJECT_ID",
  messagingSenderId: "PLACEHOLDER_SENDER_ID",
  appId: "PLACEHOLDER_APP_ID"
};

// Initialize Firebase only if placeholder is replaced
if (firebaseConfig.apiKey !== "PLACEHOLDER_API_KEY") {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    const notificationTitle = payload.notification?.title || 'Rawbin Alert';
    const notificationOptions = {
      body: payload.notification?.body,
      icon: '/vite.svg', // Placeholder icon
      data: payload.data
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
}
