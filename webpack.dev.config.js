const path = require('path')
const fs = require('fs')
const webpack = require('webpack')
const HtmlWebPackPlugin = require('html-webpack-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const BrowserSyncPlugin = require('browser-sync-webpack-plugin')
//const CopyPlugin = require('copy-webpack-plugin')

module.exports = {
  entry: {
    //leaflet : './node_modules/leaflet/dist/leaflet.css',
    main: ['./src/app.ts', './src/scss/main.scss'],
    polyfills: './src/polyfills.ts'
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
  resolve: {
    // Add .ts and .tsx as a resolvable extension.
    extensions: [".ts", ".tsx", ".js"]
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: "babel-loader",
      },
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        loader: "ts-loader",
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
        test: /\.(sa|sc|c)ss$/,
        use: [
          'style-loader',
          'to-string-loader',
          'css-loader',
          'sass-loader'
        ]
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
      verbose: true,
    }),
    /*new CopyPlugin([
      { from: './src/img', to: './' },
    ]),*/
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
    new webpack.NoEmitOnErrorsPlugin(),
    /*new webpack.ContextReplacementPlugin(
      /\@angular(\\|\/)core(\\|\/)fesm5/,
      path.join(__dirname, './dist'),
      {}
    ),*/
  ]
}
