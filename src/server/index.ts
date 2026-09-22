import chalk from 'chalk';
import cors from 'cors';
import express, { Request, Response } from 'express';
import http, { type Server as HttpServer } from 'http';
import https, { type Server as HttpsServer } from 'https';
import ip from 'ip';
import path from 'path';
import { fileURLToPath } from 'url';

import initializeWebSocketServer from './WebSocketServer.js';
import { cert, key } from './certs.js';
import initializeRouter from './rest-api/router.js';

// workaround for import.meta.dirname being undefined in node 20
const dirname = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const app = express();
let port = Number(process.env.PORT) || 80;
const distDir = path.join(dirname, '../dist');
const html = path.join(distDir, 'index.html');

const publicPath = express.static(distDir);
app.use(publicPath);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/api', initializeRouter());

app.get('*', (req: Request, res: Response) => {
    res.sendFile(html);
});

let protocol = 'http';
let server: HttpServer | HttpsServer;
if (key && cert) {
    server = https.createServer({ key, cert }, app);
    protocol = 'https';
    if (port === 80) {
        port = 443;
    }
} else {
    server = http.createServer(app);
}

initializeWebSocketServer(server);

server.listen(port, () => {
    const ipAddress = chalk.cyanBright(`${protocol}://${ip.address()}/`);
    console.log(`Server listening on port: ${port}`);
    console.log(`Server running on: ${ipAddress}`);
});
