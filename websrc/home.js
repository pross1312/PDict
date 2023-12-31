import {inject, computed, ref} from "vue";
import entry from "./entry.js";
export default {
    setup(props) {
        const change_content = inject("change_content", (url) => {alert(`Can't open ${url}`)});
        let has_data = ref(false);
        let entry_data = ref(new entry.new_entry());
        let search_key = inject("search_key", "");
        return {change_content, entry_data, has_data, search_key};
    },
    mounted() {
        if (this.search_key != null && this.search_key.trim() != "") {
            this.search(this.search_key);
        }
    },
    components: {
        entry
    },
    provide() {
        return {
            DATA: computed(() => this.entry_data),
        };
    },
    methods: {
        search_submit(event) {
            this.search((new FormData(event.currentTarget)).get("key"));
            event.preventDefault();
            return false;
        },
        search(key) {
            this.has_data = false;
            this.entry_data = new entry.new_entry();
            const search_url = "http://localhost:9999/query?key="
            key = key.trim();
            if (key !== "") {
                fetch(search_url + key).then(result => {
                    if (result.status == 404) {
                        this.entry_data.Keyword = key;
                        this.has_data = true;
                    } else if (result.headers.get("Content-Type").match("application/json") != null) {
                        result.json().then(data => {
                            this.entry_data = data;
                            this.entry_data.Definition = data.Definition.map(x => x.join(", "));
                            this.has_data = true;
                        });
                    }
                }).catch(err => {alert(err)});
            }
        },
    },
    template: `
<div class="container-lg mt-5">
    <form action="#" method="GET" class="d-flex" role="search"
          @submit="search_submit($event)"
          target="discard-frame" id="search-form">
        <input class="form-control form-control-lg me-2" type="search" name="key" placeholder="Search" aria-label="Search">
        <button class="btn btn-light" id="search-submit" type="submit" form="search-form">Search</button>
    </form>
    <entry :entry_data="entry_data" :has_data="has_data"/>
</div>
`
}
