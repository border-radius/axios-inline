const CSS = require('css');

function importCSS (css, url) {
    return new Promise((resolve, reject) => {
        const ast = CSS.parse(css.toString());
        console.log(ast.stylesheet.rules);

        if (ast.stylesheet.rules[0].declarations) {
            console.log(ast.stylesheet.rules[0].declarations);
        }

        console.log(CSS.stringify(ast));

        return resolve(CSS.stringify(ast));
        return resolve(css.toString());
    })
}

module.exports = importCSS;
