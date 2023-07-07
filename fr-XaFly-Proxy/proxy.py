from http.server import BaseHTTPRequestHandler, HTTPServer
import requests as rq
import wget as wg
import json

hostName = "127.0.0.1"
serverPort = 8080
URL = ""

class MyServer(BaseHTTPRequestHandler):
    def do_POST(self):
        headers = self.headers
        body = ""
        contentLen = self.headers.get('Content-Length')
        if not contentLen == None:
            contentLen = int(contentLen)
            body = self.rfile.read(contentLen)
        bodyJSON = json.loads(body)
        r = rq.post(URL, json=bodyJSON, headers=headers)
        statusCode = r.status_code
        destHeaders = r.headers
        destBody = r.json()
        destBody = json.dumps(destBody)
        self.send_response(statusCode, message=destBody)


    def do_GET(self):
        headers = self.headers
        headers["Accept"] = "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7"
        headers["Authority"] = URL.replace("https://", "").replace("http://", "").replace("/", "").replace("ws://", "").replace("wss://", "")
        headers["Host"] = URL.replace("https://", "").replace("http://", "").replace("/", "").replace("ws://", "").replace("wss://", "")
        headers["Referer"] = URL
        headers["Origin"] = URL.replace("https://", "").replace("http://", "").replace("/", "").replace("ws://", "").replace("wss://", "")
        headers["cookie"] = "_gid=GA1.2.2123401432.1688713411; _ga=GA1.2.425026082.1688713411; _ga_WEG027GXYK=GS1.1.1688713412.1.1.1688713416.56.0.0; __cf_bm=0661HCAlJd6.aVug8q.htNzuXJkGDze3ZUnkLlWxcHU-1688713422-0-AWCkFUIU61O2xo5WabdnWKZ6mICgyhB7E911eZmi7Kv5UzA2cpmGsc7wyR3+v1iwwg==; accepted_cookies=yes"

        print(headers)
        r = rq.get(URL, headers=headers)
        statusCode = r.status_code
        destHeaders = r.headers
        self.send_response(200)
        self.send_header("Content-type", "text/html")
        self.end_headers()
        self.wfile.write(r.content)
#        self.wfile.close()


def init(url):
    global URL
    URL = url
    webServer = HTTPServer((hostName, serverPort), MyServer)
    print("Server started at http://%s:%s" % (hostName, serverPort))

    try:
        webServer.serve_forever()
    except KeyboardInterrupt:
        pass

    webServer.server_close()
    print("Server stopped.")
    return

init("https://anime-sama.fr/")