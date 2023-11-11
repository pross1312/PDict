$(function() {
    const query_addr = "http://localhost:9999/query";
    const update_addr = "http://localhost:9999/update";
    const params = new URLSearchParams(window.location.search);
    const key = params.get("key");
    if (key != null) {
        $("#data-form").removeClass("d-none");
        $.ajax({
            url: query_addr + `?key=${key}`,
            method: "GET",
            success: display_entry,
            error: function() {
                display_entry({Keyword: key, Pronounciation: "", Definition: [[]], Usage: []});
            }
        });
    }
    $("#search-submit").on("click", function() {
        const text = $(this).prev().val().trim();
        if (text != "") {
            window.open(`http://${window.location.host}/?key=${text}`,"_self")
        }
    });
    function display_entry(data) {
        $("#data-form [name='Keyword']").val(data.Keyword);
        if (data.Keyword == null) alert("[ERROR] Invalid entry, keyword can't be null");
        if (data.Pronounciation != null) $("#data-form [name='Pronounciation']").val(data.Pronounciation);
        if (data.Definition != null) for (let def of data.Definition) {
            if (def.length == 0) continue;
            $("#new-def").val(def.join(", "));
            $("#new-def").trigger("new-item");
        }
        if (data.Usage != null) for (let usage of data.Usage) {
            $("#new-usage").val(usage);
            $("#new-usage").trigger("new-item");
        }
        if (data.Group != null) for (let group of data.Group) {
            add_group(group);
        }
    }
    function list_input_item_click() {
        $(this).removeClass(["btn"]);
        $(this).addClass("form-control");
        $(this).removeAttr("readonly");
    }
    function list_input_item_keydown(e) {
        if (e.key == "Enter") {
            $(this).addClass(["btn"]);
            $(this).removeClass("form-control");
            $(this).attr("readonly", true);
        }
    }
    $("#new-usage").on("new-item", function(e) {
        const classes = "text-start fs-3 text-light fw-bold list-input-item btn bg-none mb-1";
        const val = $(this).val();
        const input = `<input class="${classes}" placeholder="Usage" name="Usage[]" value="${val}" readonly/>`;
        const button = `<span class=" d-inline-flex flex-column justify-content-center"><button type="button" class="btn-close d-inline"></button></span>`;
        let node = $(`<li class="d-flex">${button} ${input}</li>`);
        node.insertBefore($(this).parent())
        node.find("input").on("click", list_input_item_click);
        node.find("input").on("keydown", list_input_item_keydown);
        node.find("button").on("click", function(){
            node.remove();
            $("#data-submit").click();
        });
        $(this).val("");
    });
    $("#new-usage").on("keydown", function(e) {
        if (e.key == "Enter") {
            $(this).val($(this).val().trim());
            if ($(this).val() == "") return false;
            $(this).trigger("new-item");
        }
    });
    $("#new-def").on("new-item", function(e) {
        const classes = "text-start fs-3 text-light fw-bold list-input-item btn bg-none mb-1";
        const val = $(this).val();
        const input = `<input class="${classes}" placeholder="Definition" name="Definition[]" value="${val}" readonly/>`;
        const button = `<span class=" d-inline-flex flex-column justify-content-center"><button type="button" class="btn-close d-inline"></button></span>`;
        let node = $(`<li class="d-flex">${button} ${input}</li>`);
        node.insertBefore($(this).parent())
        node.find("input").on("click", list_input_item_click);
        node.find("input").on("keydown", list_input_item_keydown);
        node.find("button.btn-close").on("click", function() {
            node.remove();
            $("#data-submit").click();
        });
        $(this).val("");
    });
    $("#new-def").on("keydown", function(e) {
        if (e.key == "Enter") {
            $(this).val($(this).val().trim());
            if ($(this).val() == "") return false;
            $(this).trigger("new-item");
        }
    });
    $("#data-submit").on("click", function(e) {
        const data = {};
        $("#data-form").serializeArray().forEach(x => {
            if (x.name.endsWith("[]")) {
                x.name = x.name.split("[]")[0];
                data[x.name] = data[x.name] || [];
                if (x.name == "Definition") data[x.name].push(x.value.split(",").map(x => x.trim()));
                else data[x.name].push(x.value);
            } else {
                data[x.name] = x.value;
            }
        });
        data.Definition = data.Definition || [[]];
        data.Usage = data.Usage || [];
        data.Group = data.Group || [];
        console.log(data.Group);
        if (data.Keyword === "") {
            alert("[INFO] Can't update empty entry, please fill in `keyword`");
            return;
        }
        $.ajax({
            url: update_addr,
            method: "POST",
            data: JSON.stringify(data),
            success: function(data) {
                console.log(data);
            }
        });
    });
    $("#data-form [name='Pronounciation']").on("change", function() {
        const val = $(this).val().trim();
        $(this).val(val);
    });
    function toggle_new_group(show_input) {
        $("#new-group-input").val("");
        if (!show_input) {
            $("#new-group-input").parent().addClass("d-none");
            $("#new-group-input").parent().next().removeClass("d-none");
        } else {
            $("#new-group-input").parent().removeClass("d-none");
            $("#new-group-input").parent().next().addClass("d-none");
            $("#new-group-input").focus();
        }
    }
    $("#new-group-input").on("blur", function(e) {
        if ($(this).val().trim() === "") {
            $(this).trigger("change"); // change will hide input if value is empty
            return false;
        }
    });
    $("#new-group-input").on("keydown", function(e) {
        if (e.key == "Enter" && $(this).val().trim() === "") {
            $(this).trigger("change"); // change will hide input if value is empty
            return false;
        }
    });
    $("#new-group-button").on("click", function(e) { toggle_new_group(true); });
    function add_group(val) {
        const group_classes = "border fs-6 border-1 rounded-0 flex-grow-0 btn-sm btn btn-secondary px-0";
        let new_group = $(`<input type="text" size="${val.length}" class="${group_classes}" name="Group[]" value=${val} readonly />`);
        new_group.on("dblclick", function() {
            $(this).remove();
            $("#data-submit").trigger("click");
        });
        new_group.on("click", function() {
            $(this).removeClass("btn-secondary");
            $(this).addClass("btn-danger");
        });
        new_group.on("blur", function() {
            $(this).addClass("btn-secondary");
            $(this).removeClass("btn-danger");
        })
        new_group.prependTo($("#group-region"));
    }
    $("#new-group-input").on("change", function(e) {
        const val = $(this).val().trim();
        toggle_new_group(false);
        if (val === "") return;
        else add_group(val);
    });
})
