import {computed} from "vue";
import navbar from "./nav.js";
import home from "./home.js";
export default {
    provide() {
        return {
            open_url(url) {
            },
        }
    },
    components: {
        navbar, home
    },
    template: `
<navbar/>
<home/>
`
}
