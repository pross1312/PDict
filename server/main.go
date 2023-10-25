package main

import (
    "math/rand"
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

type Entry struct {
    Keyword string
    Definition [][]string
    Pronounciation string
    Usage []string
}
type Dictionary = map[string]Entry
type RelatedWords = map[string][]string
type MyServer struct {}

const (
    INIT_ARRAY_BUFFER = 8
    SERVER_ADDR = "localhost:9999"
    WEB_ROOT = "../websrc"
)

var (
    SERVER_DATA_FILE_PATH = "dictionary_data"
    Dict = make(Dictionary)
    content_types = map[string]string{
        ".html": "text/html",
        ".css": "text/css",
        ".js": "text/javascript",
    }
    related_word_mutex sync.Mutex // for thread save because http.ListenAndServe probably run on another goroutine
    Related_words = make(RelatedWords)
    used_words []string
    unused_words []string
)

func prettyPrint(i interface{}) string {
    s, _ := json.MarshalIndent(i, "", "\t")
    return string(s)
}

func dump_request(req *http.Request) {
    req_str, _ := httputil.DumpRequest(req, true)
    fmt.Println(string(req_str))
}

func update_related_words_for_key(word string) {
    if word == "" {
        fmt.Println("[WARNING] Client try to update with empty key")
        return
    }
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

func process_list(wt http.ResponseWriter, req *http.Request) {
    list := make([]string, 0, len(Dict))
    for k, _ := range Dict { list = append(list, k) }
    json_data, err := json.Marshal(list)
    if Check_err(err, false, "Can't parse json for `list` request") {
        wt.WriteHeader(http.StatusInternalServerError)
        wt.Write([]byte(fmt.Sprintf("[ERROR] %s\n\t[INFO] Can't parse json", err.Error())))
    } else {
        fmt.Println("Sent " + string(json_data))
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
        wt.Write([]byte(fmt.Sprintf("Error: %s\nCan't serve file %s", err.Error(), file_path)))
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
        temp := unused_words
        unused_words = used_words
        used_words = temp
        fmt.Println("[INFO] Switch used and unused")
    }
    // TODO: Maybe some data race will happen here because i also change unused_words and used_words when add new entry
    //       which probably run in different thread
    // TODO: Maybe add a mutex
    index := rand.Intn(len(unused_words))
    key := unused_words[index]
    unused_words[index] = unused_words[len(unused_words)-1]
    unused_words = unused_words[:len(unused_words)-1]
    used_words = append(used_words, key)
    if entry, found := Dict[key]; found {
        json_data, err := json.Marshal(entry)
        if Check_err(err, false, "Can't parse json for `nextword` request") {
            wt.WriteHeader(http.StatusInternalServerError)
            wt.Write([]byte(fmt.Sprintf("[ERROR] %s\n\t[INFO] Can't parse json", err.Error())))
        } else {
            wt.Header().Set("Content-Type", "application/json")
            wt.WriteHeader(http.StatusOK)
            wt.Write(json_data)
        }
    } else {
        fmt.Println("[ERROR] Can't find", key, len(unused_words), len(Dict))
        wt.WriteHeader(http.StatusInternalServerError)
        fmt.Fprintf(wt, "[ERROR] Unused list probably is invalid '%s'", key)
    }
}

func remove_all_entry(words []string) {
    for _, word := range words { delete(Dict, word) }
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
        } else if (req.URL.Path == "/list") {
            process_list(wt, req)
        } else if (req.URL.Path == "/nextword") {
            process_nextword(wt, req)
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
        } else {
            Dict[entry.Keyword] = entry;
            used_words = append(used_words, entry.Keyword)
            fmt.Printf("[INFO] Update %s\n", prettyPrint(entry))
            fmt.Fprint(wt, "[INFO] Successfully update")
            save_dict(SERVER_DATA_FILE_PATH);
        }
    case "DELETE":
        var words []string
        err := json.NewDecoder(req.Body).Decode(&words)
        if Check_err(err, false, "Can't read DELETE request body") {
            dump_request(req)
            wt.WriteHeader(http.StatusInternalServerError)
            wt.Write([]byte(fmt.Sprintf("[ERROR] %s\n\t[INFO] Can't read body", err.Error())))
        } else {
            remove_all_entry(words)
            fmt.Println("[INFO] Delete ", words)
            fmt.Fprint(wt, "[INFO] Successfully delete")
            save_dict(SERVER_DATA_FILE_PATH);
        }
    case "OPTIONS":
        wt.Header().Set("Access-Control-Allow-Methods", "OPTIONS, GET, POST, DELETE")
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
    if (len(os.Args) == 2) {
        SERVER_DATA_FILE_PATH = os.Args[1];
    }
    fmt.Printf("[INFO] Dictionary file `%s`\n", SERVER_DATA_FILE_PATH)
    dict_data, err := os.ReadFile(SERVER_DATA_FILE_PATH)
    Check_err(err, false, fmt.Sprintf("Can't read dictionary from file `%s`", SERVER_DATA_FILE_PATH))
    json.Unmarshal(dict_data, &Dict)
    used_words = make([]string, 0, len(Dict) + INIT_ARRAY_BUFFER)
    unused_words = make([]string, len(Dict), len(Dict) + INIT_ARRAY_BUFFER)
    i := 0;
    for _, v := range Dict {
        unused_words[i] = v.Keyword
        i++
    }
    fmt.Println(unused_words);
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
