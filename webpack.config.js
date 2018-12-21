import path from 'path';
import webpack from 'webpack';
import CleanWebpackPlugin from 'clean-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import ExtractTextWebpackPlugin from 'extract-text-webpack-plugin';
import autoprefixer from 'autoprefixer';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import CaseSensitivePathsPlugin from 'case-sensitive-paths-webpack-plugin';
import babelLoaderOptions from './babel-loader.webpack.config';
import beautify from 'json-beautify';

import npmPackage from './package';
import projectConfig from './config/projectConfig';
import { Env } from './config/Env';

const outputPath = path.join(__dirname, projectConfig.build.dist);
const srcPath = path.join(__dirname, 'src');

// с точки зрения билда, прод и тест одно и тоже поэтому нужно разрезолвить для билда
const providedBuildEnv = process.env.BUILD_ENV || Env.DEVELOPMENT;

const BUILD_ENV = providedBuildEnv === Env.TEST ? Env.PRODUCTION : providedBuildEnv;
const DEV_MODE = BUILD_ENV === Env.DEVELOPMENT;


const BUILD_VERSION = npmPackage.version;


console.info(
    '\n\n\n--------------\n',
    'result project configuration is',
    '\n--------------\n',
    `BUILD_ENV: ${ BUILD_ENV }\n`,
    '\n--------------\n',
    beautify(projectConfig, null, 4, 16),
    '\n--------------\n\n\n',
);

console.log(npmPackage.main);

export default {

    entry: {
        main: npmPackage.main,
    },

    target: 'web',

    output: {
        path: outputPath,
        filename: `js/[name]_[hash].js`,
        publicPath: '/',
    },

    mode: BUILD_ENV,
    devtool: DEV_MODE ? 'source-map' : false,
    devServer: {
        port: projectConfig.devLocal.devServerPort,
        contentBase: outputPath,
        hot: DEV_MODE,
        historyApiFallback: true,
    },

    optimization: {
        minimize: !DEV_MODE,
    },

    plugins: [
        new CaseSensitivePathsPlugin(),

        // For compatibility with old loaders
        // https://webpack.js.org/guides/migrating/#loaderoptionsplugin-context
        new webpack.LoaderOptionsPlugin({
            minimize: !DEV_MODE,
            debug: DEV_MODE,
        }),

        new webpack.DefinePlugin({
            DEV_MODE,

            'process.env.NODE_ENV': JSON.stringify(BUILD_ENV),
            'process.env.BROWSER': true,
        }),

        // clean dist
        new CleanWebpackPlugin(
            [ outputPath ],
        ),

        new ExtractTextWebpackPlugin({
            disable: DEV_MODE,
            filename: `css/[name]_[hash].css`,
        }),

        // index.html
        new HtmlWebpackPlugin({
            filename: 'index.html',
            templateParameters: {
                version: BUILD_VERSION,
            },
            template: path.join(srcPath, 'index.html'),
        }),

        ...DEV_MODE ? [

            new BundleAnalyzerPlugin({
                analyzerMode  : 'server',
                analyzerHost  : 'localhost',
                analyzerPort  : 12345,
                logLevel      : 'info',
                openAnalyzer  : false,
            }),

            new webpack.NamedModulesPlugin(),
            new webpack.HotModuleReplacementPlugin(),

        ] : [

            // for scope hoisting
            new webpack.optimize.ModuleConcatenationPlugin(),

        ],

    ],

    module: {
        rules: [

            {
                test: /\.(jpe?g|png|gif|svg)$/i,
                loader: 'file-loader',
                options: {
                    name: 'img/[hash].[ext]',
                },
            },

            // transform styles
            {
                test: /\.scss$/,
                exclude: /node_modules/,
                use: ExtractTextWebpackPlugin.extract({
                    fallback: 'style-loader',
                    use: [
                        {
                            loader: 'css-loader',
                            options: {
                                sourceMap: DEV_MODE,
                            },
                        },
                        {
                            loader: 'postcss-loader',
                            options: {
                                plugins: [
                                    autoprefixer({
                                        browsers:['ie >= 10', 'last 4 version'],
                                    }),
                                ],
                                sourceMap: DEV_MODE,
                            }
                        },
                        {
                            loader: 'resolve-url-loader',
                        },
                        {
                            loader: 'sass-loader',
                            options: {
                                sourceMap: DEV_MODE,
                            },
                        },
                    ],
                }),
            },

            // transforms for react and some new features of js
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: babelLoaderOptions(DEV_MODE),
                },
            },
        ],
    },

    watchOptions: {
        aggregateTimeout: 100,
    },

    // Don't attempt to continue if there are any errors.
    bail: !DEV_MODE,

    cache: DEV_MODE,

    stats: {
        colors: process.stdout.isTTY,
        reasons: DEV_MODE,
        hash: DEV_MODE,
        version: DEV_MODE,
        timings: true,
        chunks: DEV_MODE,
        chunkModules: DEV_MODE,
        cached: DEV_MODE,
        cachedAssets: DEV_MODE,
    },

}
