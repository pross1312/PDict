const http                   = new XMLHttpRequest();
const server_nextword_addr   = "http://localhost:9999/nextword";
let keyword_box              = document.getElementById("keyword");
let pronoun_box              = document.getElementById("pronounciation");
let def_list                 = document.getElementById("definition-list");
let usage_list               = document.getElementById("usage-list");
let def_region               = document.getElementById("definition-region");
let usage_region             = document.getElementById("usage-region");
let def_header               = document.getElementById("definition-header");
let usage_header             = document.getElementById("usage-header");
let show_answer_button       = document.getElementById("show-answer");
let is_show                  = false;

http.addEventListener("load", function() {
    if (this.status == 404) {
        keyword_box.innerText = "No definition found"
        console.log(this.response);
        return;
    } else if (this.getResponseHeader("Content-Type").includes("application/json")) {
        data = JSON.parse(this.response);
        if (data == null) {
            console.log(`[ERROR] Can't regconize data ${this.responseText}`);
        } else if (data.Keyword != null) {
            display_entry(data);
        }
    } else if (this.responseText === "No words to learn") {
        keyword_box.innerText = this.responseText;
    } else {
        alert(`Server send '${this.responseText}'`);
    }
})

function next_word() {
    pronoun_box.classList.remove("show");
    def_region.classList.remove("show");
    usage_region.classList.remove("show");
    http.open("GET", server_nextword_addr);
    http.send();
}

function display_entry(data) {
    // input_box.value = data.Keyword;
    def_header.innerText = "Definition";
    usage_header.innerText = "Usage";
    keyword_box.innerText = data.Keyword;
    pronoun_box.innerText = data.Pronounciation === "" ? "----------" : data.Pronounciation;
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

show_answer_button.onclick = function(e) {
    pronoun_box.classList.add("show");
    def_region.classList.add("show");
    usage_region.classList.add("show");
}

window.onkeydown = function(e) {
    switch (e.key) {
    case "ArrowRight":
        next_word();
        break;
    default:
        console.log(e.key);
    }
}

next_word();
