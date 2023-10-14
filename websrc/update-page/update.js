const http = new XMLHttpRequest();
const server_update_addr = window.location.protocol + "//" + window.location.host + "/update";

let def_list = document.getElementById("definition-list")
let usage_list = document.getElementById("usage-list")
let keyword_input = document.getElementById("keyword-input");
let pronounciation_input = document.getElementById("pronounciation-input");
let add_button = document.getElementById("add-button");

function on_def_input_keydown(e) {
    switch(e.key) {
    case 'Enter': 
        if (this.value !== "") {
            add_input_line(def_list, "Definition", on_def_input_keydown);
        }
        break;
    default:
    }
}

function on_usage_input_keydown(e) {
    switch(e.key) {
    case 'Enter': 
        if (this.value !== "") {
            add_input_line(usage_list, "Usage", on_usage_input_keydown);
        }
        break;
    default:
    }
}

function add_input_line(input_list, placeholder, handle_keydown_func) {
    let list_item = document.createElement("li");
    list_item.classList.toggle("item");
    let item_input = document.createElement("input");
    item_input.placeholder = placeholder;
    item_input.addEventListener("keydown", handle_keydown_func);
    item_input.type = "text";
    item_input.name = "fname";
    let item_button = document.createElement("button");
    item_button.classList.toggle("remove-button");
    item_button.innerText = "Remove";
    item_button.tabIndex = "-1";
    item_button.onclick = function() {
        if (input_list.children.length > 1) input_list.removeChild(list_item);
        else item_input.value = "";
    };
    list_item.appendChild(item_input);
    list_item.appendChild(item_button);
    input_list.appendChild(list_item);
    item_input.focus();
}

function update_entry(entry) {
    let data = JSON.stringify(entry);
    if (data == null) {
        console.log("Invalid json body");
    } else {
        http.open("POST", server_update_addr);
        http.setRequestHeader("Content-Type", "application/json");
        http.send(data);
    }
}

function clear_entry() {
    keyword_input.value = "";
    pronounciation_input.value = "";
    def_list.innerHTML = "";
    usage_list.innerHTML = "";
    add_input_line(def_list, "Definition", on_def_input_keydown);
    add_input_line(usage_list, "Usage", on_usage_input_keydown);
}

function get_entry() {
    entry = {};
    if (keyword_input.value !== "") {
        entry.Keyword = keyword_input.value;
        entry.Pronounciation = pronounciation_input.value;
        entry.Definition = [];
        for (let def of def_list.children) {
            console.assert(def.children[0].tagName === "INPUT");
            entry.Definition.push(def.children[0].value.split(",").map((e) => e.trim()));
        }
        entry.Usage = [];
        for (let usage of usage_list.children) {
            console.assert(usage.children[0].tagName === "INPUT");
            entry.Usage.push(usage.children[0].value);
        }
    }
    return entry;
}

add_input_line(def_list, "Definition", on_def_input_keydown);
add_input_line(usage_list, "Usage", on_usage_input_keydown);
add_button.onclick = function() {
    let new_entry = get_entry();
    if (new_entry == null) {
        alert("Invalid entry");
        return;
    }
    console.log(new_entry);
    update_entry(new_entry);
    clear_entry();
    keyword_input.focus();
};
