const path = require('path')
const fs = require('fs')
const webpack = require('webpack')
const HtmlWebPackPlugin = require('html-webpack-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const BrowserSyncPlugin = require('browser-sync-webpack-plugin')

module.exports = {
  entry: {
    main: ['./src/index.js', './src/scss/main.scss']
  },
  output: {
    path: path.join(__dirname, 'dist'),
    publicPath: '/',
    filename: '[name].[hash].js'
  },
  node: {
    fs: 'empty'
  },
  watch: true,
  mode: 'development',
  target: 'web',
  //devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: "babel-loader",
      },
      {
        // Loads the javacript into html template provided.
        // Entry point is set below in HtmlWebPackPlugin in Plugins
        test: /\.html$/,
        use: [
          {
            loader: "html-loader",
            options: {
              attrs: ['img:src', 'link:href'],
              //minimize: true
            }
          }
        ]
      },
      {
        test: /\.twig$/,
        //use: ['raw-loader', 'twig-loader']
        loader: 'twig-loader',
        options: {
          //extender: path.join(__dirname, 'src/js/tool/extendTwig.js')
        }
      },
      {
        test: /\.(sa|sc|s)css$/,
        use: [ 'style-loader', 'css-loader' ]
      },
      {
       test: /\.(png|svg|jpg|gif)$/,
       use: [{
         loader: 'file-loader',
         options: {
           name: '[name].[hash].[ext]',
           outputPath: '/img'
         }
       }]
     },
     {
      test: /\.(otf)$/,
      use: [{
        loader: 'file-loader',
        options: {
          name: '[name].[hash].[ext]',
          outputPath: '/font',
          publicPath: '/font'
        }
      }]
     }
    ]
  },
  plugins: [
    new CleanWebpackPlugin({
      cleanOnceBeforeBuildPatterns: ['*', '!server.js*'],
      verbose: true
    }),
    new HtmlWebPackPlugin({
      hash: true,
      template: "./src/twig/index.twig",
      filename: "./index.[hash].html",
      templateParameters: {
        page : "index"
      }
    }),
    new BrowserSyncPlugin({
      host: 'localhost',
      port: 3000,
      proxy: 'localhost:8080',
      files: ['./dist/**/*'],
    }),
    new webpack.NoEmitOnErrorsPlugin()
  ]
}
