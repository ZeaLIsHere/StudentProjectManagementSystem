import { useEffect } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import firebaseConfig, { isFirebaseConfigured } from '../config/firebase.js';
import api from '../api/axiosInstance.js';
import toast from 'react-hot-toast';

export default function usePushNotifications(user) {
  useEffect(() => {
    if (!user || !isFirebaseConfigured()) return;

    const setup = async () => {
      try {
        const supported = await isSupported();
        if (!supported || !('Notification' in window)) return;

        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;

        const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
        const messaging = getMessaging(app);
        const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;

        const token = await getToken(messaging, vapidKey ? { vapidKey } : undefined);
        if (token) {
          await api.post('/notifications/fcm-token', { token });
        }

        onMessage(messaging, (payload) => {
          const { title, body } = payload.notification || {};
          if (title) toast(body ? `${title}: ${body}` : title);
        });
      } catch (err) {
        console.warn('Push notifications unavailable:', err.message);
      }
    };

    setup();
  }, [user]);
}
