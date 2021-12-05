import cors from 'cors';
import express, { Request, Response } from 'express';
import ip from 'ip';
import path from 'path';

import initializeAppData from './appData';
import initializeWebSocketServer from './WebSocketServer';

const app = express();
const port = process.env.PORT || 80;
const distDir = path.join(__dirname, '../dist');
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
    console.log(`Server running on: http://${ip.address()}`);
    console.log(`App listening on port: ${port}`);
});
