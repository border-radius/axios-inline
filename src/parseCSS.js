const url = require('url');
const css = require('css');

const TRIM_REGEXP = /(^["'\(]*|["'\)]*$)/g;
const URL_DECLARATION_REGEXP = /url\s*\(([^\)]+)\)/ig;

function hasUrlDeclaration (declaration) {
    return declaration.value.toLowerCase().replace(/\s+/g, '').indexOf('url(') > -1;
}

function getLinksFromDeclaration (baseUrl, declaration) {
    const matches = declaration.value.match(URL_DECLARATION_REGEXP) || [];
    return matches.map(link => {
        link = link.slice(link.trim().indexOf('(') + 1).replace(TRIM_REGEXP, '');
        return url.resolve(baseUrl, link);
    });
}

function toDataUri (data, mimeType) {
    const base64 = Buffer.from(data).toString('base64')
    return ['data:', mimeType, ';base64,', base64].join('');
}

function parseCSS (baseUrl, cssText) {
    const ast = css.parse(cssText.toString());

    return {
        getComponentsUrls: () => {
            try {
                const imports = ast.stylesheet.rules.filter(rule => {
                    return rule.type === 'import';
                }).map(rule => {
                    const link = rule.import.replace(TRIM_REGEXP, '');
                    return url.resolve(baseUrl, link);
                });

                const urls = [];

                ast.stylesheet.rules.filter(rule => {
                    return rule.declarations && rule.declarations.filter(hasUrlDeclaration).length > 0;
                }).forEach(rule => {
                    rule.declarations.filter(hasUrlDeclaration).forEach(declaration => {
                        const links = getLinksFromDeclaration(baseUrl, declaration);
                        links.forEach(link => urls.push(link));
                    });
                });

                return urls.concat(imports);
            } catch (e) {
                return [];
            }
        },
        embedComponents: (components) => {
            try {
                ast.stylesheet.rules = ast.stylesheet.rules.map(rule => {
                    if (rule.type === 'import') {
                        const link = rule.import.replace(TRIM_REGEXP, '');
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

                        rule.import = ["'", "'"].join(toDataUri(component.data, mimeType));
                    } else if (rule.declarations && rule.declarations.filter(hasUrlDeclaration).length > 0) {
                        rule.declarations = rule.declarations.map(declaration => {
                            if (hasUrlDeclaration(declaration)) {
                                const declarationLinks = getLinksFromDeclaration(baseUrl, declaration);

                                declarationLinks.forEach(link => {
                                    const component = components.filter(component => {
                                        return component && component.config.url === link;
                                    }).pop();

                                    if (!component) {
                                        return true;
                                    }

                                    const mimeType = component.headers['content-type'].split(';').shift();

                                    if (!mimeType) {
                                        return true;
                                    }

                                    declaration.value = declaration.value.replace(URL_DECLARATION_REGEXP, str => {
                                        return ['url(\'', '\')'].join(toDataUri(component.data, mimeType));
                                    });
                                });
                            }

                            return declaration;
                        });
                    }
                    return rule;
                });
            } catch (e) {}

            return css.stringify(ast);
        }
    }
}

module.exports = parseCSS;
