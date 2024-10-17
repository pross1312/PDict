export default {
    props: ["label", "items", "form_id", "allow_edit"],
    methods: {
        change_item(index, node) {
            node.classList.add("btn");
            node.classList.remove("form-control");
            this.items[index] = node.value.trim();
        },
        start_edit_item(node) {
            if (this.allow_edit) {
                node.classList.remove("btn");
                node.classList.add("form-control");
            }
        },
        remove_item(item, event) {
            let index = this.items.indexOf(item);
            if (index != -1) this.items.splice(index, 1);
            else alert(`Can't remove ${item} in ${this.label}`);
            document.getElementById(this.form_id).dispatchEvent(new Event('submit'));
        }
    },
    template: `
<label class="mb-1 d-block h5 fw-bold mb-0">{{label}}</label>
<div class="mt-0 mb-4">
    <ul class="list-item" style="line-height: 1">
        <li v-for="(item, index) in items"
            class="d-flex">
            <span v-if="!allow_edit" class="bg-secondary m-auto" style="height: 15px; width: 15px; border-radius: 50%; display: inline-block;"/>
            <span v-if="allow_edit" class="d-inline-flex flex-column justify-content-center" style="width: fit-content">
                <button class="btn-close d-inline" style="scale: 0.7"
                        tabindex="-1"
                        @mousedown.left="remove_item(item, $event)"></button>
            </span>
            <input :readonly="!allow_edit"
                   class="ps-2 text-start fs-6 text-light list-input-item btn bg-none py-0 my-0 mb-1 flex-grow-1"
                   @click="start_edit_item($event.currentTarget)"
                   @keydown.enter="change_item(index, $event.currentTarget)"
                   @change="change_item(index, $event.currentTarget)"
                   :name="label + '[]'" :value="item" />
        </li>
        <input v-if="allow_edit" :id="'new-' + label" class="form-control form-control-sm" :placeholder="'Add ' + label"
               @change="items.push($event.currentTarget.value.trim()); $event.currentTarget.value = '';" />
    </ul>
</div>
`
}
