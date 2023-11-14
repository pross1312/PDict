import {reactive} from "vue";
export default {
    props: ["per_row"],
    inject: ["set_key", "change_content"],
    setup(props) {
        let keywords = reactive([]);
        const per_row = props.per_row || 6;
        fetch("http://localhost:9999/list").then(async result => {
            let items = await result.json();
            keywords.push(...items);
        }).catch(err => alert(err));
        return {keywords, per_row};
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
        }
    },
    template: `
<div class="container-fluid mt-5 px-3">
    <div v-for="(_, row) in Number((keywords.length/per_row) >> 0) + 1"
         class="row d-flex flex gx-5 my-5">
        <div v-for="(_, col) in per_row" :class="['col-' + ((12/per_row)>>0)]">
            <span v-if="row*per_row + Number(col) < keywords.length" class="h-100 d-inline-flex">
                <span class="d-flex flex-column h-100 justify-content-center bg-body-secondary">
                    <button class="btn-close d-inline"
                            @mousedown.left="remove_key(keywords[row*per_row  + Number(col)])"></button>
                </span>
                <button class="h-100 w-100 btn btn-lg btn-secondary rounded-0 "
                        @mousedown.left="set_key(keywords[row*per_row + Number(col)]); change_content('home')">
                    {{keywords[row*per_row + Number(col)]}}
                </button>
            </span>
        </div>
    </div>
</div>
`
}
