importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyDuWnTpPZDolIt20XyB0h9ylWzDCs0H_b4",
  authDomain: "neetaq-54091.firebaseapp.com",
  projectId: "neetaq-54091",
  storageBucket: "neetaq-54091.firebasestorage.app",
  messagingSenderId: "962831721396",
  appId: "1:962831721396:web:99b9ffc5296043dd2b88e1",
  measurementId: "G-BQP5416BDV"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    // icon: '/icon.png' // Icon file is missing
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
