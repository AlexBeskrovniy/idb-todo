const _IDBAdapter = Object.freeze({
    initStore: async (dbName, storeName, idField) => {
        return new Promise((resolve, reject) => {
            const connectDB = indexedDB.open(dbName);
        
            connectDB.onupgradeneeded = function() {
                const store = connectDB.result;
                console.log(store);
                if (!store.objectStoreNames.contains(storeName)) {
                    store.createObjectStore(storeName, { keyPath: idField });
                }
                console.log(store);
            }

            connectDB.onsuccess = function() {
                console.log('connected');
                resolve(connectDB.result);
            }

            connectDB.onerror = function(err) {
                reject(err);
            }
        });
    },

    // getStore: async (db, storeName, mode='readwrite') => {
    //     return new Promise((resolve, reject) => {
    //         const transaction = db.transaction(storeName, mode);
    //         const store = transaction.objectStore(storeName);

    //         request.onsuccess = function() {
    //             console.log("Success", request.result);
    //             resolve(store);
    //         };

    //         request.onerror = function(err) {
    //             console.log("Error", err);
    //             reject(err)
    //         };
    //     });
    // },

    getMany: async (db, storeName, mode='readwrite') => {
        console.log(db);
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, mode);
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onsuccess = function() {
                console.log("Success", request.result);
                resolve(request.result);
            };

            request.onerror = function(err) {
                console.log("Error", err);
                reject(err)
            };
        });
    },

    add: async (db, storeName, data, mode='readwrite') => {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, mode);
            const store = transaction.objectStore(storeName);
            const request = store.add(data);

            request.onsuccess = function() {
                console.log("Success", request.result);
                resolve(request.result);
            };

            request.onerror = function(err) {
                console.log("Error", err);
                reject(err)
            };
        });
    }
});

window.IDBAdapter = _IDBAdapter;