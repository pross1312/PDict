const http = new XMLHttpRequest();
const server_update_addr = "http://localhost:9999/update";
const server_query_addr = "http://localhost:9999/query";

let def_list = document.getElementById("definition-list");
let usage_list = document.getElementById("usage-list");
let keyword_input = document.getElementById("keyword-input");
let pronounciation_input = document.getElementById("pronounciation-input");
let update_button = document.getElementById("update-button");
let check_button = document.getElementById("check-button");

keyword_input.addEventListener('keydown', (e) => {
    if (e.key === "Enter" && this.value !== "") {
        query_entry();
        pronounciation_input.focus();
    }
});
pronounciation_input.addEventListener('keydown', (e) => {
    if (e.key === "Enter" && this.value !== "") {
        def_list.children[0].getElementsByTagName("input")[0].focus();
    }
});

function on_def_input_keydown(e) {
    if (e.key === "Enter" && this.value !== "") {
        add_input_line(def_list, "Definition", on_def_input_keydown, this.parentNode.nextSibling);
    }
}

function on_usage_input_keydown(e) {
    if (e.key === "Enter" && this.value !== "") {
        add_input_line(usage_list, "Usage", on_usage_input_keydown, this.parentNode.nextSibling);
    }
}

function add_input_line(input_list, placeholder, handle_keydown_func, next_item = null) {
    let list_item = document.createElement("li");
    list_item.classList.toggle("item");
    let item_input = document.createElement("input");
    item_input.placeholder = placeholder;
    item_input.onkeydown = handle_keydown_func;
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
    if (next_item === null) input_list.appendChild(list_item);
    else input_list.insertBefore(list_item, next_item);
    item_input.focus();
    return item_input;
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
    if (keyword_input.value.trim() !== "") {
        entry = {};
        entry.Keyword = keyword_input.value.trim();
        entry.Pronounciation = pronounciation_input.value.trim();
        entry.Definition = [];
        for (let def of def_list.children) {
            console.assert(def.children[0].tagName === "INPUT");
            if (def.children[0].value === "") continue;
            entry.Definition.push(def.children[0].value.split(",").map((e) => e.trim()));
        }
        if (entry.Definition.length == 0) return null;
        entry.Usage = [];
        for (let usage of usage_list.children) {
            console.assert(usage.children[0].tagName === "INPUT");
            if (usage.children[0].value === "") continue;
            entry.Usage.push(usage.children[0].value.trim());
        }
        return entry;
    }
    return null;
}

add_input_line(def_list, "Definition", on_def_input_keydown, null);
add_input_line(usage_list, "Usage", on_usage_input_keydown, null);
update_button.onclick = function() {
    let new_entry = get_entry();
    if (new_entry == null) {
        alert("Invalid entry\nNo keyword or definition prvided");
        return;
    }
    console.log(new_entry);
    update_entry(new_entry);
    clear_entry();
    keyword_input.focus();
};

function display(data) {
    clear_entry();
    def_list.innerHTML = "";
    usage_list.innerHTML = "";
    keyword_input.value = data.Keyword;
    pronounciation_input.value = data.Pronounciation;
    for (let def of data.Definition) {
        add_input_line(def_list, "Definition", on_def_input_keydown, null).value = def.join(", ");
    }
    if (def_list.children.length == 0) add_input_line(def_list, "Definition", on_def_input_keydown, null);
    for (let usage of data.Usage) {
        add_input_line(usage_list, "Usage", on_usage_input_keydown, null).value = usage;
    }
    if (usage_list.children.length == 0) add_input_line(usage_list, "Usage", on_usage_input_keydown, null);
}

function query_entry() {
    if (keyword_input.value !== "") {
        http.open("GET", server_query_addr + `?key=${keyword_input.value}`);
        http.send();
    }
}

http.addEventListener("load", function() {
    if (http.status == 404) {
        return
    } else if (http.getResponseHeader("Content-Type") === "application/json") {
        data = JSON.parse(this.response);
        if (data == null) {
            console.log(`[ERROR] Can't regconize data ${this.responseText}`);
        } else {
            display(data);
            console.log(data);
        }
    } else {
        console.log(http.responseText);
    }
})
check_button.onclick = query_entry;
