import {computed} from "vue";
import navbar from "./nav.js";
import search from "./search-page.js";
export default {
    provide() {
        return {
            open_url(url) {
            },
        }
    },
    components: {
        navbar, search
    },
    template: `
<navbar/>
<search/>
`
}
