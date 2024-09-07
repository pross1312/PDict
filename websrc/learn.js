import entry from "./entry.js"
import group_filter from "./group-filter.js"
import {ref} from "vue"
export default {
    inject: ["set_key", "change_content", "show_error_msg", "show_success_msg"],
    setup() {
        let all_groups = ref([]);
        let fetch_groups = () => {
            fetch(`http://${window.location.host}/list-group`).then(async result => {
                if (result.headers.get("Content-Type").match("application/json") != null) {
                    all_groups.value = (await result.json()).Group;
                }
            }).catch(err => alert(err));
        };
        fetch_groups();
        return {all_groups, fetch_groups, is_filtering: ref(false)};
    },
    data() {
        return {
            entry: new entry.new_entry(),
            show_answer: false,
            keyword: "",
        }
    },
    components: {
        entry, group_filter
    },
    mounted() {
        window.onkeydown = async (e) => {
            if (e.key === " ") {
                if (this.show_answer) await this.next_word();
                this.show_answer = !this.show_answer;
                e.stopPropagation();
                return true;
            }
        };
        const param_filters = {
            Include: [],
            Exclude: [],
        };
        const params = JSON.stringify(param_filters)
        fetch(`http://${window.location.host}/change-learn-filter?filter=${params}`).then(async result => {
            console.log(await result.text());
            await this.next_word();
        });
    },
    methods: {
        on_filter_change(filters) {
            const param_filters = {
                Include: Object.entries(filters).filter(([_name, mode]) => mode === '+').map(([name, _mode]) => name),
                Exclude: Object.entries(filters).filter(([_name, mode]) => mode === '-').map(([name, _mode]) => name),
            };
            const params = JSON.stringify(param_filters)
            fetch(`http://${window.location.host}/change-learn-filter?filter=${params}`).then(async result => {
                console.log(await result.text());
                await this.next_word();
                this.show_success_msg("Successfully applied filter")
            }).catch(err => {
                this.show_error_msg(err);
            });
        },
        async mouse_down_left(e) {
            if (e.currentTarget === e.srcElement && e.button == 0) {
                if (this.show_answer) await this.next_word();
                this.show_answer = !this.show_answer;
                e.stopPropagation();
                return true;
            }
        },
        async next_word() {
            const server_nextword_addr   = `http://${window.location.host}/nextword`;
            await fetch(server_nextword_addr).then(async result => {
                if (result.headers.get("Content-Type").includes("application/json")) {
                    let data = await result.json();
                    data.Definition = data.Definition;
                    this.entry = data;
                    this.keyword = data.Keyword;
                } else {
                    this.keyword = "No word to learn";
                    this.entry = null;
                }
            }).catch(err => {
                this.show_error_msg(err);
            });
        }
    },
    template: `
<div @mousedown.left="mouse_down_left($event)" class="w-100 h-100">
<div class="d-flex h-100 w-100">
<group_filter :show="is_filtering" @filter-changed="on_filter_change"/>
<div class="flex-grow-1 d-flex justify-content-start w-100" style="height: fit-content">
    <button class="position-absolute z-1 rounded-0 flex-grow-0 btn btn-sm m-0"
            @mousedown.left="is_filtering = !is_filtering"
            style="background-color: #20202099; color: yellow; height: fit-content;">
            {{!is_filtering ? '► ' : '◄ '}} Filter
    </button>
    <entry v-if="entry != null" :entry_data="entry"
           :has_data="true" :allow_edit="show_answer" :allow_delete="false"
           :hide_keyword="!show_answer" :hide_usage="!show_answer" :hide_pronounciation="!show_answer"
           @entry-removed="next_word()"
           @entry-updated="fetch_groups()"/>
</div>
</div>
</div>
`
}
