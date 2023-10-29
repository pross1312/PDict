const http = new XMLHttpRequest();
const server_query_addr = "http://localhost:9999/query";
const server_suggestion_addr = "http://localhost:9999/suggest";
const server_update_addr = "http://localhost:9999/update";
const server_add_group_addr = "http://localhost:9999/add-group";
const server_list_group_addr = "http://localhost:9999/list-group";
let input_box = document.getElementById("main-input");
let suggestion_list = document.getElementById("suggestion-list");
let on_display_def = false;
let suggestion_region = document.getElementById('suggestion-region');
let current_suggest_text = "";
let def_list = document.getElementById("def-list");
let def_region = document.getElementById("def-region");
let usage_list = document.getElementById("usage-list");
let usage_region = document.getElementById("usage-region");
let keyword_box = document.getElementById("keyword");
let pronoun_box = document.getElementById("pronounciation");
let group_region = document.getElementById("group-region");

function optional_input_set_text(op_input, text) {
    let input = op_input.children[0];
    let btn = op_input.children[1];
    if (typeof(text) !== "string") alert("Invalid type for set text");
    text = text == null ? "" : text.trim();
    if (text == "") {
        btn.classList.remove("hide");
        input.value = "";
        input.classList.add("hide");
    } else {
        btn.classList.add("hide");
        input.value = text;
        input.classList.remove("hide");
    }
}
// init pronounciation box
pronoun_box.children[1].onclick = function(e) {
    this.previousElementSibling.classList.remove("hide");
    this.classList.add("hide");
    this.previousElementSibling.focus();
};

pronoun_box.children[0].onkeydown = function(e) {
    if ((e.type == "keydown" && e.key == "Enter") || e.type == "focusout" || e.type == "blur") {
        if (this.value.trim() === "") {
            this.nextElementSibling.classList.remove("hide");
            this.classList.add("hide");
            return;
        }
    }
    if (def_list.children.length > 0) def_list.children[0].focus();
}
pronoun_box.children[0].onblur = pronoun_box.children[0].onkeydown;



http.addEventListener("load", function() {
    if (this.status == 404) {
        display_entry({Keyword: this.responseText.split("No entry for ")[1], Pronounciation: "", Definition: [], Usage: []});
        return;
    } else if (this.getResponseHeader("Content-Type").includes("application/json")) {
        data = JSON.parse(this.response);
        if (data == null) {
            console.log(`[ERROR] Can't regconize data ${this.responseText}`);
        } else if (data.Keyword != null) {
            display_entry(data);
        } else if (data.Suggestion != null) {
            display_suggestion(data.Suggestion);
        }
    }
})

function query_text(text) {
    http.open("GET", server_query_addr + `?key=${text}`);
    http.send();
}

function suggest_text(text) {
    http.open("GET", server_suggestion_addr + `?key=${text}`);
    http.send();
}

function toggle_suggestion(show) {
    if (show && suggestion_list.children.length > 0) suggestion_region.classList.add('show');
    else suggestion_region.classList.remove('show');
}

function search_key(text) {
    window.open("http://" + window.location.host + `/?key=${text}`,"_self");
}

function clear_def_region() {
    keyword_box.innerText = "";
    optional_input_set_text(pronoun_box, "");
    pronoun_box.classList.add("hide");
    def_list.innerText = "";
    usage_list.innerText = "";
}

window.onkeydown = function(e) {
    if (e.key == "Backspace") {
        let deleting_elements = document.querySelectorAll(".list-items li.selected")
        if (deleting_elements.length != 0) {
            for (let element of deleting_elements) element.remove();
            update_entry(get_entry());
        }
    }
}
function get_entry() {
    if (keyword_box.innerText !== "") {
        let entry = {};
        entry.Keyword = keyword_box.innerText;
        entry.Pronounciation = pronoun_box.children[0].value;
        entry.Definition = [];
        entry.Usage = [];
        entry.Group = [];
        for (let def of document.querySelectorAll("#def-list li span")) {
            entry.Definition.push(def.innerText.split(", "));
        }
        for (let usage of document.querySelectorAll("#usage-list li span")) {
            entry.Usage.push(usage.innerText);
        }
        return entry;
    } else alert("Invalid, something went wrong when trying to get entry");
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
function make_list_item(text) {
    let item = document.createElement("li");
    let span = document.createElement("span");
    span.innerText = text;
    let input = document.createElement("input");
    input.classList.add("hide");
    input.onkeydown = function(e) {
        if (this.value == "") return;
        if (e.key == "Enter") {
            this.previousElementSibling.innerText = this.value;
            this.previousElementSibling.classList.remove("hide");
            this.classList.add("hide");
            update_entry(get_entry());
        }
    }
    span.onclick = function() { this.parentNode.classList.toggle("selected"); }
    span.ondblclick = function() {
        this.parentNode.classList.remove("selected");
        this.classList.add("hide");
        this.nextElementSibling.value = this.innerText;
        this.innerText = "";
        this.nextElementSibling.classList.remove("hide");
        this.nextElementSibling.focus();
    }
    item.appendChild(span);
    item.appendChild(input);
    return item;
}

function display_entry(data) {
    clear_def_region();
    def_region.children[0].innerText = "Definition:";
    usage_region.children[0].innerText = "Usage:";
    pronoun_box.classList.remove("hide");
    keyword_box.innerText = data.Keyword;
    optional_input_set_text(pronoun_box, data.Pronounciation);
    for (let def of data.Definition) {
        def_list.appendChild(make_list_item(def.join(", ")));
    }
    let btn = document.createElement("button")
    btn.innerText = "➕";
    function btn_click() {
        let item = make_list_item("");
        item.firstChild.classList.add("hide");
        item.lastChild.classList.remove("hide");
        this.previousElementSibling.appendChild(item);
        item.lastChild.focus();
    }
    btn.onclick = btn_click;
    def_region.appendChild(btn);
    for (let usage of data.Usage) {
        usage_list.appendChild(make_list_item(usage));
    }
    let btn2 = btn.cloneNode(true);
    btn2.onclick = btn_click;
    usage_region.appendChild(btn2);
}

function add_suggestion(text) {
    let dt = document.createElement('dt');
    let button = document.createElement('button');
    button.onclick = function() {
        search_key(text);
    }
    button.innerHTML = text;
    button.classList.toggle('suggestion-item');
    dt.appendChild(button);
    suggestion_list.appendChild(dt);
}

function display_suggestion(suggestions) {
    suggestion_list.innerHTML = "";
    for (let word of suggestions) {
        add_suggestion(word)
    }
    if (suggestions.length == 0) toggle_suggestion(false);
    else toggle_suggestion(true);
}

function suggestion_list_has_focus() {
    for (let child of suggestion_list.children) {
        console.assert(child.children[0].tagName === "BUTTON");
        if (document.activeElement == child.children[0]) return true;
    }
    return false;
}

input_box.addEventListener('click', function(ev) {
    if (input_box.value !== "") toggle_suggestion(true);
});
input_box.addEventListener('focusin', function(ev) {
    if (input_box.value !== "") toggle_suggestion(true);
});
input_box.addEventListener('focusout', function(ev) {
    window.setTimeout(function() { // to set text first before hide suggestions
        if (!suggestion_list_has_focus()) toggle_suggestion(false);
    }, 300);
});
input_box.addEventListener('keydown', function(ev) {
    switch(ev.key) {
    case 'Enter':
        if (input_box.value !== "") {
            search_key(input_box.value);
        }
        break;
    default:
    }
});

window.setInterval(function() { // dynamic update suggestion list height
    if (document.activeElement != input_box && !suggestion_list_has_focus()) {
        toggle_suggestion(false);
    } else if (suggestion_list.children.length <= 8) {
        suggestion_list.style.overflowY = 'hidden';
        suggestion_list.style.height = 'fit-content';
    } else {
        suggestion_list.style.overflowY = 'scroll';
        suggestion_list.style.height = '12em';
    }
}, 200);

window.setInterval(function() { // suggestion
    if (document.activeElement != input_box) return;
    if (current_suggest_text !== input_box.value) {
        if (input_box.value !== "") suggest_text(input_box.value);
        else display_suggestion([]);
        current_suggest_text = input_box.value;
    }
}, 100);

function group_on_value_change() {
    if (this.value.trim() == "") {
        this.classList.add("hide");
        this.nextElementSibling.classList.remove("hide");
        this.nextElementSibling.focus();
    }
};

function query_group() {
    return ["Verb", "Noun", "Adjective"];
}

function group_button_click() {
    if (this.innerText === "+") {
        this.innerText = "─";
        this.parentNode.children[0].classList.remove("hide");
        let selector = this.parentNode.children[0];
        let groups = query_group();
        for (let group of groups) {
            let option = document.createElement("option");
            option.value = group;
            option.innerText = group;
            selector.insertBefore(option, selector.lastElementChild);
        }
        selector.value = groups[0]
        group_region.appendChild(make_group_selector(null));
    } else {
        this.innerText = "+";
        let selector = this.parentNode.children[0];
        selector.value = selector.children[0].value;
        selector.classList.add("hide");
        this.parentNode.children[1].classList.add("hide");
        if (group_region.children.length > 1) {
            this.parentNode.remove();
        }
    }
}

function group_input_keydown(e) {
    if (e.key == "Enter") {
        this.value = this.value.trim();
        if (this.value !== "") {
            let new_option = document.createElement("option");
            new_option.value = this.value;
            new_option.innerText = this.value;
            let selector = this.parentNode.children[0];
            selector.insertBefore(new_option, selector.firstChild);
            selector.value = this.value;
            selector.classList.remove("hide");
            this.classList.add("hide");
            this.value = "";
        } else {
            this.classList.add("hide");
            this.nextElementSibling.innerText = "+";
        }
    }
}

function make_group_selector(value) {
    let span = document.createElement("span");
    span.classList.toggle("group-container");
    let selector = document.createElement("select");
    selector.classList.add("group")
    selector.onchange = group_on_value_change;
    selector.onclick = function() {
        this.innerText = "";
        for (let group of query_group()) {
            let option = document.createElement("option");
            option.value = group;
            option.innerText = group;
            this.insertBefore(option, this.lastChild);
        }
        let new_group = document.createElement("option");
        new_group.classList.add("new-group");
        new_group.value = "";
        new_group.innerText = "+ New..";
        this.appendChild(new_group);
    }
    let new_group = document.createElement("option");
    new_group.classList.add("new-group");
    new_group.value = "";
    new_group.innerText = "+ New..";
    selector.appendChild(new_group);
    let input = document.createElement("input");
    input.type = "text";
    input.spellcheck = false;
    input.classList.add("hide");
    input.onkeydown = group_input_keydown;
    input.size = 10;
    let button = document.createElement("button");
    if (typeof(value) == "string" && value.trim() != "") {
        let option = document.createElement("option");
        option.value = value;
        option.innerText = value;
        selector.insertBefore(option, selector.lastElementChild);
        selector.value = value.trim();
        button.innerText = "─";
    } else {
        selector.classList.add("hide")
        button.innerText = "+";
    }
    button.onclick = group_button_click;
    span.appendChild(selector);
    span.appendChild(input);
    span.appendChild(button);
    return span;
}

// parse search param and display query result
const query_str = window.location.search;
const url_params = new URLSearchParams(query_str);
if (url_params.get("key") !== null) {
    query_text(url_params.get("key"));
    toggle_suggestion(false);
}
group_region.appendChild(make_group_selector(null));
