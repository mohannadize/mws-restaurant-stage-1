const idb = require("idb");
const dbPromise = idb.open('mws-resturant-pwa', 1, upgradeDB => {
  switch(upgradeDB.oldVersion) {
    case 0:
      upgradeDB.createObjectStore("restaurants",{keyPath:"id"});
      upgradeDB.createObjectStore("to-be-posted",{keyPath:"id",autoIncrement:true});
      break;
  }
});

db = {
  objectStore:"restaurants",
  toBe:"to-be-posted",
  get(key,store = this.objectStore) {
    return dbPromise.then(db => {
      return db.transaction(store)
        .objectStore(store).get(key);
    });
  },
  set(val,store = this.objectStore) {
    return dbPromise.then(db => {
      const tx = db.transaction(store, 'readwrite');
      tx.objectStore(store).put(val);
      return tx.complete;
    });
  },
  delete(key,store = this.objectStore) {
    return dbPromise.then(db => {
      const tx = db.transaction(store, 'readwrite');
      tx.objectStore(store).delete(key);
      return tx.complete;
    });
  },
  clear(store = this.objectStore) {
    return dbPromise.then(db => {
      const tx = db.transaction(store, 'readwrite');
      tx.objectStore(store).clear();
      return tx.complete;
    });
  },
  keys(store = this.objectStore) {
    return dbPromise.then(db => {
      const tx = db.transaction(store);
      const keys = [];
      const store = tx.objectStore(store);

      // This would be store.getAllKeys(), but it isn't supported by Edge or Safari.
      // openKeyCursor isn't supported by Safari, so we fall back
      (store.iterateKeyCursor || store.iterateCursor).call(store, cursor => {
        if (!cursor) return;
        keys.push(cursor.key);
        cursor.continue();
      });

      return tx.complete.then(() => keys);
    });
  },
  getAll(store = this.objectStore) {
    return dbPromise.then(db => {
      return db.transaction(store)
        .objectStore(store).getAll();
    });
  }
};