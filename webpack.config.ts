import HtmlWebPackPlugin from 'html-webpack-plugin';
import path from 'path';
import { Configuration } from 'webpack';
import nodeExternals from 'webpack-node-externals';

const dev = process.env.NODE_ENV === 'development';
const web = process.env.TARGET === 'web';
const desktop = process.env.TARGET === 'desktop';
const target = web ? 'web' : 'node';
const mode = dev ? 'development' : 'production';

const cwd = process.cwd();
const clientDir = path.resolve(cwd, './src/client');
const serverDir = path.resolve(cwd, './src/server');

const tsconfigFile = web ? path.resolve(cwd, 'tsconfig.web.json') : path.resolve(cwd, 'tsconfig.server.json');

let config: Configuration = {
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
        extensions: ['.*', '.ts', '.tsx', '.js', '.jsx'],
        extensionAlias: {
            '.js': ['.ts', '.js'],
            '.mjs': ['.mts', '.mjs'],
        },
    },
    plugins: [],
    performance: { hints: false },
};

if (web) {
    config = {
        ...config,
        entry: path.resolve(clientDir, 'index.tsx'),
        output: {
            filename: dev ? 'js/bundle.js' : 'js/bundle.[contenthash].js',
            chunkFilename: dev ? 'js/[name].chunk.js' : 'js/[name].[contenthash].chunk.js',
            hashFunction: 'sha256',
            hashDigestLength: 20,
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
        entry: desktop
            ? path.resolve(serverDir, 'bootstrap.ts')
            : {
                  [dev ? 'server-dev' : 'server']: path.resolve(serverDir, 'index.ts'),
                  backend: path.resolve(serverDir, 'bootstrap.ts'),
              },
        module: { ...config.module, parser: { javascript: { importMeta: false } } },
        output: {
            filename: desktop ? 'desktop-backend.js' : '[name].js',
            library: {
                type: 'module',
            },
            publicPath: '/',
            path: path.resolve(cwd, 'build'),
            module: true,
            chunkFormat: 'module',
        },
        experiments: {
            outputModule: true,
        },
        externals: desktop ? [] : [nodeExternals({ importType: 'module' })],
        watch: dev,
    };
}

if (dev) {
    config = {
        ...config,
        devtool: 'cheap-module-source-map',
    };
}

export default config;
