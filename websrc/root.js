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
        // window.addEventListener('keydown', (e) => {
        //     if (e.srcElement.tagName !== "INPUT") {
        //         if (e.key === '1') this.change_content('home');
        //         else if (e.key === '2') this.change_content('list');
        //         else if (e.key === '3') this.change_content('learn');
        //         return false;
        //     }
        // });
    },
    provide() {
        this.change_content = (content) => {
            if (content !== this.current_content) {
                history.pushState({content, current_key: this.current_key}, 'PDict', '/');
                this.current_content = content;
            }
        }
        return {
            show_success_msg: (msg) => {
                Toastify({
                    text: msg,
                    duration: 500,
                    // destination: "https://github.com/apvarun/toastify-js",
                    // newWindow: true,
                    close: false,
                    gravity: "top", // `top` or `bottom`
                    position: "left", // `left`, `center` or `right`
                    stopOnFocus: true, // Prevents dismissing of toast on hover
                    style: {
                        background: "linear-gradient(to right, #00b09b, #96c93d)",
                    },
                    // onClick: function(){} // Callback after click
                }).showToast();
            },
            show_error_msg: (msg) => {
                console.log(msg);
                Toastify({
                    text: msg,
                    duration: -1,
                    // destination: "https://github.com/apvarun/toastify-js",
                    // newWindow: true,
                    close: true,
                    gravity: "top", // `top` or `bottom`
                    position: "left", // `left`, `center` or `right`
                    stopOnFocus: true, // Prevents dismissing of toast on hover
                    style: {
                        background: "linear-gradient(to right, #b0009b, #c9933d)",
                    },
                    // onClick: function(){} // Callback after click
                }).showToast();
            },
            search_key: computed(() => this.current_key),
            change_content: this.change_content,
            set_key: computed(() => (k) => {this.current_key = k;}),
        }
    },
    components: {
        navbar, home, list, learn
    },
    template: `
<div class="h-100 w-100 d-flex flex-column">
    <navbar/>
    <div class="flex-grow-1 h-100 overflow-y-auto pb-2">
        <component :is="current_content"></component>
    </div>
</div>
`
}
