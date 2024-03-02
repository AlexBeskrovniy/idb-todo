const { initStore, getMany, add } = IDBAdapter;

customElements.define('todo-list', class extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.$form = this.querySelector('[data-form]');
        this.$content = this.querySelector('[data-content]');
        
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
            console.log(todos);
            console.log('rendered');
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