import {reactive} from "vue";
export default {
    props: ["submit_name", "groups", "form_id"],
    methods: {
        remove_group(group) {
            group.remove();
            document.getElementById(this.form_id).dispatchEvent(new Event('submit'));
        },
        calc_size(val) {
            return (val.length * 1.3)>>0;
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
        <div class="w-75 btn-group btn-group-sm d-flex border-1 border rounded-2 d-none">
            <input id="new-group-input"
                   @change="groups.push($event.currentTarget.value); toggle_new_group(false)"
                   @blur="toggle_new_group(false)"
                   type="text" class="form-control form-control-sm border-0"/>
            <button type="button" class="btn dropdown-toggle dropdown-toggle-split" data-bs-toggle="dropdown" aria-expanded="false">
                <span class="visually-hidden">Toggle Dropdown</span>
            </button>
            <ul class="dropdown-menu">
                <li><p style="cursor: pointer;" class="existing-group dropdown-item m-0">Action</p></li>
                <li><p style="cursor: pointer;" class="existing-group dropdown-item m-0">Another action</p></li>
                <li><p style="cursor: pointer;" class="existing-group dropdown-item m-0">Something else here</p></li>
                <li><p style="cursor: pointer;" class="existing-group dropdown-item m-0">Separated link</p></li>
            </ul>
        </div>
        <div class="d-flex flex-column justify-content-center">
            <button @click="toggle_new_group(true)" type="button" class="btn btn-sm btn-secondary">+</button>
        </div>
    </div>
</span>
`
}
