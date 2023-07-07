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
        const filePath = `${webPath}${path.split("/")[2]}`;
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
                'User-Agent': req.headers['user-agent'],
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
                    proxyRes.on('data', chunk => {
                        res.write(chunk);
                    });
                    proxyRes.on('end', () => {
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
            https.get(apiUrl, options, proxyRes => {
                // Copy the cookies from the proxy response to the server response
                const cookies = proxyRes.headers['set-cookie'];
                if (cookies) {
                    res.setHeader('Set-Cookie', cookies);
                }

                res.writeHead(proxyRes.statusCode, proxyRes.headers);
                proxyRes.on('data', chunk => {
                    res.write(chunk);
                });
                proxyRes.on('end', () => {
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