const { initStore, getMany, addOne, updateOne, deleteOne } = IDBAdapter;

const db = await initStore('todo-app-db', 'todos', 'created');
customElements.define('todo-list', class extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.$form = this.querySelector('[data-form]');
        this.$content = this.querySelector('[data-content]');
        this.$groupTemplate = this.querySelector('[data-group-template]');
        this.$cardTemplate = this.querySelector('[data-card-template]');
        
        this._init();
    }

    async _init() {
    
        console.log('inited');
        this.$form.addEventListener('submit', this._handleSubmit.bind(this));
        await this._renderContent();
    }

    async _renderContent() {
        try {
            const todos = await getMany(db, 'todos');
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

                this.$content.appendChild(groupNode);
            }
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
            const newTodo = await addOne(db, 'todos', todo);
            console.log(newTodo);
        } catch(err) {
            console.error(err);
        }
    }
});

customElements.define('todo-card', class extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
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
            const updatedTodo = await updateOne(db, 'todos', this.id, {"done": !this.completed});
            console.log(updatedTodo);
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
            const deletedTodo = await deleteOne(db, 'todos', this.id);
            console.log(deletedTodo);
        } catch(err) {
            console.error(err);
        }
    }

    get id() {
        return +this.getAttribute('id');
    }

    get completed() {
        return this.hasAttribute('completed');
    }
});