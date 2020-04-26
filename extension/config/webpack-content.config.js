const path = require('path');

module.exports = {
  entry: {
    "content-script": './page-content/content-script.js',
  },
  output: {
    filename: 'page-content/[name].js',
    path: path.resolve(__dirname, '../build')
  },
  mode: "production",
  module: {
    rules: [{
      test: /\.m?js$/,
      exclude: /(node_modules|bower_components)/,
      use: {
        loader: 'babel-loader',
        options: {
          plugins: ['@babel/plugin-proposal-class-properties']
        }
      }
    }]
  }
};