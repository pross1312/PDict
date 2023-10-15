const http = new XMLHttpRequest();
const server_list_addr = "http://localhost:9999/list";
const server_delete_addr = "http://localhost:9999/delete";
let left_list = document.getElementById("list-left");
let right_list = document.getElementById("list-right");
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
    right_list.innerHTML = "";
    let half_length = parseInt(data.length/2);
    for (let i = 0; i < half_length; i++) {
        add_word(data[i], true);
        add_word(data[i+half_length], false);
    }
    if (data.length % 2 == 1) add_word(data[data.length-1], true);
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

function add_word(text, is_left) {
    let item = document.createElement("li");
    let remove_button = document.createElement("button");
    remove_button.classList.toggle("select-button");
    remove_button.tabindex = "-1";
    remove_button.innerText = text;
    remove_button.onclick = select_word;
    item.appendChild(remove_button);
    if (is_left) left_list.appendChild(item);
    else right_list.appendChild(item);
}

list();