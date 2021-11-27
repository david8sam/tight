const HtmlWebPackPlugin = require('html-webpack-plugin');
const path = require('path');
const nodeExternals = require('webpack-node-externals');

const dev = process.env.NODE_ENV === 'development';
const web = process.env.TARGET === 'web';
const target = web ? 'web' : 'node';
const mode = dev ? 'development' : 'production';

const cwd = process.cwd();
const clientDir = path.resolve(cwd, './src/client');
const serverDir = path.resolve(cwd, './src/server');

const tsconfigFile = web ? path.resolve(cwd, 'tsconfig.webpack.json') : path.resolve(cwd, 'tsconfig.server.json');

let config = {
    target,
    mode,
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: 'ts-loader',
                options: { configFile: tsconfigFile },
            },
            {
                enforce: 'pre',
                test: /\.js$/,
                loader: 'source-map-loader',
            },
            {
                test: /\.(png|svg|jpg|gif)$/,
                loader: 'file-loader',
                options: {
                    outputPath: 'images',
                },
            },
        ],
    },
    resolve: {
        alias: {
            common: path.resolve(cwd, 'src/common'),
        },
        extensions: ['*', '.ts', '.tsx', '.js', '.jsx'],
    },
    plugins: [],
    performance: { hints: false },
};

if (web) {
    config = {
        ...config,
        entry: path.resolve(clientDir, 'index.tsx'),
        output: {
            filename: 'js/bundle.js',
            chunkFilename: 'js/[name].chunk.js',
            publicPath: '/',
            path: path.resolve(cwd, 'dist'),
        },
        plugins: [
            new HtmlWebPackPlugin({
                template: path.resolve(clientDir, 'index.html'),
                filename: './index.html',
            }),
        ],
    };
} else {
    config = {
        ...config,
        entry: path.resolve(serverDir, 'index.ts'),
        node: {
            __dirname: false,
            __filename: false,
        },
        output: {
            filename: dev ? 'server-dev.js' : 'server.js',
            publicPath: '/',
            path: path.resolve(cwd, 'build'),
        },
        externals: [nodeExternals()],
        watch: dev,
    };
}

if (dev) {
    config = {
        ...config,
        devtool: 'cheap-module-source-map',
    };

    config.output = {
        ...config.output,
        hotUpdateChunkFilename: 'hot/[id].[fullhash].hot-update.js',
        hotUpdateMainFilename: 'hot/[runtime].[fullhash].hot-update.json',
    };

    if (web) {
        config.devServer = {
            static: {
                directory: path.resolve(cwd, 'dist'),
            },
            hot: true,
            proxy: {
                '*': 'http://localhost',
            },
        };
    }
}

module.exports = config;
