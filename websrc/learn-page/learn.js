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

async function send_request(addr) {
    const response = await fetch(addr);
    if (response.status == 200) {
        if (response.headers.get("Content-Type").includes("application/json")) {
            const data = await response.json();
            return data;
        } else {
            const str = await response.text();
            return str;
        }
    } else {
        throw new Error("Can't recognize response body data");
    }
}

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
        }
    } else if (this.responseText === "No words to learn") {
        keyword_box.innerText = this.responseText;
    } else {
        alert(`Server send '${this.responseText}'`);
    }
})

async function next_word() {
    try {
        let result = await send_request(server_nextword_addr);
        if (result === "No words to learn") {
            keyword_box.innerText = result;
        } else {
            display_entry(result);
        }
        pronoun_box.classList.remove("show");
        def_region.classList.remove("show");
        usage_region.classList.remove("show");
    } catch (err) {
        console.log(err);
    }
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
        if (pronoun_box.classList.contains("show")) next_word();
        else show_answer_button.click();
        break;
    default:
    }
}

next_word();
