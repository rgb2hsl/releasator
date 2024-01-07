const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin");
const Dotenv = require("dotenv-webpack");

module.exports = {
    mode: "development",
    devtool: "inline-source-map",
    entry: "./src/index.tsx",
    output: {
        path: path.resolve(__dirname, "dist"),
        filename: "index.js"
    },
    resolve: {
        extensions: [".ts", ".tsx", ".js"],
        extensionAlias: {
            ".js": [".js", ".ts"],
            ".cjs": [".cjs", ".cts"],
            ".mjs": [".mjs", ".mts"]
        }
    },
    module: {
        rules: [
            {test: /\.([cm]?ts|tsx)$/, loader: "ts-loader"}
        ]
    },
    devServer: {
        historyApiFallback: true
    },
    plugins: [
        new NodePolyfillPlugin(),
        new CopyPlugin({
            patterns: [
                {from: "./static"},
                {from: "../../node_modules/react95/dist/fonts", to: "./fonts"}
            ]
        }),
        new Dotenv({
            path: `./.env${env === "production" ? "" : ".development"}`
        })
    ]
};
