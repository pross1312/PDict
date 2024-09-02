import input_list from "./input-list.js";
import group_selector from "./group-selector.js";
import {ref} from "vue";
export default {
    props: {
        entry_data: {
            type: Object,
            required: true,
        },
        hide_keyword: {
            type: Boolean,
            default: false,
        },
        hide_pronounciation: {
            type: Boolean,
            default: false,
        },
        hide_usage: {
            type: Boolean,
            default: false,
        },
        allow_edit: {
            type: Boolean,
            default: true
        },
        has_data: {
            type: Boolean,
            default: false,
            required: true
        },
    },
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
                entry.Definition = entry.Definition.map(x => x.trim());
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
<div class="container-fluid mt-2" v-if="has_data">
    <form action="/" class="" target="discard-frame"
          @submit="update_data($event)"
          id="data-form" method="GET">
        <input v-bind:style="hide_keyword ? 'visibility: hidden' : ''"
               style="line-height: 1;"
               class="form-control text-light fs-2 shadow-none text-center bg-transparent border-0 pb-0"
               :value="entry_data.Keyword"
               name="Keyword" readonly />
        <input v-bind:style="hide_pronounciation ? 'visibility: hidden' : ''"
               class="bg-transparent border-0 form-control fs-6 text-center m-auto pt-0 mt-1" name="Pronounciation"
               style="width: 40%; line-height: 1; color: #aaaaaa;"
               @keydown.enter="$event.currentTarget.nextSibling.focus()"
               @change="entry_data.Pronounciation = $event.currentTarget.value"
               :value="entry_data.Pronounciation"
               placeholder="-Add pronounciation-" />
        <group_selector form_id="data-form" submit_name="Group" :groups="entry_data.Group" :all_groups="all_groups" :allow_edit="allow_edit"/>
        <input_list form_id="data-form" label="Definition" :items="entry_data.Definition" :allow_edit="allow_edit"/>
        <span v-bind:style="hide_pronounciation ? 'visibility: hidden' : ''">
            <input_list form_id="data-form" label="Usage" :items="entry_data.Usage"
                        :allow_edit="allow_edit"/>
        </span>
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
