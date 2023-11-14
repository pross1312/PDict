import input_list from "./input-list.js";
import group_selector from "./group-selector.js";
import {ref} from "vue";
export default {
    props: ["entry_data", "has_data", "hide_keyword"],
    setup() {
        let all_groups = ref([]);
        const update_group = function() {
            fetch("http://localhost:9999/list-group").then(async result => {
                if (result.headers.get("Content-Type").match("application/json") != null) {
                    all_groups.value = (await result.json()).Group;
                }
            }).catch(err => {alert(err);});
        }
        update_group();
        return {all_groups, update_group};
    },
    components: {
        input_list, group_selector
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
    },
    template: `
<div class="container-lg mt-5" v-if="has_data">
    <form action="/" class="" target="discard-frame"
          @submit="update_data($event)"
          id="data-form" method="GET">
        <input class="form-control text-light fs-1 fw-bolder shadow-none text-center bg-transparent border-0"
               v-if="!hide_keyword"
               :value="entry_data.Keyword"
               name="Keyword" readonly />
        <input class="bg-transparent border-0 form-control fs-4 text-center m-auto" name="Pronounciation"
               style="width: 40%;"
               @keydown.enter="$event.currentTarget.nextSibling.focus()"
               @change="entry_data.Pronounciation = $event.currentTarget.value"
               :value="entry_data.Pronounciation"
               placeholder="-Add pronounciation-" />
        <group_selector form_id="data-form" submit_name="Group" :groups="entry_data.Group" :all_groups="all_groups" />
        <input_list form_id="data-form" label="Definition" :items="entry_data.Definition"/>
        <input_list form_id="data-form" label="Usage" :items="entry_data.Usage"/>
        <button type="submit" class="d-none"></button>
    </form>
</div>
`,
    new_entry: function() {
        this.Keyword = '';
        this.Pronounciation = '';
        this.Definition = [];
        this.Usage = [];
        this.Group = [];
    },
}
