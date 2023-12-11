export default {
    props: ["label", "items", "form_id"],
    methods: {
        change_item(index, node) {
            node.classList.add("btn");
            node.classList.remove("form-control");
            node.setAttribute("readonly", "readonly");
            this.items[index] = node.value.trim();
        },
        start_edit_item(node) {
            node.classList.remove("btn");
            node.classList.add("form-control");
            node.removeAttribute("readonly");
        },
        remove_item(item, event) {
            event.currentTarget.parentNode.remove();
            let index = this.items.indexOf(item);
            if (index != -1) this.items.splice(index, 1);
            else alert(`Can't remove ${item} in ${this.label}`);
            document.getElementById(this.form_id).dispatchEvent(new Event('submit'));
        }
    },
    template: `
<label class="d-block h5 fw-bold">{{label}}</label>
<div class="mt-2 mb-4">
    <ul class="list-item">
        <li v-for="(item, index) in items"
            class="d-flex">
            <span class="d-inline-flex flex-column justify-content-center">
                <button class="btn-close d-inline" @mousedown.left="remove_item(item, $event)"></button>
            </span>
            <input class="text-start fs-3 text-light fw-bold list-input-item btn bg-none py-0 my-0 mb-1 flex-grow-1"
                   @click="start_edit_item($event.currentTarget)"
                   @keydown.enter="change_item(index, $event.currentTarget)"
                   @change="change_item(index, $event.currentTarget)"
                   :name="label + '[]'" :value="item" readonly />
        </li>
        <input :id="'new-' + label" class="form-control" :placeholder="'Add ' + label"
               @change="items.push($event.currentTarget.value.trim()); $event.currentTarget.value = '';" />
    </ul>
</div>
`
}
