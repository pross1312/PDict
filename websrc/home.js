import input_list from "./input-list.js";
import group_selector from "./group-selector.js";
import {inject, computed, ref} from "vue";
export default {
    props: ["search_key"],
    setup(props) {
        const change_content = inject("change_content", (url) => {alert(`Can't open ${url}`)});
        let has_data = ref(false);
        const new_entry = function() {
            this.Keyword = '';
            this.Pronounciation = '';
            this.Definition = [];
            this.Usage = [];
            this.Group = [];
        };
        let all_groups = ref([]);
        const update_group = function() {
            fetch("http://localhost:9999/list-group").then(async result => {
                if (result.headers.get("Content-Type").match("application/json") != null) {
                    all_groups.value = (await result.json()).Group;
                }
            }).catch(err => {alert(err);});
        }
        update_group();
        let entry_data = ref(new new_entry());
        let search_key = props.search_key;
        return {change_content, entry_data, has_data, new_entry, all_groups, update_group, search_key};
    },
    mounted() {
        if (this.search_key != null && this.search_key.trim() != "") {
            this.search(this.search_key);
        }
    },
    components: {
        input_list, group_selector
    },
    provide() {
        return {
            DATA: computed(() => this.entry_data),
        };
    },
    methods: {
        update_data(event) {
            const update_url = "http://localhost:9999/update"
            if (this.entry_data.Keyword.trim() == "") return;
            let entry = {...this.entry_data};
            if (entry.Definition.length > 0) {
                entry.Definition = entry.Definition.map(x => x.split(",").map(y => y.trim()));
            }
            fetch(update_url, {
                method: "POST",
                headers: { "Content-Type": "application/json", },
                body: JSON.stringify(entry),
            }).then(result => {
                console.log(result.statusText);
                this.update_group();
            }).catch(err => {alert(err)});
            event.preventDefault();
            return false;
        },
        search_submit(event) {
            this.search((new FormData(event.currentTarget)).get("key"));
            event.preventDefault();
            return false;
        },
        search(key) {
            this.has_data = false;
            this.entry_data = new this.new_entry();
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
</div>
<div class="container-lg mt-5" v-if="has_data">
    <form action="/" class="" target="discard-frame"
          @submit="update_data($event)"
          id="data-form" method="GET">
        <input class="form-control text-light fs-1 fw-bolder shadow-none text-center bg-transparent border-0"
               :value="entry_data.Keyword"
               name="Keyword" readonly />
        <input class="bg-transparent border-0 form-control text-center w-25 m-auto" name="Pronounciation"
               :value="entry_data.Pronounciation"
               placeholder="-Add pronounciation-" />
        <group_selector form_id="data-form" submit_name="Group" :groups="entry_data.Group" :all_groups="all_groups" />
        <input_list form_id="data-form" label="Definition" :items="entry_data.Definition"/>
        <input_list form_id="data-form" label="Usage" :items="entry_data.Usage"/>
        <button type="submit" class="d-none"></button>
    </form>
</div>
`
}
