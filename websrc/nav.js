export default {
    inject: ["change_content"],
    template: `
<nav class="navbar navbar-expand p-0 bg-secondary bg-gradient">
    <a href="/" class="bg-success fw-bolder px-3 navbar-brand">PDict</a>
    <ul class="navbar-nav">
        <li class="navbar-item">
            <button @click="change_content('home')" class="btn fw-bold">Home</button>
        </li>
        <li class="navbar-item">
            <button @click="change_content('list')" class="btn fw-bold">List</button>
        </li>
        <li class="navbar-item">
            <button @click="change_content('learn')" class="btn fw-bold">Learn</button>
        </li>
    </ul>
</nav>
`
}
