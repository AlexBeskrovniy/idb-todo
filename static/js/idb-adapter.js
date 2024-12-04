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

            connectDB.onerror = (err) => {
                console.error(err)
                reject(err);
            }
        });
    }

    _promisifiedQuery(queryName, storeName, args) {
        const queryArgs = args || [];

        return new Promise((resolve, reject) => {
            const store = this._getStore(storeName);
            const request = store[queryName](...queryArgs);

            request.addEventListener('success', (e) => resolve(e.target.result));
            request.addEventListener('error', (e) => {
                console.log(e);
                reject(e)
            })
        });
    }

    _getStore(storeName, mode='readwrite') {
        const transaction = this.db.transaction(storeName, mode);
        const store = transaction.objectStore(storeName);

        return store;
    }

    async _getOneWithStore(storeName, key) {
        return new Promise((resolve, reject) => {
            const store = this._getStore(storeName);
            const request = store.get(key);

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

    async getOne(storeName, key) {
        return this._promisifiedQuery('get', storeName, [key]);
        // return new Promise((resolve, reject) => {
        //     const store = this._getStore(storeName);
        //     const request = store.get(id);

        //     request.onsuccess = function() {
        //         console.log("Success", request.result);
        //         resolve(request.result);
        //     };

        //     request.onerror = function(err) {
        //         console.log("Error", err);
        //         reject(err)
        //     };
        // });
    }

    async getMany(storeName) {
        return this._promisifiedQuery('getAll', storeName);
        // return new Promise((resolve, reject) => {
        //     const store = this._getStore(storeName)
        //     const request = store.getAll();

        //     request.onsuccess = function() {
        //         console.log("Success", request.result);
        //         resolve(request.result);
        //     };

        //     request.onerror = function(err) {
        //         console.log("Error", err);
        //         reject(err)
        //     };
        // });
    }

    async addOne(storeName, data, key = undefined){
        return this._promisifiedQuery('add', storeName, [data, key])
        // return new Promise((resolve, reject) => {
        //     const store = this._getStore(storeName)
        //     const request = store.add(data, key);

        //     request.onsuccess = function() {
        //         console.log("Success", request.result);
        //         resolve(request.result);
        //     };

        //     request.onerror = function(err) {
        //         console.log("Error", err);
        //         reject(err)
        //     };
        // });
    }

    async setOne(storeName, data, key) {
        return this._promisifiedQuery('put', storeName, [data, key])
        // return new Promise((resolve, reject) => {
        //     const store = this._getStore(storeName);
        //     const request = store.put(data, id);

        //     request.onsuccess = function() {
        //         console.log("Success", request.result);
        //         resolve(request.result);
        //     };

        //     request.onerror = function(err) {
        //         console.log("Error", err);
        //         reject(err)
        //     };
        // });

    }

    async updateOne(storeName, data, key) {
        const [todo, store] = await this._getOneWithStore(storeName, key);

        for (const [key, value] of Object.entries(data)) {
            todo[key] = value;
        }

        return new Promise((resolve, reject) => {
            const request = store.put(todo);

            request.onsuccess = function() {
                console.log(request);
                console.log("Success update", key);
                resolve(request.result);
            };

            request.onerror = function(err) {
                console.log("Error", err);
                reject(err)
            };
        });
    }

    async deleteOne(storeName, key) {
        return this._promisifiedQuery('delete', storeName, [key])
        // return new Promise((resolve, reject) => {
        //     const store = this._getStore(storeName)
        //     const request = store.delete(id);

        //     request.onsuccess = function() {
        //         console.log("Success delete", id);
        //         resolve(request.result);
        //     };

        //     request.onerror = function(err) {
        //         console.log("Error", err);
        //         reject(err)
        //     };
        // });
    }

    async clearStore(storeName) {
        return this._promisifiedQuery('clear', storeName)
        // return new Promise((resolve, reject) => {
        //     const store = this._getStore(storeName);
        //     const request = store.clear();

        //     request.onsuccess = () => {
        //         console.log("Cleared store");
        //         resolve(true);
        //     }

        //     request.onerror = (err) => {
        //         console.error(err);
        //         reject(err);
        //     }
        // });
    }

    async count(storeName) {
        return this._promisifiedQuery('count', storeName)
        // return new Promise((resolve, reject) => {
        //     const store = this._getStore(storeName);
        //     const request = store.count();

        //     request.onsuccess = () => {
        //         resolve(request.result);
        //     }

        //     request.onerror = (err) => {
        //         console.error(err);
        //         reject(err);
        //     }
        // });
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
