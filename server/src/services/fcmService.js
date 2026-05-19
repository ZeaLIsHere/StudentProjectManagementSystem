import admin from '../config/firebase.js';

const sendPushNotification = async (fcmToken, title, body, data = {}) => {
  if (!fcmToken) return null;

  try {
    const message = {
      token: fcmToken,
      notification: { title, body },
      data: Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, String(v)])
      ),
      webpush: {
        notification: {
          icon: '/logo-192x192.png',
          badge: '/logo-192x192.png',
        },
      },
    };

    const response = await admin.messaging().send(message);
    return response;
  } catch (error) {
    console.error('FCM send error:', error.message);
    return null;
  }
};

const sendMulticast = async (fcmTokens, title, body, data = {}) => {
  const validTokens = fcmTokens.filter(Boolean);
  if (validTokens.length === 0) return null;

  try {
    const message = {
      tokens: validTokens,
      notification: { title, body },
      data: Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, String(v)])
      ),
      webpush: {
        notification: {
          icon: '/logo-192x192.png',
          badge: '/logo-192x192.png',
        },
      },
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    return response;
  } catch (error) {
    console.error('FCM multicast error:', error.message);
    return null;
  }
};

export { sendPushNotification, sendMulticast };
