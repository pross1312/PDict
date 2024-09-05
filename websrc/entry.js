import input_list from "./input-list.js";
import group_selector from "./group-selector.js";
import {ref} from "vue";
export default {
    inject: ["show_success_msg", "show_error_msg"],
    emits: ["entry-removed", "entry-updated"],
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
                this.show_success_msg("Successfully update entry");
                this.$emit("entry-updated");
            }).catch(err => {
                this.show_error_msg(err);
            });
            event.preventDefault();
            event.stopPropagation();
            return true;
        },
        cancel_remove_entry() {
            document.getElementById("confirm-container").classList.add("d-none");
        },
        confirm_remove_entry() {
            if (this.entry_data.Keyword.trim() == "") return;
            fetch(`http://${window.location.host}/list`, {
                method: "DELETE",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify([this.entry_data.Keyword.trim()]),
            }).then(result => {
                console.log(result.statusText);
                document.getElementById("confirm-container").classList.add("d-none");
                this.$emit("entry-removed");
                this.show_success_msg("Successfully remove entry");
            }).catch(err => {
                this.show_error_msg(err);
            });
        },
        remove_entry(e) {
            document.getElementById("confirm-container").classList.remove("d-none");
            e.stopPropagation();
            return true;
        }
    },
    template: `
<div id="confirm-container" class="d-none position-absolute d-flex flex-column justify-content-center"
     style="background-color: #101010bb; z-index: 1000; top: 0px; left: 0px; height: 100vh; width: 100vw;">
     <div class="d-inline-block m-auto bg-body-secondary rounded pt-2 pb-2 p-4"
          style="width: fit-content; height: fit-content;">
         <span class="d-block text-center" style="color: red;">Confirm delete?</span>
         <span class="d-block mt-2">
             <button class="me-2 btn btn-sm btn-primary" @click="confirm_remove_entry()">Confirm</button>
             <button class="ms-2 btn btn-sm btn-secondary" @click="cancel_remove_entry()">Cancel</button>
         </span>
     </div>
</div>
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
