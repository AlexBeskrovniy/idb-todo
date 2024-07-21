import { IndexedDBAdapter } from "./idb-adapter.js";

const STORE_NAME = 'todos';

const adapter = new IndexedDBAdapter('todo-app-db');
const db = await adapter.initStore(STORE_NAME, 'created');
customElements.define('todo-list', class extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.$form = this.querySelector('[data-form]');
        this.$mainInput = this.$form.querySelector('[data-input]');
        this.$content = this.querySelector('[data-content]');
        this.$groupTemplate = this.querySelector('[data-group-template]');
        this.$cardTemplate = this.querySelector('[data-card-template]');
        
        this._init();
    }

    async _init() {
        this.db = db;
        console.log('inited');
        this.$form.addEventListener('submit', this._handleSubmit.bind(this));
        this.addEventListener('todos:update', this._renderContent)
        await this._renderContent();
    }

    async _renderContent() {
        try {
            const todos = await adapter.getMany(this.db, STORE_NAME);
            if (todos.lenght === 0) return;

            const sortedTodos = todos.reverse().reduce((acc, cur) => {
                const date = new Date(cur.created).toLocaleDateString();
                if (!acc[date]) {
                    acc[date] = [cur]
                } else {
                    acc[date].push(cur);
                }
                return acc;
            }, {});

            let todoGroupNodes = [];

            for (const [date, todos] of Object.entries(sortedTodos)) {
                const groupNode = this.$groupTemplate.content.cloneNode(true);
                groupNode.querySelector('[data-date]').textContent = new Date(date).toDateString();
                todos.map(todo => {
                    const todoNode = this.$cardTemplate.content.cloneNode(true);
                    todoNode.querySelector('[data-todo]').setAttribute('id', todo.created);
                    todo.done && todoNode.querySelector('[data-todo]').setAttribute('completed', '');
                    todoNode.querySelector('[data-title]').textContent = todo.todo;

                    groupNode.querySelector('[data-group]').appendChild(todoNode);
                });

                todoGroupNodes.push(groupNode);
            }

            this.$content.replaceChildren(...todoGroupNodes);
        } catch(err) {
            console.error(err);
        }
    }

    async _handleSubmit(e) {
        e.preventDefault();
        const formData = new FormData(this.$form);
        const todo = {
            todo: formData.get('todo'),
            done: false,
            created: Date.now()
        }

        try {
            const newTodo = await adapter.addOne(this.db, STORE_NAME, todo);
            console.log(newTodo);
            this._renderContent();
        } catch(err) {
            console.error(err);
        } finally {
            this.$mainInput.value = null;
        }
    }
});

customElements.define('todo-card', class extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.db = db;
        this.$complitedBtn = this.querySelector('[data-complited]');
        this.$editBtn = this.querySelector('[data-edit]');
        this.$deleteBtn = this.querySelector('[data-delete]');

        this._setListeners();
    }

    _setListeners() {
        this.$complitedBtn.addEventListener('click', this._handleComplite.bind(this));
        this.$editBtn.addEventListener('click', this._handleEdit.bind(this));
        this.$deleteBtn.addEventListener('click', this._handleDelete.bind(this));
    }

    async _handleComplite(e) {
        e.preventDefault();
        try {
            const updatedTodo = await adapter.updateOne(this.db, STORE_NAME, this.id, {"done": !this.completed});
            console.log(updatedTodo);
            this._sendUpdateEvent();
        } catch(err) {
            console.error(err);
        }
    }

    _handleEdit(e) {
        e.preventDefault();

    }

    async _handleDelete(e) {
        e.preventDefault();
        try {
            const deletedTodo = await adapter.deleteOne(this.db, STORE_NAME, this.id);
            console.log(deletedTodo);
            this._sendUpdateEvent();
        } catch(err) {
            console.error(err);
        }
    }

    _sendUpdateEvent() {
        this.dispatchEvent(new CustomEvent('todos:update', {
            bubbles: true
        }));
    }

    get id() {
        return +this.getAttribute('id');
    }

    get completed() {
        return this.hasAttribute('completed');
    }
});