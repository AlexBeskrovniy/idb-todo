class IndexedDBAdapter {
    constructor(dbName, storeName, idField) {
        this.db = dbName;
        this.storeName = storeName;
        this.storeIdField = idField;
    }
    
    async initStore() {
        return new Promise((resolve, reject) => {
            const connectDB = indexedDB.open(this.db);
        
            connectDB.onupgradeneeded = function() {
                const store = connectDB.result;
                if (!store.objectStoreNames.contains(this.storeName)) {
                    store.createObjectStore(this.storeName, { keyPath: this.storeIdField });
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
    }

    async getOne(db, id, mode='readwrite') {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(this.storeName, mode);
            const store = transaction.objectStore(this.storeName);
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
    }

    async getMany(db, mode='readwrite') {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(this.storeName, mode);
            const store = transaction.objectStore(this.storeName);
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
    }

    async addOne(db, data, mode='readwrite'){
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(this.storeName, mode);
            const store = transaction.objectStore(this.storeName);
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

    async updateOne(db, id, fields, mode='readwrite') {
        const [todo, store] = await this.getOne(db, id);

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
    }

    async deleteOne(db, id, mode='readwrite') {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(this.storeName, mode);
            const store = transaction.objectStore(this.storeName);
            const request = store.delete(id);

            request.onsuccess = function() {
                console.log("Success delete", id);
                resolve(id);
            };

            request.onerror = function(err) {
                console.log("Error", err);
                reject(err)
            };
        });
    }
}

export { IndexedDBAdapter };
