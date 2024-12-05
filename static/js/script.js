import { adapter } from "./idb-adapter.js";

const STORE_NAME = 'todos';

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
        this.$clearButton = this.querySelector('[data-clear]');
        this.$itemsCount = this.querySelector('[data-count]');
        
        this._init();
    }

    async _init() {
        this.addEventListener('todos:update', this._renderContent);
        this.$form.addEventListener('submit', this._handleSubmit.bind(this));
        this.$clearButton.addEventListener('click', this._handleClear.bind(this));
        await this._renderContent();
    }

    async _renderContent() {
        try {
            const todos = await adapter.getAll(STORE_NAME);
            console.log(todos)
            if (todos.length > 0) {
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
                this.$clearButton.removeAttribute('hidden');
            }
        } catch(err) {
            console.error(err);
        } finally {
            const count = await this.count;
            this.$itemsCount.textContent = count;
            if (count === 0) {
                this.$content.innerHTML = '';
            }
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
            const newTodo = await adapter.add(STORE_NAME, todo);
            console.log(newTodo);
            this._renderContent();
        } catch(err) {
            console.error(err);
        } finally {
            this.$mainInput.value = null;
        }
    }

    async _handleClear(e) {
        try {
            await adapter.clear(STORE_NAME);
            this._renderContent();
            this.$clearButton.setAttribute('hidden', '');
            this.$content.replaceChildren('');
        } catch(err) {
            console.error(err);
        }
    }

    get count() {
        return (async () => {
            try {
                return await adapter.count(STORE_NAME);
            } catch(err) {
                console.error(err);
                return 0;
            }
        })();
    }
});

customElements.define('todo-card', class extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.$todo = this.querySelector('[data-title]');
        this.$completedBtn = this.querySelector('[data-completed]');
        this.$deleteBtn = this.querySelector('[data-delete]');

        this._setListeners();
    }

    _setListeners() {
        this.$todo.addEventListener('keypress', this._handleEnterPress.bind(this));
        this.$completedBtn.addEventListener('click', this._handleComplete.bind(this));
        this.$deleteBtn.addEventListener('click', this._handleDelete.bind(this));
    }

    async _handleComplete(e) {
        e.preventDefault();
        try {
            const updatedTodo = await adapter.update(STORE_NAME, {"done": !this.completed}, this.id );
            console.log(updatedTodo);
            this._sendUpdateEvent();
        } catch(err) {
            console.error(err);
        }
    }

    async _handleEnterPress(e) {
        if (e.code !== 'Enter') {
            return;
        }

        e.preventDefault();
        console.log(this.text);
        await this._handleEdit();
    }

    async _handleEdit() {
        try {
            await adapter.update(
                STORE_NAME,
                {"todo": this.text},
                this.id
            );

            this.dispatchEvent(new CustomEvent('todos:update', {
                bubbles: true
            }));

        } catch (err) {
            console.error(err);
        }
    }

    async _handleDelete(e) {
        e.preventDefault();
        try {
            await adapter.delete(STORE_NAME, this.id);
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

    get text() {
        return this.$todo.textContent;
    }

    get completed() {
        return this.hasAttribute('completed');
    }
});