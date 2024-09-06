import {ref} from "vue"
export default {
    inject: ["show_error_msg"],
    emits: ["filter-changed"],
    props: {
        show: {
            type: Boolean,
            required: true,
        },
    },
    data() {
        const filters = ref({});
        const fetch_all_groups = async () => {
            await fetch(`http://${window.location.host}/list-group`).then(async result => {
                if (result.headers.get("Content-Type").match("application/json") != null) {
                    const all_groups = (await result.json()).Group;
                    console.log("All groups: ", all_groups);
                    const new_filters = {}
                    for (const group of all_groups) {
                        if (group in filters) {
                            console.log(group);
                            new_filters[group] = this.filters[group];
                        } else {
                            new_filters[group] = '|';
                        }
                    }
                    this.filters = new_filters;
                }
            }).catch(err => this.show_error_msg(err));
        };
        fetch_all_groups();
        return {
            include_color: 'color: lightgreen',
            exclude_color: 'color: pink',
            none_color: 'color: white',
            fetch_all_groups,
            filters
        };
    },
    methods: {
        on_click_group(group, mode) {
            switch (mode) {
                case '|':
                    this.filters[group] = '+';
                    break;
                case '+':
                    this.filters[group] = '-';
                    break;
                case '-':
                    this.filters[group] = '|';
                    break;
                default:
                    console.log(`Unknown mode ${mode}`);
            }
        }
    },
    template: `
<div v-if="show"
     class="position-relative flex-grow-0 d-flex flex-column justify-content-start"
     style="height: 100%; width: 200px; background-color: #050505aa;">
    <!-- Put this here cause on mobile it doesn't display properly at the bottom-->
    <button class="rounded-0 flex-grow-0 btn btn-sm btn-secondary m-0"
            @click="this.$emit('filter-changed', this.filters)"
            style="height: fit-content;">Filter</button>
    <div class="flex-grow-1 list-group m-0 p-0 rounded-0 overflow-y-auto overflow-x-hidden">
        <button v-for="[group, mode] of Object.entries(filters)"
                @click="on_click_group(group, mode)"
            class="list-group-item p-0 m-0 d-flex">
            <span class="h-100 m-0 border-right bg-body-secondary d-flex justify-content-center" style="min-width: 1.1em;">
                  <span style="color: white;" class="text-light d-block mb-auto mt-auto">{{mode === '+' ? '➕' : mode === '-' ? '➖' : '◉' }}</span>
            </span>
            <span class="ms-2 text-start d-inline-block"
                  style="min-height: 1.5em;"
                  v-bind:style="mode === '+' ? include_color : (mode === '-' ? exclude_color : none_color)">
                  {{group}}
            </span>
        </button>
    </div>
</div>
`
}
