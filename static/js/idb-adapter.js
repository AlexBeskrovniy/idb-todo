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

    getOne: async (db, storeName, id, mode='readwrite') => {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, mode);
            const store = transaction.objectStore(storeName);
            const request = store.get(id);

            request.onsuccess = function() {
                console.log("Success", request.result);
                resolve([request.result, store]);
            };

            request.onerror = function(err) {
                console.log("Error", err);
                reject(err)
            };
        });
    },

    getMany: async (db, storeName, mode='readwrite') => {
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

    addOne: async (db, storeName, data, mode='readwrite') => {
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
    },
    
    updateOne: async (db, storeName, id, fields, mode='readwrite') => {
            const [todo, store] = await _IDBAdapter.getOne(db, storeName, id);

            for (const [key, value] of Object.entries(fields)) {
                todo[key] = value;
            }

            return new Promise((resolve, reject) => {
                const request = store.put(todo);

                request.onsuccess = function() {
                    console.log(request);
                    console.log("Success update", id);
                    resolve(id);
                };

                request.onerror = function(err) {
                    console.log("Error", err);
                    reject(err)
                };
            });
    },

    deleteOne: async (db, storeName, id, mode='readwrite') => {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, mode);
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);

            request.onsuccess = function() {
                console.log(request);
                console.log("Success delete", id);
                resolve(id);
            };

            request.onerror = function(err) {
                console.log("Error", err);
                reject(err)
            };
        });
    }
});

window.IDBAdapter = _IDBAdapter;