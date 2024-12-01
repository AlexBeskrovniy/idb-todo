import { adapter } from "./idb-adapter.js";

const STORE_NAME = 'primitives';
const STORE_KEY = 'counter';

customElements.define('test-counter', class extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.$dec = this.querySelector('[data-dec]');
        this.$inc = this.querySelector('[data-inc]');
        this.$value = this.querySelector('[data-value]');

        this._init();
    }

    async _init() {
        const initValueFromDB = await adapter.getOne(STORE_NAME, STORE_KEY);
        console.log(initValueFromDB)
        this.value = typeof initValueFromDB === 'number' ? initValueFromDB : 0;
        this.$value.textContent = this.value;

        this.$dec.addEventListener('click', (e) => {
            e.preventDefault();
            this.value = this.value - 1;
            adapter.setOne(STORE_NAME, this.value, STORE_KEY);
            this.$value.textContent = this.value;
        } );

        this.$inc.addEventListener('click', (e) => {
            e.preventDefault();
            this.value = this.value + 1;
            adapter.setOne(STORE_NAME, this.value, STORE_KEY);
            this.$value.textContent = this.value;
        } );
    }
})