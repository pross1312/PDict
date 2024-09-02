import entry from "./entry.js"
import {ref} from "vue"
export default {
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
<div class="btn-group btn-group-sm border-1 border rounded-2">
    <button type="button" class="btn fs-4 dropdown-toggle dropdown-toggle-split"
            data-bs-toggle="dropdown">
        {{current_group}}
    </button>
    <span class="visually-hidden">Toggle Dropdown</span>
    <ul class="dropdown-menu">
        <li v-for="group in all_groups">
            <p style="cursor: pointer;"
               @mousedown.left="select_group($event.currentTarget.innerText)"
               class="dropdown-item m-0">{{group}}</p>
        </li>
        <li>
            <p style="cursor: pointer;"
               @mousedown.left="select_group('')"
               class="dropdown-item m-0">-ALL-</p>
        </li>
    </ul>
</div>
<entry v-if="entry != null" :entry_data="entry"
       :has_data="true" :allow_edit="false"
       :hide_keyword="!show_answer" :hide_usage="!show_answer" :hide_pronounciation="!show_answer"
       @keydown.space="$event.stopPropagation();"/>
`
}
