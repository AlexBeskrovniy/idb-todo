const storesConfig = Object.freeze({
    stores: [
        {
            name: 'todos',
            keyPath: 'created'
        },
        {
            name: 'primitives',
            keyPath: null
        }
    ],
    version: 1
});

class IndexedDBAdapter {
    constructor(dbName, storesConfig) {
        if (IndexedDBAdapter._instance) {
            console.warn("IndexedDBAdapter instance already exists.");
            return IndexedDBAdapter._instance;
        }

        IndexedDBAdapter._instance = this;
        
        this.dbName = dbName;
        this.config = storesConfig;
    }
    
    init() {
        return new Promise((resolve, reject) => {
            const connectDB = indexedDB.open(this.dbName, this.config.version);
        
            connectDB.onupgradeneeded = () => {
                const db = connectDB.result;
                this.config.stores.forEach((store) => {
                    if (!db.objectStoreNames.contains(store.name)) {
                        db.createObjectStore(store.name, { keyPath: store.keyPath });
                    }
                })
            }

            connectDB.onsuccess = () => {
                console.log('connected');
                this.db = connectDB.result;
                resolve(connectDB.result);
            }

            connectDB.onerror = function(err) {
                reject(err);
            }
        });
    }

    _getTransaction(storeName, mode='readwrite') {
        const transaction = this.db.transaction(storeName, mode);
        const store = transaction.objectStore(storeName);

        return store;
    }

    async getOne(storeName, id) {
        return new Promise((resolve, reject) => {
            const store = this._getTransaction(storeName);
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

    async getMany(storeName) {
        return new Promise((resolve, reject) => {
            const store = this._getTransaction(storeName)
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

    async addOne(storeName, data){
        return new Promise((resolve, reject) => {
            const store = this._getTransaction(storeName)
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

    async updateOne(storeName, id, fields) {
        const [todo, store] = await this.getOne(storeName, id);

        for (const [key, value] of Object.entries(fields)) {
            todo[key] = value;
        }

        return new Promise((resolve, reject) => {
            const request = store.put(todo);

            request.onsuccess = function() {
                console.log(request);
                console.log("Success update", id);
                resolve(request.result);
            };

            request.onerror = function(err) {
                console.log("Error", err);
                reject(err)
            };
        });
    }

    async deleteOne(storeName, id) {
        return new Promise((resolve, reject) => {
            const store = this._getTransaction(storeName)
            const request = store.delete(id);

            request.onsuccess = function() {
                console.log("Success delete", id);
                resolve(request.result);
            };

            request.onerror = function(err) {
                console.log("Error", err);
                reject(err)
            };
        });
    }

    get db() {
        return this._db
    }

    set db(value) {
        this._db = value;
    }
}

const adapter = new IndexedDBAdapter('todo-app-db', storesConfig);
await adapter.init();

export { adapter };
