import input_list from "./input-list.js";
import group_selector from "./group-selector.js";
import {inject, computed, ref} from "vue";
export default {
    setup() {
        const open_url = inject("open_url", (url) => {alert(`Can't open ${url}`)});
        let has_data = ref(false);
        const new_entry = function() {
            this.Keyword = '';
            this.Pronounciation = '';
            this.Definition = [];
            this.Usage = [];
            this.Group = [];
        };
        let all_groups = ref([]);
        fetch("http://localhost:9999/list-group").then(async result => {
            if (result.headers.get("Content-Type").match("application/json") != null) {
                all_groups.value = (await result.json()).Group;
            }
        }).catch(err => {alert(err);});
        let entry_data = ref(new new_entry());
        return {open_url, entry_data, has_data, new_entry, all_groups};
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
            const form_data = new FormData(event.currentTarget);
            let data = new this.new_entry();
            try {
                form_data.forEach((v ,k) => {
                    if (k.endsWith("[]")) {
                        data[k.slice(0, k.length-2)].push(v);
                    } else data[k] = v;
                });
                if (data.Definition.length > 0) {
                    data.Definition = data.Definition.map(x => x.split(",").map(y => y.trim()));
                }
                fetch(update_url, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", },
                    body: JSON.stringify(data),
                }).then(result => {
                    console.log(result.statusText);
                }).catch(err => {alert(err)});
            } catch (err) {
                alert("Invalid data");
                console.log(data, err);
                form_data.forEach((k ,v) => {
                    console.log(k, v);
                });
            }
            event.preventDefault();
            return false;
        },
        search(event) {
            this.has_data = false;
            this.entry_data = new this.new_entry();
            const search_url = "http://localhost:9999/query?key="
            const form_data = new FormData(event.currentTarget);
            const key = form_data.get("key").trim();
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
            event.preventDefault();
            return false;
        },
    },
    template: `
<div class="container-lg mt-5">
    <form action="#" method="GET" class="d-flex" role="search"
          @submit="search($event)"
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
