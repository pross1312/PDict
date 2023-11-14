import {reactive} from "vue";
export default {
    props: ["submit_name", "groups", "form_id", "all_groups"],
    data() {
        return {
            on_selecting: false, // because mousedown is fired first ??? important for this hack to work until i find a better way
                                 // then when mousedown on input or select box set it to true,
                                 // on blur of these two, if not on_selecting (did not click input or select box)
                                 // then blur input else set on_selecting to false and do nothing
        }
    },
    methods: {
        blur_input() {
            if (!this.on_selecting) this.toggle_new_group(false);
            this.on_selecting = false;
        },
        remove_group(group_name, group) {
            group.remove();
            let index = this.groups.indexOf(group_name);
            if (index != -1) this.groups.splice(index, 1);
            else alert(`Can't remove ${grou_name}`);
            document.getElementById(this.form_id).dispatchEvent(new Event('submit'));
        },
        calc_size(val) {
            return (val.length * 1.3)>>0;
        },
        select_add_group(node) {
            this.add_group(node.innerText);
            document.getElementById(this.form_id).dispatchEvent(new Event('submit'));
        },
        add_group(g) {
            g = g.trim();
            if (!this.groups.includes(g)) this.groups.push(g);
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
           class="border fs-6 border-2 rounded-0 flex-grow-0 btn-sm btn btn-secondary px-1"
           @dblclick="remove_group(group, $event.currentTarget)"
           :name="submit_name + '[]'" :value="group" readonly/>
    <div class="d-flex ms-1">
        <div class="w-75 btn-group btn-group-sm d-flex border-1 border rounded-2 d-none">
            <input id="new-group-input"
                   @blur="blur_input()"
                   @mousedown.left="on_selecting = true"
                   @change="add_group($event.currentTarget.value)"
                   type="text" class="form-control form-control-sm border-0"/>
            <button type="button" class="btn dropdown-toggle dropdown-toggle-split" data-bs-toggle="dropdown" aria-expanded="false" 
                    @mousedown.left="on_selecting = true"
                    @blur="blur_input()">
                <span class="visually-hidden">Toggle Dropdown</span>
            </button>
            <ul class="dropdown-menu">
                <li v-for="group in all_groups.filter(x => !groups.includes(x))">
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
