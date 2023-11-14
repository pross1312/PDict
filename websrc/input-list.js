export default {
    props: ["label", "items", "form_id"],
    methods: {
        remove_item(event) {
            event.currentTarget.parentNode.parentNode.remove();
            document.getElementById(this.form_id).dispatchEvent(new Event('submit'));
        }
    },
    template: `
<label class="d-block h5 fw-bold">{{label}}</label>
<div class="mt-2 mb-4">
    <ul class="list-item">
        <li v-for="item in items"
            class="d-flex">
            <span class="d-inline-flex flex-column justify-content-center">
                <button class="btn-close d-inline" @mousedown.left="remove_item($event)"></button>
            </span>
            <input class="text-start fs-3 text-light fw-bold list-input-item btn bg-none py-0 my-0 mb-1"
                   :name="label + '[]'" :value="item" readonly />
        </li>
        <input :id="'new-' + label" class="form-control" :placeholder="'Add ' + label"
               @change="items.push($event.currentTarget.value.trim()); $event.currentTarget.value = '';" />
    </ul>
</div>
`
}
