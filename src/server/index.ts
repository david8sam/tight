import cors from 'cors';
import express from 'express';
import ip from 'ip';
import path from 'path';

// TOOD: Figure this out.
// webpack imports for HMR in dev
import webpack from 'webpack';
import webpackDevMiddleware from 'webpack-dev-middleware';
import webpackHotMiddleware from 'webpack-hot-middleware';
import webpackConfig from '../../webpack.config.js';
//

import initializeAppData from './appData';
import initializeWebSocketServer from './WebSocketServer';

const app: express.Application = express();
const port = process.env.PORT || 80;
const distDir = path.join(__dirname, '../dist');
const html = path.join(distDir, 'index.html');

initializeAppData();
initializeWebSocketServer(app);

const publicPath = express.static(distDir);
app.use(publicPath);
app.use(cors());

// Add HMR for dev
// if (process.env.NODE_ENV !== 'production') {
//     const config = webpackConfig as webpack.Configuration;
//     const compiler = webpack(config);
//     const { publicPath = '' } = (config && config.output) || {};

//     app.use(webpackDevMiddleware(compiler, { publicPath }));
//     app.use(webpackHotMiddleware(compiler));
// }

app.get('*', (req: express.Request, res: express.Response) => {
    res.sendFile(html);
});

app.listen(port, () => {
    console.log(`Server running on: ${ip.address()}`);
    console.log(`App listening on port: ${port}`);
});
