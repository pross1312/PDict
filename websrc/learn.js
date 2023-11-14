import entry from "./entry.js"
export default {
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
        this.next_word();
    },
    methods: {
        next_word() {
            const server_nextword_addr   = "http://localhost:9999/nextword";
            fetch(server_nextword_addr).then(async result => {
                if (result.headers.get("Content-Type").includes("application/json")) {
                    let data = await result.json();
                    data.Definition = data.Definition.map(x => x.join(", "));
                    this.entry = data;
                    this.keyword = data.Keyword;
                } else {
                    this.keyword = "No word to learn";
                }
            }).catch(err => {alert(err);});
        }
    },
    template: `
<span class="mt-5 d-flex justify-content-center h1 display-1 text-center">
    {{keyword}}
</span>
<entry :entry_data="entry" :has_data="show_answer" hide_keyword="false" @keydown.space="$event.stopPropagation();"/>
`
}
