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
        allow_delete: {
            type: Boolean,
            default: true,
        },
        has_data: {
            type: Boolean,
            default: false,
            required: true
        },
    },
    components: {
        input_list, group_selector
    },
    methods: {
        update_data(event) {
            const update_url = `http://${window.location.host}/update`
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
            }).catch(err => {alert(err)});
            event.preventDefault();
            event.stopPropagation();
            return true;
        },
        remove_entry(e) {
            if (this.entry_data.Keyword.trim() == "") return;
            fetch(`http://${window.location.host}/list`, {
                method: "DELETE",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify([this.entry_data.Keyword.trim()]),
            }).then(result => {
                console.log(result.statusText);
                this.$emit("entry-removed");
            }).catch(err => {
                alert(err);
            });
            e.stopPropagation();
            return true;
        }
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
               tabindex="-1"
               name="Keyword" readonly />
        <input v-bind:style="hide_pronounciation ? 'visibility: hidden' : ''"
               class="bg-transparent border-0 form-control fs-6 text-center m-auto pt-0 mt-1" name="Pronounciation"
               style="width: 40%; line-height: 1; color: #aaaaaa;"
               @keydown.enter="$event.currentTarget.nextSibling.focus()"
               @change="entry_data.Pronounciation = $event.currentTarget.value"
               :value="entry_data.Pronounciation"
               placeholder="-Add pronounciation-" />
        <group_selector form_id="data-form" submit_name="Group" :groups="entry_data.Group" :allow_edit="allow_edit"/>
        <input_list form_id="data-form" label="Definition" :items="entry_data.Definition" :allow_edit="allow_edit"/>
        <span v-bind:style="hide_pronounciation ? 'visibility: hidden' : ''">
            <input_list form_id="data-form" label="Usage" :items="entry_data.Usage"
                        :allow_edit="allow_edit"/>
        </span>
    </form>
    <span v-if="allow_edit" class="d-flex w-100 justify-content-end">
        <button v-if="allow_delete" @click="remove_entry($event)" class="btn btn-secondary btn-sm me-3">Remove</button>
        <button @click="update_data($event)" class="btn btn-primary btn-sm">Submit</button>
    </span>
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
