const http = new XMLHttpRequest();
const server_list_addr = "http://localhost:9999/list";
const server_delete_addr = "http://localhost:9999/delete";
let left_list = document.getElementById("list-left");
let right_list = document.getElementById("list-right");
let center_list = document.getElementById("list-center");
let remove_list = [];

http.addEventListener("load", function() {
    if (http.status == 404) {
        return
    } else if (http.getResponseHeader("Content-Type") === "application/json") {
        data = JSON.parse(this.response);
        if (data == null) {
            console.log(`[ERROR] Can't regconize data ${this.responseText}`);
        } else {
            display(data);
        }
    } else if (http.responseText === "[INFO] Successfully delete") {
        list();
    }
})

function list() {
    http.open("GET", server_list_addr);
    http.send();
}

function display(data) {
    left_list.innerHTML = "";
    center_list.innertHTML = "";
    right_list.innerHTML = "";
    let third_length = parseInt(data.length/3);
    for (let i = 0; i < third_length; i++) {
        add_word(data[i], "left");
        add_word(data[i+third_length], "center");
        add_word(data[i+2*third_length], "right");
    }
    if (data.length % 3 != 0) add_word(data[data.length-1], "left");
    if (data.length % 3 == 2) add_word(data[data.length-1], "center");
}

function remove_all() {
    if (remove_list.length == 0) return;
    console.log("Remove:", remove_list);
    http.open("DELETE", server_delete_addr);
    http.setRequestHeader("Content-Type", "application/json");
    http.send(JSON.stringify(remove_list));
}

function select_word() {
    if (this.ON_SELECT == null) {
        this.ON_SELECT = true;
    } else {
        this.ON_SELECT = !this.ON_SELECT;
    }
    if (this.ON_SELECT) {
        remove_list.push(this.innerText);
        this.style["color"] = "red";
        this.classList.remove("hover");
        this.onmouseover = null;
    } else {
        const index = remove_list.indexOf(this.innerText);
        if (index == -1) alert("WHAT HAPPEN!!!!");
        remove_list.splice(index, 1);
        this.style["color"] = "white";
    }
}

function add_word(text, position) {
    let item = document.createElement("li");
    let remove_button = document.createElement("button");
    remove_button.classList.toggle("select-button");
    remove_button.tabindex = "-1";
    remove_button.innerText = text;
    remove_button.onclick = select_word;
    item.appendChild(remove_button);
    if (position === "left") left_list.appendChild(item);
    else if (position === "right") right_list.appendChild(item);
    else center_list.appendChild(item);
}

list();
