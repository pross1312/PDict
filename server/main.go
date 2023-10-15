package main

import (
    "slices"
    "sync"
    "runtime"
    "strings"
    "path/filepath"
    "os"
    "fmt"
    "encoding/json"
    "net/http"
    "net/http/httputil"
)

const (
    INIT_ARRAY_BUFFER = 8
    SERVER_ADDR = "localhost:9999"
    SERVER_DATA_FILE_PATH = "dictionary_data"
    WEB_ROOT = "../websrc"
)

type Entry struct {
    Keyword string
    Definition [][]string
    Pronounciation string
    Usage []string
}
type Dictionary = map[string]Entry
type RelatedWords = map[string][]string
type MyServer struct {}

var (
    Dict = make(Dictionary)
    content_types = map[string]string{
        ".html": "text/html",
        ".css": "text/css",
        ".js": "text/javascript",
    }
    related_word_mutex sync.Mutex // for thread save because http.ListenAndServe probably run on another goroutine
    Related_words = make(RelatedWords)
)

func prettyPrint(i interface{}) string {
    s, _ := json.MarshalIndent(i, "", "\t")
    return string(s)
}

func dump_request(req *http.Request) {
    req_str, _ := httputil.DumpRequest(req, true)
    fmt.Println(string(req_str))
}

func independent_path(file_path string) string { // platform independent
    if runtime.GOOS == "windows" {
        return strings.ReplaceAll(file_path, "/", "\\")
    }
    return file_path
}

func update_related_words_for_key(word string) {
    for _, value := range word {
        key := string(value)
        related_word_mutex.Lock()
        if Related_words[key] == nil { Related_words[key] = make([]string, 0, INIT_ARRAY_BUFFER) }
        temp := Related_words[key]
        if index := slices.Index(temp, key); index != -1 {
            Related_words[key] = append(temp, word)
        }
        related_word_mutex.Unlock()
    }
}

func process_suggest(wt http.ResponseWriter, req *http.Request) {
    key := req.URL.Query().Get("key")
    fmt.Printf("[INFO] Client request for suggestion of `%s`\n", key)
    result := make([]string, 0, INIT_ARRAY_BUFFER)
    for word, _ := range Dict {
        if strings.Contains(word, key) {
            result = append(result, word)
        }
    }
    json_data, err := json.Marshal(struct{ Suggestion []string }{ result })
    if Check_err(err, false, "Can't parse json for `suggest` request") {
        wt.WriteHeader(http.StatusInternalServerError)
        wt.Write([]byte(fmt.Sprintf("[ERROR] %s\n\t[INFO] Can't parse json", err.Error())))
    } else {
        wt.Header().Set("Content-Type", "application/json")
        wt.WriteHeader(http.StatusOK)
        wt.Write(json_data)
    }
}

func process_query(wt http.ResponseWriter, req *http.Request) {
    key := req.URL.Query().Get("key")
    fmt.Printf("[INFO] Client request for key = `%s`\n", key)
    if entry, found := Dict[key]; found {
        json_data, err := json.Marshal(entry)
        if Check_err(err, false, "Can't parse json for `query` request") {
            wt.WriteHeader(http.StatusInternalServerError)
            wt.Write([]byte(fmt.Sprintf("[ERROR] %s\n\t[INFO] Can't parse json", err.Error())))
        } else {
            wt.Header().Set("Content-Type", "application/json")
            wt.WriteHeader(http.StatusOK)
            wt.Write(json_data)
        }
    } else {
        wt.WriteHeader(http.StatusNotFound)
        wt.Write([]byte(fmt.Sprintf("No entry for %s", key)))
    }
}

func serve_file(wt http.ResponseWriter, req *http.Request) {
    file_path := WEB_ROOT
    if req.URL.Path == "/" {
        file_path += "/index.html"
    } else {
        file_path += req.URL.Path
    }
    file_path = independent_path(file_path)

    data, err := os.ReadFile(file_path)
    if Check_err(err, false, fmt.Sprintf("Can't read file %s", file_path)) {
        wt.WriteHeader(http.StatusNotFound)
        wt.Write([]byte(fmt.Sprintf("Error: %s\nCan't serve file %s", err.Error(), file_path)))
    } else {
        wt.Header().Set("Content-Type", content_types[filepath.Ext(file_path)])
        wt.Write(data)
    }
}

func (sv MyServer) ServeHTTP(wt http.ResponseWriter, req *http.Request) {
    wt.Header().Set("Access-Control-Allow-Origin", req.Header.Get("Origin"))
    switch req.Method {
    case "GET":
        fmt.Printf("[INFO] Client request for %s\n", req.URL.Path)
        if req.URL.Path == "/query" {
            process_query(wt, req)
        } else if (req.URL.Path == "/suggest") {
            process_suggest(wt, req)
        } else {
            serve_file(wt, req)
        }
    case "POST":
        var entry Entry
        err := json.NewDecoder(req.Body).Decode(&entry)
        if Check_err(err, false, "Can't read POST request body") {
            dump_request(req)
            wt.WriteHeader(http.StatusInternalServerError)
            wt.Write([]byte(fmt.Sprintf("[ERROR] %s\n\t[INFO] Can't read body", err.Error())))
        }
        Dict[entry.Keyword] = entry;
        fmt.Printf("Update %s\n", prettyPrint(entry))
        fmt.Fprint(wt, "SUCCESSFULLY")
        save_dict(SERVER_DATA_FILE_PATH);
    case "OPTIONS":
        wt.Header().Set("Access-Control-Allow-Methods", "OPTIONS, GET, POST")
        wt.Header().Set("Access-Control-Allow-Headers", "Content-Length, Content-Type")
    default:
        dump_request(req)
    }
}

func save_dict(file_path string) {
    data, err := json.Marshal(Dict)
    Check_err(err, true, "Can't convert map to json object")
    err = os.WriteFile(file_path, data, os.FileMode(0644))
    Check_err(err, true, fmt.Sprintf("Can't save dictionary to file `%s`", file_path))
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
        fmt.Println("[WARNING] Unknown platform, the program may not work correctly")
        fmt.Printf("[INFO] Please open `http://%s` on a browser\n", SERVER_ADDR)
    }
}

func main() {
    fmt.Printf("[INFO] Root on %s\n", WEB_ROOT)
    dict_data, err := os.ReadFile(SERVER_DATA_FILE_PATH)
    Check_err(err, false, fmt.Sprintf("Can't read dictionary from file `%s`", SERVER_DATA_FILE_PATH))
    json.Unmarshal(dict_data, &Dict)

    start_default_browser()
    fmt.Printf("[INFO] Server start on %s\n", SERVER_ADDR)
    http.ListenAndServe(SERVER_ADDR, MyServer{})
}

func Check_err(err error, fatal bool, info ...string) bool {
    if err != nil {
        var msg_builder strings.Builder
        if fatal { msg_builder.WriteString("[ERROR] ") } else { msg_builder.WriteString("[WARNING] ") }
        msg_builder.WriteString(err.Error())
        msg_builder.WriteString("\n")
        for _, v := range info {
            msg_builder.WriteString("\t [INFO] ")
            msg_builder.WriteString(v)
        }
        if fatal {
            fmt.Println(msg_builder.String())
            os.Exit(1)
        } else {
            fmt.Println(msg_builder.String())
        }
        return true;
    }
    return false;
}
