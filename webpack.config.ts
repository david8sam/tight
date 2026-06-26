import path from 'path';
import { Configuration } from 'webpack';
import nodeExternals from 'webpack-node-externals';

const dev = process.env.NODE_ENV === 'development';
const mode = dev ? 'development' : 'production';
const cwd = process.cwd();
const serverDir = path.resolve(cwd, './src/server');
const tsconfigFile = path.resolve(cwd, 'tsconfig.server.json');

const config: Configuration = {
    target: 'node',
    mode,
    entry: path.resolve(serverDir, 'index.ts'),
    output: {
        filename: dev ? 'server-dev.js' : 'server.js',
        library: { type: 'module' },
        path: path.resolve(cwd, 'build'),
        module: true,
        chunkFormat: 'module',
    },
    experiments: {
        outputModule: true,
    },
    externals: [nodeExternals({ importType: 'module' })],
    watch: dev,
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: 'ts-loader',
                options: { configFile: tsconfigFile },
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
    performance: { hints: false },
    devtool: dev ? 'cheap-module-source-map' : false,
};

export default config;
