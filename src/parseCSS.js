const url = require('url');
const css = require('css');

const START_END_QUOTES_REGEXP = /(^("|')|('|")$)/g;

function parseCSS (baseUrl, cssText) {
    const ast = css.parse(cssText.toString());

    return {
        getComponentsUrls: () => {
            try {
                const imports = ast.stylesheet.rules.filter(rule => {
                    return rule.type === 'import';
                }).map(rule => {
                    const link = rule.import.replace(START_END_QUOTES_REGEXP, '');
                    return url.resolve(baseUrl, link);
                });

                return imports;
            } catch (e) {
                return [];
            }
        },
        embedComponents: (components) => {
            try {
                ast.stylesheet.rules = ast.stylesheet.rules.map(rule => {
                    if (rule.type === 'import') {
                        const link = rule.import.replace(START_END_QUOTES_REGEXP, '');
                        const absoluteUrl = url.resolve(baseUrl, link);
                        const component = components.filter(component => {
                            return component && component.config.url === absoluteUrl;
                        }).pop();

                        if (!component) {
                            return rule;
                        }

                        const mimeType = component.headers['content-type'].split(';').shift();

                        if (!mimeType) {
                            return true;
                        }

                        const base64 = Buffer.from(component.data).toString('base64');
                        const dataUri = ['data:', mimeType, ';base64,', base64].join('');

                        rule.import = ["'", "'"].join(dataUri);
                        return rule;
                    } else {
                        return rule;
                    }
                });
            } catch (e) {}

            return css.stringify(ast);
        }
    }
}

module.exports = parseCSS;
