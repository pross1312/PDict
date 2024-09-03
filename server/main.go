package main

import (
    "slices"
    "math/rand"
    "runtime"
    "strings"
    "path/filepath"
    "os"
    "fmt"
    "encoding/json"
    "net/http"
    "net/http/httputil"
)

type Entry struct {
    Keyword string
    Pronounciation string
    Definition []string
    Usage []string
    Group []string
}
type Dictionary = map[string]Entry
type MyServer struct {}

const (
    INIT_ARRAY_BUFFER = 8
    SERVER_ADDR = "localhost:9999"
    WEB_ROOT = "../websrc"
)

var (
    SERVER_DATA_FILE_PATH = ".dictionary_data"
	USED_WORDS_FILE_PATH = SERVER_DATA_FILE_PATH + ".used"
    Dict = make(Dictionary)
    Group = map[string][]string{
        "Verb": []string{},
        "Noun": []string{},
        "Adjective": []string{},
    }
    content_types = map[string]string{
        ".html": "text/html",
        ".css": "text/css",
        ".js": "text/javascript",
    }
    used_words []string = make([]string, 0, INIT_ARRAY_BUFFER)
    unused_words []string = make([]string, 0, INIT_ARRAY_BUFFER)
	current_learn_group = ""
)

func prettyPrint(i interface{}) string {
    s, _ := json.MarshalIndent(i, "", "\t")
    return string(s)
}

func dump_request(req *http.Request) {
    req_str, _ := httputil.DumpRequest(req, true)
    fmt.Println(string(req_str))
}

func process_suggest(wt http.ResponseWriter, req *http.Request) {
    key := req.URL.Query().Get("key")
    log(INFO, "Client request for suggestion of `%s`",  key)
    result := make([]string, 0, INIT_ARRAY_BUFFER)
    for word, _ := range Dict {
        if strings.Contains(word, key) {
            result = append(result, word)
        }
    }
    json_data, err := json.Marshal(struct{ Suggestion []string }{ result })
    if Check_err(err, false, "Can't parse json for `suggest` request") {
        wt.WriteHeader(http.StatusInternalServerError)
        wt.Write([]byte(log_format(ERROR, err.Error())))
    } else {
        wt.Header().Set("Content-Type", "application/json")
        wt.WriteHeader(http.StatusOK)
        wt.Write(json_data)
    }
}

func process_query(wt http.ResponseWriter, req *http.Request) {
    key := req.URL.Query().Get("key")
    log(INFO, "Client request for key = `%s`",  key)
    if entry, found := Dict[key]; found {
        json_data, err := json.Marshal(entry)
        if Check_err(err, false, "Can't parse json for `query` request") {
            wt.WriteHeader(http.StatusInternalServerError)
            wt.Write([]byte(log_format(ERROR, err.Error())))
        } else {
            wt.Header().Set("Content-Type", "application/json")
            wt.WriteHeader(http.StatusOK)
            wt.Write(json_data)
        }
    } else {
        wt.WriteHeader(http.StatusNotFound)
        wt.Write([]byte(log_format(WARNING, "No entry for %s", key)))
    }
}

func process_list(wt http.ResponseWriter, req *http.Request) {
    var list []string
    group := req.URL.Query().Get("group")
    if req.URL.Query().Has("group") && group != "" {
        list = make([]string, 0, len(Group[group]))
        for _, group := range Group[group] { list = append(list, group) }
    } else {
        list = make([]string, 0, len(Dict))
        for keyword, _ := range Dict { list = append(list, keyword) }
    }
    json_data, err := json.Marshal(list)
    if Check_err(err, false, "Can't parse json for `list` request") {
        wt.WriteHeader(http.StatusInternalServerError)
        wt.Write([]byte(log_format(ERROR, err.Error())))
    } else {
        log(INFO, "Sent %d words", len(list))
        wt.Header().Set("Content-Type", "application/json")
        wt.WriteHeader(http.StatusOK)
        wt.Write(json_data)
    }
}

func serve_file(wt http.ResponseWriter, req *http.Request) {
    file_path := WEB_ROOT
    if req.URL.Path == "/" {
        file_path += "/index.html"
    } else {
        file_path += req.URL.Path
    }
    file_path = filepath.FromSlash(file_path)

    data, err := os.ReadFile(file_path)
    if Check_err(err, false, "Can't read file " + file_path) {
        wt.WriteHeader(http.StatusNotFound)
		wt.Write([]byte(log_format(ERROR, "Can't serve file %s, %s", file_path, err.Error())))
    } else {
        wt.Header().Set("Content-Type", content_types[filepath.Ext(file_path)])
        wt.Write(data)
    }
}

func process_nextword(wt http.ResponseWriter, req *http.Request) {
    if len(unused_words) == 0 { // switch used and unused
        if len(used_words) == 0 {
            wt.WriteHeader(http.StatusOK)
            fmt.Fprint(wt, "No words to learn")
            return
        }
		if current_learn_group != "" {
			new_len := len(used_words)
			var i int
			for i = len(used_words)-1; i >= 0; i-- {
				if slices.Contains(Dict[used_words[i]].Group, current_learn_group) {
					new_len -= 1
					used_words[i] = used_words[new_len]
				}
			}
			used_words = used_words[:new_len]
			unused_words = Group[current_learn_group]
		} else {
			temp := unused_words
			unused_words = used_words
			used_words = temp
		}
        log(INFO, "Switch used and unused")
        log(INFO, "%d words left to learn.", len(unused_words))
    }
    index := rand.Intn(len(unused_words))
    key := unused_words[index]
    if entry, found := Dict[key]; found {
        json_data, err := json.Marshal(entry)
        if Check_err(err, false, "Can't parse json for `nextword` request") {
            wt.WriteHeader(http.StatusInternalServerError)
            wt.Write([]byte(log_format(ERROR, err.Error())))
        } else {
            wt.Header().Set("Content-Type", "application/json")
            wt.WriteHeader(http.StatusOK)
            wt.Write(json_data)
			// TODO: Maybe some data race will happen here because i also change unused_words and used_words when add new entry
			//       which probably run in different thread
			// TODO: Maybe add a mutex
			unused_words[index] = unused_words[len(unused_words)-1]
			unused_words[len(unused_words)-1] = key
			unused_words = unused_words[:len(unused_words)-1]
			used_words = append(used_words, key)
			save_used_words()
        }
    } else {
        log(ERROR, "Can't find",  key, len(unused_words), len(Dict))
        wt.WriteHeader(http.StatusInternalServerError)
        fmt.Fprintf(wt, "[ERROR] Unused list probably is invalid '%s'", key)
    }
}

func remove_entries(words []string) {
    for _, word := range words {
		delete(Dict, word)
		if idx := slices.Index(unused_words, word); idx != -1 {
			unused_words[idx] = unused_words[len(unused_words)-1]
			unused_words = unused_words[:len(unused_words)-1]
		} else if idx := slices.Index(used_words, word); idx != -1 {
			used_words[idx] = used_words[len(used_words)-1]
			used_words = used_words[:len(used_words)-1]
		} else {
			panic("Should never happen");
		}
	}
}

func (sv MyServer) ServeHTTP(wt http.ResponseWriter, req *http.Request) {
    wt.Header().Set("Access-Control-Allow-Origin", req.Header.Get("Origin"))
    switch req.Method {
    case "GET":
		log(INFO, "Client request for '%s' with query: %s",  req.URL.EscapedPath(), req.URL.Query())
        if req.URL.Path == "/query" {
            process_query(wt, req)
        } else if (req.URL.Path == "/suggest") {
            process_suggest(wt, req)
        } else if (req.URL.Path == "/list") {
            process_list(wt, req)
        } else if (req.URL.Path == "/nextword") {
            process_nextword(wt, req)
        } else if (req.URL.Path == "/change-learn-group") {
            group := req.URL.Query().Get("group")
			current_learn_group = group
			unused_words = unused_words[:0]
            for keyword, entry := range(Dict) {
                if !slices.Contains(used_words, keyword) && (group == "" || slices.Contains(entry.Group, group)) {
                    unused_words = append(unused_words, keyword)
                }
            }
            fmt.Fprintf(wt, log_format(INFO, "Change group to %s", group))
        } else if (req.URL.Path == "/list-group") {
            // TODO: check for data race
            groups := make([]string, 0, len(Group))
            for group_name, key_words := range Group {
				if !(len(key_words) == 0 && group_name != "Noun" && group_name != "Adjective" && group_name != "Verb") {
					groups = append(groups, group_name)
				}
            }
            if len(groups) == 0 {
                groups = append(groups, "Verb", "Noun", "Adjective")
            }
			log(INFO, "Sent %d groups", len(groups))
            json_data, err := json.Marshal(struct{ Group []string }{ groups })
            if Check_err(err, false, "Can't parse json for `nextword` request") {
                wt.WriteHeader(http.StatusInternalServerError)
                wt.Write([]byte(log_format(ERROR, err.Error())))
            } else {
                wt.Header().Set("Content-Type", "application/json")
                wt.WriteHeader(http.StatusOK)
                wt.Write(json_data)
            }
        } else {
            serve_file(wt, req)
        }
    case "POST":
        var entry Entry
        err := json.NewDecoder(req.Body).Decode(&entry)
        if Check_err(err, false, "Can't read POST request body") {
            dump_request(req)
            wt.WriteHeader(http.StatusInternalServerError)
			wt.Write([]byte(log_format(ERROR, "Can't read body, %s", err.Error())))
        } else {
            var prev_group = Dict[entry.Keyword].Group
            Dict[entry.Keyword] = entry;
            for _, group := range prev_group {
                if slices.Index(entry.Group, group) == -1 {
                    Group[group] = slices.DeleteFunc(Group[group], func(x string)bool{
                        return entry.Keyword == x
                    });
                }
            }
            for _, group := range entry.Group {
                if slices.Index(Group[group], entry.Keyword) == -1 {
                    Group[group] = append(Group[group], entry.Keyword)
                }
            }
            used_words = append(used_words, entry.Keyword)
            log(INFO, "Update %s",  prettyPrint(entry))
            fmt.Fprintf(wt, log_format(INFO, "Successfully update %s", entry.Keyword))
            save_dict();
        }
    case "DELETE":
        var words []string
        err := json.NewDecoder(req.Body).Decode(&words)
        if Check_err(err, false, "Can't read DELETE request body") {
            dump_request(req)
            wt.WriteHeader(http.StatusInternalServerError)
            wt.Write([]byte(log_format(ERROR, "Can't read body, %s", err.Error())))
        } else {
            remove_entries(words)
            log(INFO, "Delete %s",  words)
            fmt.Fprint(wt, log_format(INFO, "Successfully delete"))
            save_dict();
			save_used_words();
        }
    case "OPTIONS":
        wt.Header().Set("Access-Control-Allow-Methods", "OPTIONS, GET, POST, DELETE")
        wt.Header().Set("Access-Control-Allow-Headers", "Content-Length, Content-Type")
    default:
        dump_request(req)
    }
}

func save_used_words() {
	data, err := json.Marshal(used_words)
    Check_err(err, false, "Can't convert used_words array to to json object")
	err = os.WriteFile(USED_WORDS_FILE_PATH, data, os.FileMode(0644))
    Check_err(err, false, fmt.Sprintf("Can't save used_words to file `%s`", USED_WORDS_FILE_PATH))
}

func save_dict() {
    data, err := json.Marshal(Dict)
    Check_err(err, true, "Can't convert map to json object")
    err = os.WriteFile(SERVER_DATA_FILE_PATH, data, os.FileMode(0644))
    Check_err(err, true, fmt.Sprintf("Can't save dictionary to file `%s`", SERVER_DATA_FILE_PATH))
}

func load_dict() {
    data, err := os.ReadFile(SERVER_DATA_FILE_PATH)
    Check_err(err, false, fmt.Sprintf("Can't read dictionary from file `%s`", SERVER_DATA_FILE_PATH))
    json.Unmarshal(data, &Dict)
	data, err = os.ReadFile(USED_WORDS_FILE_PATH)
	if err != nil {
		log(WARNING, "Can't read last used_words file, %s", err.Error())
		used_words = make([]string, 0, len(Dict) + INIT_ARRAY_BUFFER)
	} else {
		err = json.Unmarshal(data, &used_words)
		Check_err(err, false, fmt.Sprintf("Can't read used_words from file `%s`", USED_WORDS_FILE_PATH))
	}
    for keyword, entry := range Dict {
        if entry.Group == nil {
            entry.Group = make([]string, 0, INIT_ARRAY_BUFFER);
            Dict[keyword] = entry;
        }
		if slices.Index(used_words, keyword) == -1 {
			unused_words = append(unused_words, keyword)
		}
        for _, g := range entry.Group {
            Group[g] = append(Group[g], entry.Keyword)
        }
    }
}

func start_default_browser() {
    var attr os.ProcAttr
    switch runtime.GOOS {
    case "windows":
        _, err := os.StartProcess("C:\\Windows\\System32\\cmd.exe", []string{"C:\\Windows\\System32\\cmd.exe", "http://" + SERVER_ADDR}, &attr)
        Check_err(err, false, "Can't start default server", fmt.Sprintf("Please open `http://%s` on a browser\n", SERVER_ADDR))
    case "linux":
        _, err := os.StartProcess("/usr/bin/xdg-open", []string{"/usr/bin/xdg-open", "http://" + SERVER_ADDR}, &attr)
        Check_err(err, false, "Can't start default server", fmt.Sprintf("Please open `http://%s` on a browser\n", SERVER_ADDR))
    default:
        log(WARNING, "Unknown platform, the program may not work correctly")
        log(INFO, "Please open `http://%s` on a browser",  SERVER_ADDR)
    }
}

func main() {
    log(INFO, "Root on %s",  WEB_ROOT)
    if (len(os.Args) == 2) {
        SERVER_DATA_FILE_PATH = os.Args[1];
		USED_WORDS_FILE_PATH = SERVER_DATA_FILE_PATH + ".used"
    }
    log(INFO, "Dictionary file `%s`",  SERVER_DATA_FILE_PATH)
	load_dict()
	log(INFO, "Number of entries: %d", len(Dict))
	log(INFO, "Number of unused words: %d", len(unused_words))
	log(INFO, "Number of Used words: %d", len(used_words))
    start_default_browser()
    log(INFO, "Server start on %s",  SERVER_ADDR)
    http.ListenAndServe(SERVER_ADDR, MyServer{})
}

type LogLevel int
const (
	WARNING LogLevel = iota
	ERROR LogLevel = iota
	INFO LogLevel = iota
)

func log_format(level LogLevel, format string, args ...any) string {
	var builder strings.Builder
	switch level {
	case WARNING:
		builder.WriteString("[Warning] ")
	case ERROR:
		builder.WriteString("[Error] ")
	case INFO:
		builder.WriteString("[Info] ")
	}
	builder.WriteString(fmt.Sprintf(format, args...))
	builder.WriteByte('\n')
	return builder.String()
}

func log(level LogLevel, format string, args ...any) {
	fmt.Print(log_format(level, format, args...))
}

func Check_err(err error, fatal bool, info ...string) bool {
    if err != nil {
		var log_level LogLevel
        if fatal {
			log_level = ERROR
		} else {
			log_level = WARNING
		}
		log(log_level, err.Error())
        for _, v := range info {
			log(INFO, "\t %s", v)
        }
        if fatal {
            os.Exit(1)
        }
        return true;
    }
    return false;
}
