import { openDB } from 'idb';

const DB_NAME = 'spms-offline';
const DB_VERSION = 1;

const getDB = () =>
  openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('projects')) {
        db.createObjectStore('projects', { keyPath: '_id' });
      }
      if (!db.objectStoreNames.contains('tasks')) {
        db.createObjectStore('tasks', { keyPath: '_id' });
      }
      if (!db.objectStoreNames.contains('outbox')) {
        db.createObjectStore('outbox', { keyPath: 'id', autoIncrement: true });
      }
    },
  });

const offlineStorage = {
  async getAll(storeName) {
    const db = await getDB();
    return db.getAll(storeName);
  },

  async get(storeName, key) {
    const db = await getDB();
    return db.get(storeName, key);
  },

  async put(storeName, value) {
    const db = await getDB();
    return db.put(storeName, value);
  },

  async delete(storeName, key) {
    const db = await getDB();
    return db.delete(storeName, key);
  },

  async clear(storeName) {
    const db = await getDB();
    return db.clear(storeName);
  },

  async addToOutbox(action) {
    const db = await getDB();
    return db.add('outbox', {
      ...action,
      timestamp: Date.now(),
    });
  },

  async getOutboxItems() {
    const db = await getDB();
    return db.getAll('outbox');
  },

  async removeFromOutbox(id) {
    const db = await getDB();
    return db.delete('outbox', id);
  },

  async clearOutbox() {
    const db = await getDB();
    return db.clear('outbox');
  },
};

export default offlineStorage;
