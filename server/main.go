package main

import (
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
type MyServer struct {}

var (
    Dict = make(Dictionary)
    content_types = map[string]string{
        ".html": "text/html",
        ".css": "text/css",
        ".js": "text/javascript",
    }
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
    if runtime.GOOS == "Windows" {
        return strings.ReplaceAll(file_path, "/", "\\")
    }
    return file_path
}

func process_query(wt http.ResponseWriter, req *http.Request) {
    key := req.URL.Query().Get("key")
    fmt.Printf("[INFO] Client request for key = `%s`\n", key)
    if entry, found := Dict[key]; found {
        json_data, err := json.Marshal(entry)
        if err != nil {
            fmt.Printf("[ERROR] %s\n", err.Error())
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
    fmt.Printf("[INFO] Send file %s\n", independent_path(file_path))
    data, err := os.ReadFile(independent_path(file_path))
    if err != nil {
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
        } else {
            serve_file(wt, req)
        }
    case "POST":
        var entry Entry
        err := json.NewDecoder(req.Body).Decode(&entry)
        if err != nil {
            fmt.Printf("[ERROR] %s\n\t[INFO] Can't read Post request body\n", err.Error())
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
    if err != nil {
        fmt.Println("[ERROR] %s\n\t[INFO] Can't convert map to json object\n", err.Error(), file_path)
        os.Exit(1)
    }
    err = os.WriteFile(file_path, data, os.FileMode(0644))
    if err != nil {
        fmt.Println("[ERROR] %s\n\t[INFO] Can't save dictionary to file `%s`\n", err.Error(), file_path)
        os.Exit(1)
    }
}

func main() {
    fmt.Printf("[INFO] Root on %s\n", WEB_ROOT)
    dict_data, err := os.ReadFile(SERVER_DATA_FILE_PATH)
    if err != nil {
        fmt.Printf("[ERROR] %s\n\t[INFO] Can't read dictionary from file `%s`\n", err.Error(), SERVER_DATA_FILE_PATH)
    }
    json.Unmarshal(dict_data, &Dict)
    fmt.Printf("[INFO] Server start on %s\n", SERVER_ADDR)
    http.ListenAndServe(SERVER_ADDR, MyServer{})
}
