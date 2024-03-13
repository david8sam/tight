import chalk from 'chalk';
import cors from 'cors';
import express, { Request, Response } from 'express';
import ip from 'ip';
import path from 'path';
import { fileURLToPath } from 'url';

import initializeAppData from './appData.js';
import initializeWebSocketServer from './WebSocketServer.js';

// workaround for import.meta.dirname being undefined in node 20
const dirname = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const app = express();
const port = process.env.PORT || 80;
const distDir = path.join(dirname, '../dist');
const html = path.join(distDir, 'index.html');

initializeAppData();
initializeWebSocketServer(app);

const publicPath = express.static(distDir);
app.use(publicPath);
app.use(cors());

app.get('*', (req: Request, res: Response) => {
    res.sendFile(html);
});

app.listen(port, () => {
    const ipAddress = chalk.cyanBright(`http://${ip.address()}/`);
    console.log(`Server listening on port: ${port}`);
    console.log(`Server running on: ${ipAddress}`);
});
