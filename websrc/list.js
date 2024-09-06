import {ref} from "vue";
import group_filter from "./group-filter.js"
export default {
    inject: ["set_key", "change_content", "show_error_msg", "show_success_msg"],
    setup(props) {
        let keywords = ref([]);
        let to_be_removed = "";
        const element_width = 190;
        const per_row = Math.max((window.innerWidth/element_width) >> 0, 2);
        let has_data = ref(false);
        fetch(`http://${window.location.host}/list`).then(async result => {
            if (result.headers.get("Content-Type").match("application/json") != null) {
                let items = await result.json();
                keywords.value.push(...items);
                has_data.value = true;
            }
        }).catch(err => this.show_error_msg(err));
        return {has_data, keywords, per_row, to_be_removed, element_width, is_filtering: ref(false)};
    },
    methods: {
        on_filter_change(filters) {
            const param_filters = {
                Include: Object.entries(filters).filter(([_name, mode]) => mode === '+').map(([name, _mode]) => name),
                Exclude: Object.entries(filters).filter(([_name, mode]) => mode === '-').map(([name, _mode]) => name),
            };
            const params = JSON.stringify(param_filters)
            this.has_data = false;
            fetch(`http://${window.location.host}/list?filter=${params}`).then(async result => {
                if (result.headers.get("Content-Type").match("application/json") != null) {
                    let items = await result.json() || [];
                    console.log("All words: ", items);
                    this.keywords = items;
                    this.has_data = true;
                    this.show_success_msg("Successfully applied filter")
                }
            }).catch(err => {this.show_error_msg(err);});
        },
        cancel_remove_key() {
            document.getElementById("confirm-container").classList.add("d-none");
        },
        confirm_remove_key() {
            let key = this.to_be_removed.trim();
            fetch(`http://${window.location.host}/list`, {
                method: "DELETE",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify([key]),
            }).then(result => {
                console.log(result.statusText);
                let index = this.keywords.indexOf(key);
                if (index != -1) this.keywords.splice(index, 1);
                document.getElementById("confirm-container").classList.add("d-none");
                this.show_success_msg("Successfully remove entry");
                this.$refs.group_filterer.fetch_all_groups();
            }).catch(err => {
                this.show_error_msg(err);
            });
        },
        remove_key(key) {
            this.to_be_removed = key;
            document.getElementById("confirm-container").classList.remove("d-none");
        },
    },
    components: {
        group_filter,
    },
    template: `
<div id="confirm-container" class="d-none position-absolute d-flex flex-column justify-content-center"
     style="background-color: #101010bb; z-index: 1000; top: 0px; left: 0px; height: 100vh; width: 100vw;">
     <div class="d-inline-block m-auto bg-body-secondary rounded pt-2 pb-2 p-4"
          style="width: fit-content; height: fit-content;">
         <span class="d-block text-center" style="color: red;">Confirm delete?</span>
         <span class="d-block mt-2">
             <button class="me-2 btn btn-sm btn-primary" @click="confirm_remove_key()">Confirm</button>
             <button class="ms-2 btn btn-sm btn-secondary" @click="cancel_remove_key()">Cancel</button>
         </span>
     </div>
</div>
<div class="d-flex h-100 w-100">
    <group_filter ref="group_filterer" :show="is_filtering" @filter-changed="on_filter_change"/>
    <div v-if="has_data" class="flex-grow-1 m-0 p-0 border-0 d-flex flex-column"
         style="overflow-y: hidden !important">
        <button class="position-absolute z-1 rounded-0 flex-grow-0 btn btn-sm m-0"
                @mousedown.left="is_filtering = !is_filtering"
                style="background-color: #20202099; color: yellow; height: fit-content;">
                {{!is_filtering ? '► ' : '◄ '}} Filter
        </button>
        <div class="container-fluid flex-grow-1 pb-0" style="margin-top: 1em; overflow-x: hidden !important">
            <div v-for="(_, row) in Number((keywords.length/per_row) >> 0) + 1"
                 class="row d-flex flex gx-5 mt-3">
                <div v-for="(_, col) in per_row" :class="['col-' + ((12/per_row)>>0)]"
                     class="d-flex col">
                    <span v-if="row*per_row + Number(col) < keywords.length" class="h-100 d-flex flex-grow-1">
                        <span class="d-flex flex-column h-100 justify-content-center bg-body-secondary"
                              style="width: fit-content;">
                            <button class="btn-close d-inline"
                                    @mousedown.left="remove_key(keywords[row*per_row  + Number(col)])"></button>
                        </span>
                        <button class="pt-1 pb-1 btn btn-sm btn-secondary rounded-0 text-wrap"
                                @mousedown.left="set_key(keywords[row*per_row + Number(col)]); change_content('home')">
                            {{keywords[row*per_row + Number(col)]}}
                        </button>
                    </span>
                </div>
            </div>
        </div>
    </div>
</div>
`
}
