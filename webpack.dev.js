const merge = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
    mode: 'development',
    entry: './src/main/js/app.js',
    output: {
        filename: './src/main/resources/static/web-forms.dev.js'
    },
    devtool: 'inline-source-map',
    cache: true,
    optimization: { minimize: false }
});