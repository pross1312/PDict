import {ref, computed} from "vue";
import navbar from "./nav.js";
import home from "./home.js";
import list from "./list.js";
import learn from "./learn.js";
export default {
    data() {
        let current_content = ref("home");
        let current_key = ref("");
        history.pushState({page: 'home'}, 'PDict', '/');
        window.onpopstate = function(event) {
            if (event.state != null) {
                current_content.value = event.state.content || 'home';
                current_key.value = event.state.current_key;
            }
        }
        return {
            current_content,
            current_key,
        };
    },
    mounted() {
        window.addEventListener('keydown', (e) => {
            if (e.srcElement.tagName.toLowerCase() === 'body') {
                if (e.key === '1') this.change_content('home');
                else if (e.key === '2') this.change_content('list');
                else if (e.key === '3') this.change_content('learn');
                return true;
            }
        });
    },
    provide() {
        this.change_content = (content) => {
            if (content !== this.current_content) {
                history.pushState({content, current_key: this.current_key}, 'PDict', '/');
                this.current_content = content;
            }
        }
        return {
            search_key: computed(() => this.current_key),
            change_content: this.change_content,
            set_key: computed(() => (k) => {this.current_key = k;}),
        }
    },
    components: {
        navbar, home, list, learn
    },
    template: `
<navbar/>
<component :is="current_content"></component>
`
}
