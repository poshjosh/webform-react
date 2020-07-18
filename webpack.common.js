const path = require('path');

module.exports = {
//    entry: './src/main/js/form.js', // Both prod and dev have own entry
    output: {
        path: __dirname,
        filename: './src/main/resources/static/web-forms.js'
    },
    target: 'web',
    module: {
        rules: [
            {
                test: path.join(__dirname, '.'),
                exclude: /(node_modules)/,
                use: [{
                    loader: 'babel-loader',
                    options: {
                        presets: ["@babel/preset-env", "@babel/preset-react"]
                    }
                }]
            }  
        ]
    }
};