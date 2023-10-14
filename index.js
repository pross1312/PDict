let input_box = document.getElementById("main-input");
let sl = document.getElementById("suggestion-list");
let utf8_decoder = new TextDecoder();
let utf8_encoder = new TextEncoder();
const http = new XMLHttpRequest();
const query_server_addr = "http://localhost:9999/query";

http.addEventListener("load", function() {
    if (this.status == 404) {
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

function display(data) {
    document.getElementById("keyword").innerHTML = data.keyword;
    document.getElementById("pronounciation").innerHTML = data.pronounciation;
    document.getElementById("meaning").innerHTML = data.meaning.join(" ");
}

function query_text(text) {
    console.log()
    http.open("GET", query_server_addr + `?key=${text}`)
    http.send()
}
input_box.addEventListener('keydown', function(ev) {
    switch(ev.key) {
    case 'Enter': 
        if (input_box.value !== "") query_text(input_box.value)
    }
})
input_box.onblur = function() { window.setTimeout(function() { // to set text first before hide suggestions
        let sg = document.getElementById('suggestion-region')
        sg.classList.remove('show')
    }, 200)
}

function update_suggestion(suggestions) {
    let sug = document.getElementsByClassName("suggestion-item") || []
    for (let suggestion of sug) {
        suggestion.onclick = function () {
            input_box.value = suggestion.innerHTML
        }
    }
}

function create_suggestion(text) {
    let dt = document.createElement('dt')
    let button = document.createElement('button')
    button.onclick = function() {
        input_box.value = text
        on_selecting_suggestion = false
    }
    button.innerHTML = text
    button.classList.toggle('suggestion-item')
    dt.appendChild(button)
    return dt
}

sl.innerText = ''
sl.appendChild(create_suggestion('heljqweiojqw'))
sl.appendChild(create_suggestion('heljqweiojqw'))
sl.appendChild(create_suggestion('heljqweiojqw'))
sl.appendChild(create_suggestion('heljqweiojqw'))
sl.appendChild(create_suggestion('jijeqwo'))

if (sl.children.length <= 8) {
    sl.style.overflowY = 'hidden'
    sl.style.height = `${sl.children.length}em`
}

window.setInterval(function() {
    if (document.activeElement === input_box && input_box.value.length > 0) {
        let sg = document.getElementById('suggestion-region')
        sg.classList.add('show')
    } else if (input_box.value.length == 0) {
        let sg = document.getElementById('suggestion-region')
        sg.classList.remove('show')
    }
    if (sl.children.length <= 8) {
        sl.style.overflowY = 'hidden'
        sl.style.height = 'fit-content'
    } else {
        sl.style.overflowY = 'scroll'
        sl.style.height = '12em'
    }
}, 100)