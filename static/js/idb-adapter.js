class IndexedDBAdapter {
    constructor(dbName) {
        if (IndexedDBAdapter._instance) {
            console.warn("IndexedDBAdapter instance already exists.");
            return IndexedDBAdapter._instance;
        }

        IndexedDBAdapter._instance = this;
        
        this.dbName = dbName;
    }
    
    async initStore(storeName, storeIdField) {
        return new Promise((resolve, reject) => {
            const connectDB = indexedDB.open(this.dbName);
        
            connectDB.onupgradeneeded = function() {
                const db = connectDB.result;
                if (!db.objectStoreNames.contains(storeName)) {
                    db.createObjectStore(storeName, { keyPath: storeIdField });
                }
                console.log(db);
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

    _getTransaction(db, storeName, mode='readwrite') {
        const transaction = db.transaction(storeName, mode);
        const store = transaction.objectStore(storeName);

        return store;
    }

    async getOne(db, storeName, id) {
        return new Promise((resolve, reject) => {
            const store = this._getTransaction(db, storeName)
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

    async getMany(db, storeName) {
        return new Promise((resolve, reject) => {
            const store = this._getTransaction(db, storeName)
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

    async addOne(db, storeName, data){
        return new Promise((resolve, reject) => {
            const store = this._getTransaction(db, storeName)
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

    async updateOne(db, storeName, id, fields) {
        const [todo, store] = await this.getOne(db, storeName, id);

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

    async deleteOne(db, storeName, id) {
        return new Promise((resolve, reject) => {
            const store = this._getTransaction(db, storeName)
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
