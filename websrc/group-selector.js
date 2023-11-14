import {reactive} from "vue";
export default {
    props: ["submit_name", "groups", "form_id", "all_groups"],
    methods: {
        remove_group(group) {
            group.remove();
            window.setTimeout(() => { // wait a little before submit
                document.getElementById(this.form_id).dispatchEvent(new Event('submit'));
            }, 100);
        },
        calc_size(val) {
            return (val.length * 1.3)>>0;
        },
        select_add_group(node) {
            this.add_group(node.innerText);
            window.setTimeout(() => { // wait a little before submit
                document.getElementById(this.form_id).dispatchEvent(new Event('submit'));
            }, 100);
        },
        add_group(g) {
            this.groups.push(g.trim());
            this.toggle_new_group(false)
        },
        toggle_new_group(show_input) {
            let node = document.getElementById("new-group-input");
            if (!show_input) {
                node.parentNode.classList.add("d-none");
                node.parentNode.nextSibling.classList.remove("d-none");
            } else {
                node.value = "";
                node.parentNode.classList.remove("d-none");
                node.parentNode.nextSibling.classList.add("d-none");
                node.focus();
            }
        }
    },
    components: {
        btn_selector: `
`
    },
    template: `
<span class="btn-group d-flex-block flex-wrap mb-3">
    <input v-for="group in groups" type="text" :size="Number((group.length * 1.1) >> 0)"
           class="border fs-6 border-2 rounded-0 flex-grow-0 btn-sm btn btn-secondary user-select-none px-1"
           @dblclick="remove_group($event.currentTarget)"
           :name="submit_name + '[]'" :value="group" readonly/>
    <div class="d-flex ms-1">
        <div class="w-75 btn-group btn-group-sm d-flex border-1 border rounded-2 d-none"
             @blur="toggle_new_group(false)">
            <input id="new-group-input"
                   @change="add_group($event.currentTarget.value)"
                   type="text" class="form-control form-control-sm border-0"/>
            <button type="button" class="btn dropdown-toggle dropdown-toggle-split" data-bs-toggle="dropdown" aria-expanded="false">
                <span class="visually-hidden">Toggle Dropdown</span>
            </button>
            <ul class="dropdown-menu">
                <li v-for="group in all_groups">
                    <p  @mousedown.left="select_add_group($event.currentTarget)"
                        style="cursor: pointer;" class="existing-group dropdown-item m-0">{{group}}</p>
                </li>
            </ul>
        </div>
        <div class="d-flex flex-column justify-content-center">
            <button @click="toggle_new_group(true)" type="button" class="btn btn-sm btn-secondary">+</button>
        </div>
    </div>
</span>
`
}
