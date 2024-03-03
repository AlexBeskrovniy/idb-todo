const { initStore, getMany, add } = IDBAdapter;

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
        this.db = await initStore('todo-app-db', 'todos', 'created');
        console.log('inited');
        this.$form.addEventListener('submit', this._handleSubmit.bind(this));
        await this._renderContent();
    }

    async _renderContent() {
        try {
            const todos = await getMany(this.db, 'todos');
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
            const newTodo = await add(this.db, 'todos', todo);
            console.log(newTodo);
        } catch(err) {
            console.error(err);
        }
    }

    disconnectedCallback() {

    }
});