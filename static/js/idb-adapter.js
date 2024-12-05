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

            connectDB.onerror = (e) => {
                console.error(e.target.error)
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
                console.error("Error", e.target.error);
                reject(e.target.error)
            })
        });
    }

    _getStore(storeName, mode='readwrite') {
        const transaction = this.db.transaction(storeName, mode);
        const store = transaction.objectStore(storeName);

        return store;
    }

    async get(storeName, key) {
        return this._promisifiedQuery('get', storeName, [key]);
    }

    async getAll(storeName) {
        return this._promisifiedQuery('getAll', storeName);
    }

    async add(storeName, data, key = undefined){
        return this._promisifiedQuery('add', storeName, [data, key])
    }

    async set(storeName, data, key) {
        return this._promisifiedQuery('put', storeName, [data, key])
    }

    async delete(storeName, key) {
        return this._promisifiedQuery('delete', storeName, [key])
    }

    async clear(storeName) {
        return this._promisifiedQuery('clear', storeName)
    }

    async count(storeName) {
        return this._promisifiedQuery('count', storeName)
    }

    async update(storeName, data, key) {
        const [item, store] = await this._getOneWithStore(storeName, key);

        for (const [key, value] of Object.entries(data)) {
            item[key] = value;
        }

        return new Promise((resolve, reject) => {
            const request = store.put(item);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = (e) => {
                console.error("Error", e.target.error);
                reject(e.target.error)
            };
        });
    }

    async _getOneWithStore(storeName, key) {
        return new Promise((resolve, reject) => {
            const store = this._getStore(storeName);
            const request = store.get(key);

            request.onsuccess = () => {
                console.log("Success", request.result);
                resolve([request.result, store]);
            };

            request.onerror = (e) => {
                console.log("Error", e.target.error);
                reject(e.target.error)
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
