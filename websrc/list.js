import {ref} from "vue";
export default {
    props: ["per_row"],
    inject: ["set_key", "change_content"],
    setup(props) {
        let keywords = ref([]);
        const per_row = props.per_row || 6;
        let has_data = ref(false);
        let all_groups = ref([]);
        let current_group = ref("");
        fetch("http://localhost:9999/list").then(async result => {
            if (result.headers.get("Content-Type").match("application/json") != null) {
                let items = await result.json();
                keywords.value.push(...items);
                has_data.value = true;
            }
        }).catch(err => alert(err));
        fetch("http://localhost:9999/list-group").then(async result => {
            if (result.headers.get("Content-Type").match("application/json") != null) {
                all_groups.value = (await result.json()).Group;
            }
        }).catch(err => alert(err));
        return {has_data, keywords, per_row, all_groups};
    },
    methods: {
        remove_key(key) {
            key = key.trim();
            fetch("http://localhost:9999/list", {
                method: "DELETE",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify([key]),
            }).then(result => {
                console.log(result.statusText);
            });
            let index = this.keywords.indexOf(key);
            if (index != -1) this.keywords.splice(index, 1);
        },
        select_group(group) {
            this.has_data = false;
            this.keywords = [];
            fetch(`http://localhost:9999/list?group=${group}`).then(async result => {
                if (result.headers.get("Content-Type").match("application/json") != null) {
                    let items = await result.json();
                    this.keywords.push(...items);
                    this.current_group = group
                    this.has_data = true;
                }
            }).catch(err => {alert(err);});
        },
    },
    template: `
<div v-if="has_data" class="container-fluid fs-6 mt-3 px-3">
    Group:&nbsp
    <div class="btn-group btn-group-sm border-0 border rounded-2">
        <button type="button" class="btn fs-4 pt-0 pb-0 p-0 border-0 dropdown-toggle dropdown-toggle-split"
                style="width: fit-content; height: fit-content;"
                data-bs-toggle="dropdown">
            {{current_group}}
        </button>
        <span class="visually-hidden">Toggle Dropdown</span>
        <ul class="dropdown-menu">
            <li v-for="group in all_groups">
                <p style="cursor: pointer;"
                   @mousedown.left="select_group($event.currentTarget.innerText)"
                   class="dropdown-item m-0 fs-6 pt-0 pb-0">{{group}}</p>
            </li>
            <li>
                <p style="cursor: pointer; color: yellow"
                   @mousedown.left="select_group('')"
                   class="dropdown-item m-0 fs-6 pt-0 pb-0">-ALL-</p>
            </li>
        </ul>
    </div>
    <div v-for="(_, row) in Number((keywords.length/per_row) >> 0) + 1"
         class="row d-flex flex gx-5 mt-3">
        <div v-for="(_, col) in per_row" :class="['col-' + ((12/per_row)>>0)]">
            <span v-if="row*per_row + Number(col) < keywords.length" class="h-100 d-inline-flex">
                <span class="d-flex flex-column h-100 justify-content-center bg-body-secondary">
                    <button class="btn-close d-inline"
                            @mousedown.left="remove_key(keywords[row*per_row  + Number(col)])"></button>
                </span>
                <button class="h-100 w-100 pt-1 pb-1 btn btn-sm btn-secondary rounded-0"
                        @mousedown.left="set_key(keywords[row*per_row + Number(col)]); change_content('home')">
                    {{keywords[row*per_row + Number(col)]}}
                </button>
            </span>
        </div>
    </div>
</div>
`
}
