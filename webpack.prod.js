const path = require('path');
const merge = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
    mode: 'production',
    entry: './src/main/js/form.js',
    output: {
        filename: './src/main/resources/static/web-forms.js',
        libraryTarget: 'umd',
        library: 'Form'
    },
    devtool: 'source-map',
    optimization: { minimize: true },
    resolve: {      
        alias: {          
            'react': path.resolve(__dirname, './node_modules/react'),
            'react-dom': path.resolve(__dirname, './node_modules/react-dom')      
        }  
    },      
    externals: {      
        // Don't bundle react or react-dom      
        react: {          
            commonjs: "react",          
            commonjs2: "react",          
            amd: "React",          
            root: "React"      
        },      
        "react-dom": {          
            commonjs: "react-dom",          
            commonjs2: "react-dom",          
            amd: "ReactDOM",          
            root: "ReactDOM"      
        }  
    } 
});