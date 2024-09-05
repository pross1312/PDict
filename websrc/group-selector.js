import {ref} from "vue";
export default {
    props: ["submit_name", "groups", "form_id", "allow_edit"],
    data() {
        let all_groups = ref([]);
        const update_group = function(on_success) {
            fetch(`http://${window.location.host}/list-group`).then(async result => {
                if (result.headers.get("Content-Type").match("application/json") != null) {
                    all_groups.value = (await result.json()).Group;
                    if (on_success) on_success();
                }
            }).catch(err => {
                alert(err);
            });
        }
        update_group(null);
        return {
            update_group,
            all_groups,
            on_adding: false,
            on_editing: false,
            on_selecting: false,
        }
    },
    methods: {
        remove_group(group_name, e) {
            let index = this.groups.indexOf(group_name);
            if (index != -1) this.groups.splice(index, 1);
            else alert(`Can't remove ${group_name}`);
            document.getElementById(this.form_id).dispatchEvent(new Event('submit'));
            return true;
        },
        add_group(g) {
            g = g.trim();
            if (!this.groups.includes(g)) this.groups.push(g);
            document.getElementById(this.form_id).dispatchEvent(new Event('submit'));
            this.toggle_new_group(false)
        },
        toggle_new_group(show_input) {
            if (show_input) {
                this.on_adding = true;
                this.update_group(() => {
                    let node = document.getElementById("new-group-input");
                    node.value = "";
                    node.focus();
                });
            } else {
                this.on_adding = false;
            }
        }
    },
    template: `
<span class="btn-group d-flex justify-content-start flex-wrap" style="scale: 0.7; transform-origin: left">
    <input v-for="group in groups" type="text" :size="Number((group.length * 1.1) >> 0)"
           v-bind:style="allow_edit ? '' : 'pointer-events: none'"
           class="border fs-6 border-2 rounded-0 flex-grow-0 btn-sm btn btn-secondary px-1"
           @dblclick="remove_group(group, $event)"
           :name="submit_name + '[]'" :value="group" readonly/>
    <div class="d-flex ms-1 flex-grow-0">
        <div v-if="on_adding" class="w-75 btn-group btn-group-sm d-flex border-1 border rounded-2">
            <input id="new-group-input"
                   @change="add_group($event.currentTarget.value)"
                   @blur="on_editing = false; on_adding = on_selecting;"
                   @mousedown.left="on_editing = true;"
                   type="text" class="form-control form-control-sm border-0"/>
            <button v-if="all_groups.filter(x => !groups.includes(x)).length > 0" type="button" class="btn dropdown-toggle dropdown-toggle-split" data-bs-toggle="dropdown"
                    aria-expanded="false"
                    @mousedown.left="on_selecting = true;"
                    @blur="on_selecting = false; on_adding = on_editing;">
                <span class="visually-hidden">Toggle Dropdown</span>
            </button>
            <ul class="dropdown-menu" style="height: 200px; overflow-y: auto">
                <li v-for="group in all_groups.filter(x => !groups.includes(x))">
                    <p  @mousedown.left="add_group($event.currentTarget.innerText)"
                        style="cursor: pointer;" class="existing-group dropdown-item m-0">{{group}}</p>
                </li>
            </ul>
        </div>
        <div v-if="allow_edit && !on_adding" class="d-flex flex-column justify-content-center">
            <button @click="toggle_new_group(true)" type="button" class="btn btn-sm btn-secondary">+</button>
        </div>
    </div>
</span>
`
}
