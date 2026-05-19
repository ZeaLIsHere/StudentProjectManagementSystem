import api from '../api/axiosInstance.js';
import offlineStorage from './offlineStorage.js';

const syncManager = {
  async processOutbox() {
    const items = await offlineStorage.getOutboxItems();
    if (items.length === 0) return;

    for (const item of items) {
      try {
        await api({
          method: item.method,
          url: item.url,
          data: item.data,
        });
        await offlineStorage.removeFromOutbox(item.id);
      } catch (error) {
        if (error.response && error.response.status < 500) {
          await offlineStorage.removeFromOutbox(item.id);
        }
      }
    }
  },

  async queueAction(method, url, data) {
    await offlineStorage.addToOutbox({ method, url, data });

    if (navigator.onLine) {
      await this.processOutbox();
    }
  },

  startListening() {
    window.addEventListener('online', () => {
      this.processOutbox();
    });
  },
};

export default syncManager;
