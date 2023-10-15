let input_box = document.getElementById("main-input");
let suggestion_list = document.getElementById("suggestion-list");
let on_display_def = false;
const http = new XMLHttpRequest();
const server_query_addr = "http://localhost:9999/query";
let suggestion_region = document.getElementById('suggestion-region');
let keyword_box = document.getElementById("keyword");
let pronoun_box = document.getElementById("pronounciation");
let def_list = document.getElementById("definition-list");
let usage_list = document.getElementById("usage-list");
let def_region = document.getElementById("definition-region");
let usage_region = document.getElementById("usage-region");
let def_header = document.getElementById("definition-header");
let usage_header = document.getElementById("usage-header");

http.addEventListener("load", function() {
    if (this.status == 404) {
        keyword_box.innerText = "No definition found"
        console.log(this.response);
        return;
    } else if (this.getResponseHeader("Content-Type").includes("application/json")) {
        data = JSON.parse(this.response);
        if (data == null) {
            console.log(`[ERROR] Can't regconize data ${this.responseText}`);
        } else {
            display(data);
            console.log(data);
        }
    }
})

function search_key(text) {
    window.open("http://" + window.location.host + `/?key=${text}`,"_self");
}

function clear_def_region() {
    keyword_box.innerText = "";
    pronoun_box.innerText = "";
    def_header.innerText = "";
    def_list.innerHTML = "";
    usage_header.innerText = "";
    usage_list.innerHTML = "";
}

function display(data) {
    input_box.value = data.Keyword;
    def_header.innerText = "Definition";
    usage_header.innerText = "Usage";
    keyword_box.innerText = data.Keyword;
    pronoun_box.innerText = data.Pronounciation;
    def_list.innerHTML = "";
    for (let def of data.Definition) {
        let list_item = document.createElement("li");
        list_item.innerText = def.join(", ");
        def_list.appendChild(list_item);
    }
    usage_list.innerHTML = "";
    for (let usage of data.Usage) {
        let list_item = document.createElement("li");
        list_item.innerText = usage;
        usage_list.appendChild(list_item);
    }
}

function query_text(text) {
    http.open("GET", server_query_addr + `?key=${text}`);
    http.send();
}

function toggle_suggestion(show) {
    if (show) suggestion_region.classList.add('show');
    else suggestion_region.classList.remove('show');
}

input_box.addEventListener('click', function(ev) {
    toggle_suggestion(true);
});
input_box.addEventListener('focusin', function(ev) {
    toggle_suggestion(true);
});
input_box.addEventListener('focusout', function(ev) {
    window.setTimeout(function() { // to set text first before hide suggestions
        toggle_suggestion(false);
    }, 200);
});
input_box.addEventListener('keydown', function(ev) {
    switch(ev.key) {
    case 'Enter': 
        if (input_box.value !== "") {
            search_key(input_box.value);
        }
        break;
    default:
        toggle_suggestion(true);
    }
});

function create_suggestion(text) {
    let dt = document.createElement('dt');
    let button = document.createElement('button');
    button.onclick = function() {
        search_key(text);
    }
    button.innerHTML = text;
    button.classList.toggle('suggestion-item');
    dt.appendChild(button);
    return dt;
}

window.setInterval(function() { // dynamic update suggestion list height
    if (suggestion_list.children.length <= 8) {
        suggestion_list.style.overflowY = 'hidden';
        suggestion_list.style.height = 'fit-content';
    } else {
        suggestion_list.style.overflowY = 'scroll';
        suggestion_list.style.height = '12em';
    }
}, 200);

// parse search param and display query result
const query_str = window.location.search;
const url_params = new URLSearchParams(query_str);
if (url_params.get("key") !== null) {
    query_text(url_params.get("key"));
    toggle_suggestion(false);
}
suggestion_list.innerText = '';
suggestion_list.appendChild(create_suggestion('私'));
