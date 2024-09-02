import entry from "./entry.js"
import {ref} from "vue"
export default {
    inject: ["set_key", "change_content"],
    setup() {
        let all_groups = ref([]);
        let current_group = ref("");
        fetch("http://localhost:9999/list-group").then(async result => {
            if (result.headers.get("Content-Type").match("application/json") != null) {
                all_groups.value = (await result.json()).Group;
            }
        }).catch(err => alert(err));
        return {all_groups, current_group};
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
        window.onkeydown = (e) => {
            if (e.key === " ") {
                if (this.show_answer) this.next_word();
                this.show_answer = !this.show_answer;
            }
        };
        fetch(`http://localhost:9999/change-learn-group?group=${this.current_group}`).then(async result => {
            console.log(await result.text());
            this.next_word();
        });
    },
    methods: {
        edit_entry() {
            console.log(this.entry)
            if (this.entry.Keyword.trim() !== "") {
                this.set_key(this.entry.Keyword);
                this.change_content('home');
            }
        },
        select_group(group) {
            this.keywords = [];
            fetch(`http://localhost:9999/list?group=${group}`).then(async result => {
                if (result.headers.get("Content-Type").match("application/json") != null) {
                    let items = await result.json();
                    this.keywords.push(...items);
                    this.current_group = group
                    fetch(`http://localhost:9999/change-learn-group?group=${group}`).then(async result => {
                        console.log(await result.text());
                        this.next_word();
                    });
                }
            }).catch(err => {alert(err);});
        },
        next_word() {
            const server_nextword_addr   = "http://localhost:9999/nextword";
            fetch(server_nextword_addr).then(async result => {
                if (result.headers.get("Content-Type").includes("application/json")) {
                    let data = await result.json();
                    data.Definition = data.Definition;
                    this.entry = data;
                    this.keyword = data.Keyword;
                } else {
                    this.keyword = "No word to learn";
                    this.entry = null;
                }
            }).catch(err => {alert(err);});
        }
    },
    template: `
<div class="w-100 h-100">
<span class="d-flex justify-content-start w-100" style="height: fit-content">
    <span class="flex-grow-0 fs-6 mt-auto mb-auto h-100">Group:</span>
    <div v-bind:class="current_group.trim() === '' ? '' : 'ms-2'"
         class="flex-grow-0 btn-group btn-group-sm border-0 border rounded-2">
        <span class="fs-6">{{current_group}}</span>
        <button type="button" class="m-auto ms-2 btn fs-6 pt-0 pb-0 p-0 border-0 dropdown-toggle dropdown-toggle-split"
                style="width: fit-content; height: fit-content;"
                data-bs-toggle="dropdown">
        </button>
        <span class="visually-hidden">Toggle Dropdown</span>
        <ul class="dropdown-menu overflow-auto" style="height: 300px">
            <li>
                <p style="cursor: pointer; color: yellow"
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
    <button class="ms-auto btn btn-success btn-sm rounded-0" type="button"
            @click="edit_entry()">
        Edit
    </button>
</span>
<entry v-if="entry != null" :entry_data="entry"
       :has_data="true" :allow_edit="false"
       :hide_keyword="!show_answer" :hide_usage="!show_answer" :hide_pronounciation="!show_answer"
       @keydown.space="$event.stopPropagation();"/>
</div>
`
}
