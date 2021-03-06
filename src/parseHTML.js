const url = require('url');
const cheerio = require('cheerio');
const consts = require('./consts');
const parseCSS = require('./parseCSS');

function parseHTML(baseUrl, html) {
    const query = cheerio.load(html);

    return {
        // return list of links to page components (images, styles, scripts)
        getComponentsUrls: () => {
            const styleLinks = query('style').map(function () {
                const cssContent = query(this).html();
                const css = parseCSS(baseUrl, cssContent);
                return css.getComponentsUrls();
            }).get();

            const links = query(consts.COMPONENTS_QUERY).map(function () {
                return query(this).prop('src') || query(this).prop('href');
            }).get();

            return [].concat.apply(links, styleLinks)
            .map(link => {
                try {
                    return link ? url.resolve(baseUrl, link) : null
                } catch (e) {}
            })
            .reduce((list, item) => {
                // only unique and non-empty links
                return item && list.indexOf(item) === -1 ? list.concat(item) : list;
            }, []);
        },
        // embed list of axios responses into html
        embedComponents: (components) => {
            query(consts.COMPONENTS_QUERY).each(function () {
                const tagUri = query(this).prop('src') || query(this).prop('href');

                if (!tagUri) {
                    return true;
                }

                const tagUrl = url.resolve(baseUrl, tagUri);
                const component = components.filter(component => {
                    return component && component.config.url === tagUrl;
                }).pop();

                if (!component) {
                    return true;
                }

                const mimeType = component.headers['content-type'].split(';').shift();

                if (!mimeType) {
                    return true;
                }

                const base64 = Buffer.from(component.data).toString('base64');
                const dataUri = ['data:', mimeType, ';base64,', base64].join('');

                if (query(this).prop('src')) {
                    query(this).attr('src', dataUri);
                } else if (query(this).prop('href')) {
                    query(this).attr('href', dataUri);
                }

                return true;
            });

            query('style').each(function () {
                const cssContent = query(this).html();
                const css = parseCSS(baseUrl, cssContent);
                query(this).html(css.embedComponents(components));
            });

            return query.html();
        }
    }
}

module.exports = parseHTML;
