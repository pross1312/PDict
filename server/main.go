package main

import (
    "fmt"
    "encoding/json"
    "net/http"
    // "net/http/httputil"
)

const (
    SERVER_ADDR = "localhost:9999"
)

type Entry struct {
    Definition []string
    Pronounciation string
    Usage []string
}
type Dictionary = map[string]Entry
type MyServer struct {}

var (
    Dict = Dictionary{
        "私": Entry{
            Definition: []string{"I, me"},
            Pronounciation: "わたし",
            Usage: []string{"None"},
        },
    }
)


func (sv *MyServer) ServeHTTP(wt http.ResponseWriter, req *http.Request) {
    key := req.URL.Query().Get("key")
    fmt.Printf("[INFO] Client request for key = `%s`\n", key)
    wt.Header().Set("Access-Control-Allow-Origin", "http://localhost:13123")
    wt.Header().Set("Access-Control-Allow-Method", "GET")
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

func main() {
    http.ListenAndServe(SERVER_ADDR, &MyServer{})
}
