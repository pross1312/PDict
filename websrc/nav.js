export default {
    inject: ["open_url"],
    template: `
<nav class="navbar navbar-expand p-0 bg-secondary bg-gradient">
    <a href="/" class="bg-success fw-bolder px-3 navbar-brand">PDict</a>
    <ul class="navbar-nav">
        <li class="navbar-item">
            <button @click="open_url('/')" class="btn fw-bold">Home</button>
        </li>
        <li class="navbar-item">
            <button @click="open_url('/list')" class="btn fw-bold">List</button>
        </li>
        <li class="navbar-item">
            <button @click="open_url('/learn')" class="btn fw-bold">Learn</button>
        </li>
    </ul>
</nav>
`
}
