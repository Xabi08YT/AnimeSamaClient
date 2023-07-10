// Based on Fufly's code from pronote-proxy repo 
const http = require('http');
const https = require('https');
const fs = require('fs');
const url = require('url');

const webPath = './web/';

const serverUrl = 'https://anime-sama.fr/';

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url);
    const path = parsedUrl.pathname;

    if (req.method === 'GET' && (path.endsWith('/style.css'))) {
        const filePath = `${webPath}${path}`;
        const contentType = path.endsWith('.css') ? 'text/css' : 'application/javascript';
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                res.writeHead(404);
                res.end('File not found');
            } else {
                res.writeHead(200, {
                    'Content-Type': contentType
                });
                res.end(data);
            }
        });
    } else {
        let apiUrl = serverUrl + path;
        const options = {
            method: req.method,
            headers: {
                'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
                'Content-Type': req.headers['content-type'] != null ? req.headers['content-type'] : "application/json",
                'Cookie': req.headers['cookie'] || ''
            }
        };

        if (req.method === 'POST') {
            const postData = [];
            req.on('data', chunk => {
                postData.push(chunk);
            });
            req.on('end', () => {
                const body = Buffer.concat(postData).toString();
                options.headers['Content-Length'] = Buffer.byteLength(body);
                const proxyReq = https.request(apiUrl, options, proxyRes => {
                    // Copy the cookies from the proxy response to the server response
                    const cookies = proxyRes.headers['set-cookie'];
                    if (cookies) {
                        res.setHeader('Set-Cookie', cookies);
                    }

                    res.writeHead(proxyRes.statusCode, proxyRes.headers);
                    let responseData = '';

                    proxyRes.on('data', chunk => {
                        responseData += chunk.toString()
                            .replace('<meta charset="utf-8" />', '<meta charset="utf-8" />\n<link rel="stylesheet" href="/style.css">')
                            .replace('<p class="hidden md:block pr-1">Lecteur AS</p>', '<p id="DLTitle" class="hidden md:block pr-1">Download</p>')
                        ;
                    });
    
                    proxyRes.on('end', () => {
                        res.writeHead(proxyRes.statusCode, proxyRes.headers);
                        res.write(responseData);
                        res.end();
                    });
                });
                proxyReq.on('error', error => {
                    console.error(error);
                    res.writeHead(500);
                    res.end('Internal Server Error');
                });
                proxyReq.write(body);
                proxyReq.end();
            });
        } else {
            apiUrl += parsedUrl.search || '';
            if(apiUrl.includes("catalogue")) {
                apiUrl += "/";
            }
            https.get(apiUrl, options, proxyRes => {
                // Copy the cookies from the proxy response to the server response
                const cookies = proxyRes.headers['set-cookie'];
                if (cookies) {
                    res.setHeader('Set-Cookie', cookies);
                }

                

                let responseData = '';

                proxyRes.on('data', chunk => {
                    responseData += chunk.toString()
                        .replace('<meta charset="utf-8" />', '<meta charset="utf-8" />\n<link rel="stylesheet" href="/style.css">')
                        .replace('<p class="hidden md:block pr-1">Lecteur AS</p>', '<p id="DLTitle" class="hidden md:block pr-1">Download</p>')
                    ;
                });

                proxyRes.on('end', () => {
                    console.log(proxyRes.statusCode);
                    res.writeHead(proxyRes.statusCode, proxyRes.headers);
                    res.write(responseData);
                    res.end();
                });
            }).on('error', error => {
                console.error(error);
                res.writeHead(500);
                res.end('Internal Server Error');
            });

        }
    }
});

server.listen(3000, () => {
    console.log('Server running on port 3000');
});