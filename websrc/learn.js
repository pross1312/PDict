import entry from "./entry.js"
import {ref} from "vue"
export default {
    inject: ["set_key", "change_content", "show_error_msg"],
    setup() {
        let all_groups = ref([]);
        let current_group = ref("");
        let fetch_groups = () => {
            fetch(`http://${window.location.host}/list-group`).then(async result => {
                if (result.headers.get("Content-Type").match("application/json") != null) {
                    all_groups.value = (await result.json()).Group;
                }
            }).catch(err => alert(err));
        };
        fetch_groups();
        return {all_groups, current_group, fetch_groups};
    },
    data() {
        return {
            entry: new entry.new_entry(),
            show_answer: false,
            keyword: "",
        }
    },
    components: {
        entry,
    },
    mounted() {
        window.onkeydown = async (e) => {
            if (e.key === " ") {
                if (this.show_answer) await this.next_word();
                this.show_answer = !this.show_answer;
                return true;
            }
        };
        fetch(`http://${window.location.host}/change-learn-group?group=${this.current_group}`).then(async result => {
            console.log(await result.text());
            await this.next_word();
        });
    },
    methods: {
        async mouse_down_left(e) {
            if (e.currentTarget === e.srcElement && e.button == 0) {
                if (this.show_answer) await this.next_word();
                this.show_answer = !this.show_answer;
                e.stopPropagation();
                return true;
            }
        },
        async select_group(group) {
            this.show_answer = false;
            await fetch(`http://${window.location.host}/change-learn-group?group=${group}`).then(async result => {
                console.log(await result.text());
                await this.next_word();
                this.current_group = group;
            }).catch(err => {
                this.show_error_msg(err);
            });
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
<span class="d-flex justify-content-start w-100" style="height: fit-content">
    <span class="flex-grow-0 fs-6 mt-auto mb-auto h-100">Group:</span>
    <div v-bind:class="current_group.trim() === '' ? '' : 'ms-2'"
         class="flex-grow-0 btn-group btn-group-sm border-0 border rounded-2">
        <span class="fs-6 mt-auto mb-auto" style="color: yellow;">{{current_group}}</span>
        <button type="button" class="m-auto ms-2 btn fs-6 pt-0 pb-0 p-0 border-0 dropdown-toggle dropdown-toggle-split"
                style="width: fit-content; height: fit-content; color: yellow;"
                data-bs-toggle="dropdown">
        </button>
        <span class="visually-hidden">Toggle Dropdown</span>
        <ul class="dropdown-menu overflow-auto" style="height: 300px">
            <li>
                <p style="cursor: pointer; color: yellow;"
                   @mousedown.left="select_group('')"
                   class="dropdown-item m-0 fs-6 pt-0 pb-0">-ALL-</p>
            </li>
            <li v-for="group in all_groups">
                <p style="cursor: pointer;"
                   @mousedown.left="select_group($event.currentTarget.innerText)"
                   class="dropdown-item m-0 fs-6 pt-0 pb-0">{{group}}</p>
            </li>
        </ul>
    </div>
</span>
<entry v-if="entry != null" :entry_data="entry"
       :has_data="true" :allow_edit="show_answer" :allow_delete="false"
       :hide_keyword="!show_answer" :hide_usage="!show_answer" :hide_pronounciation="!show_answer"
       @entry-removed="next_word()"
       @entry-updated="fetch_groups()"/>
</div>
`
}
