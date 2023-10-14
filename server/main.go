package main

import (
    "os"
    "fmt"
    "encoding/json"
    "net/http"
    "net/http/httputil"
)

const (
    SERVER_DATA_FILE_PATH = "data/dictionary_data"
    SERVER_ADDR = "localhost:9999"
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
)

func prettyPrint(i interface{}) string {
    s, _ := json.MarshalIndent(i, "", "\t")
    return string(s)
}

func dump_request(req *http.Request) {
    req_str, _ := httputil.DumpRequest(req, true)
    fmt.Println(string(req_str))
}

func (sv MyServer) ServeHTTP(wt http.ResponseWriter, req *http.Request) {
    wt.Header().Set("Access-Control-Allow-Origin", "http://localhost:13123")
    switch req.Method {
    case "GET":
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
    case "POST":
        dump_request(req)
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
        wt.Header().Set("Access-Control-Allow-Origin", "http://localhost:13123")
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
    err = os.WriteFile(file_path, data, os.FileMode(0777))
    if err != nil {
        fmt.Println("[ERROR] %s\n\t[INFO] Can't save dictionary to file `%s`\n", err.Error(), file_path)
        os.Exit(1)
    }
}

func main() {
    dict_data, err := os.ReadFile(SERVER_DATA_FILE_PATH)
    if err != nil {
        fmt.Println("[ERROR] %s\n\t[INFO] Can't read dictionary from file `%s`\n", err.Error(), SERVER_DATA_FILE_PATH)
        os.Exit(1)
    }
    json.Unmarshal(dict_data, &Dict)
    http.ListenAndServe(SERVER_ADDR, MyServer{})
}
