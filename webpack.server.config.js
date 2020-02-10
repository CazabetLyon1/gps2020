const path = require('path')
const webpack = require('webpack')
const nodeExternals = require('webpack-node-externals')
const WebpackShellPlugin = require('webpack-shell-plugin')

module.exports = (env, argv) => {
  const SERVER_PATH = './src/server/server.dev.js'
  return ({
      entry: {
        server: SERVER_PATH,
      },
      output: {
        path: path.join(__dirname, 'dist'),
        publicPath: '/',
        filename: '[name].js'
      },
      watch: true,
      mode: 'development',
      target: 'node',
      node: {
        // Need this when working with express, otherwise the build fails
        __dirname: false,   // if you don't put this is, __dirname
        __filename: false,  // and __filename return blank or /
      },
      externals: [nodeExternals()], // Need this to avoid error when working with Express
      module: {
        rules: [
          {
            // Transpiles ES6-8 into ES5
            test: /\.js$/,
            exclude: /node_modules/,
            use: {
              loader: "babel-loader"
            }
          }
        ]
      },
      plugins: [
        new WebpackShellPlugin({
          onBuildStart: ['webpack --config webpack.dev.config.js'],
          onBuildEnd: ['nodemon ./dist/server.js --config nodemon.json'],
        })
      ]
    })
}
