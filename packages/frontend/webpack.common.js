/* eslint-disable @typescript-eslint/no-require-imports */
const path = require('path');
const context = __dirname;
module.exports = {
  entry: './src/main.ts',
  context,
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
    fallback: { util: false },
  },
  module: {
    rules: [
      {
        test: /\.scss$/,        
        use: ['css-loader', 'sass-loader'],
      },
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  output: {
    path: path.resolve(context, 'dist'),
    filename: 'app.bundle.js',
  },
};
