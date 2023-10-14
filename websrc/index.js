let input_box = document.getElementById("main-input");
let sl = document.getElementById("suggestion-list");
let on_display_def = false;
const http = new XMLHttpRequest();
const query_server_addr = "http://localhost:9999/query";

http.addEventListener("load", function() {
    if (this.status == 404) {
        document.getElementById("keyword").innerText = "No definition found"
        console.log(this.response);
        return;
    }
    data = JSON.parse(this.response);
    if (data == null) {
        console.log(`[ERROR] Can't regconize data ${this.responseText}`);
    } else {
        display(data);
        console.log(data);
    }
})

function clear_def_region() {
    document.getElementById("keyword").innerText = "";
    document.getElementById("pronounciation").innerText = "";
    document.getElementById("definition-list").innerHTML = "";
}

function display(data) {
    document.getElementById("keyword").innerText = data.Keyword;
    document.getElementById("pronounciation").innerText = data.Pronounciation;
    let defs_list = document.getElementById("definition-list");
    defs_list.innerHTML = "";
    for (def of data.Definition) {
        let list_item = document.createElement("li");
        list_item.innerText = def.join(", ");
        defs_list.appendChild(list_item);
    }
}

function query_text(text) {
    http.open("GET", query_server_addr + `?key=${text}`);
    http.send();
}

function toggle_suggestion(show) {
    let sg = document.getElementById('suggestion-region');
    if (show) sg.classList.add('show');
    else sg.classList.remove('show');
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
    }, 150);
});
input_box.addEventListener('keydown', function(ev) {
    switch(ev.key) {
    case 'Enter': 
        if (input_box.value !== "") {
            clear_def_region();
            query_text(input_box.value);
            toggle_suggestion(false);
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
        input_box.value = text;
        clear_def_region();
        query_text(input_box.value);
    }
    button.innerHTML = text;
    button.classList.toggle('suggestion-item');
    dt.appendChild(button);
    return dt;
}

window.setInterval(function() { // dynamic update suggestion list height
    if (sl.children.length <= 8) {
        sl.style.overflowY = 'hidden';
        sl.style.height = 'fit-content';
    } else {
        sl.style.overflowY = 'scroll';
        sl.style.height = '12em';
    }
}, 200);

sl.innerText = '';
sl.appendChild(create_suggestion('私'));