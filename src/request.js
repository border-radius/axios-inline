const axios = require('axios');
const consts = require('./consts');
const Promise = require('bluebird');
const importCSS = require('./importCSS');
const parseHTML = require('./parseHTML');
const parseCSS = require('./parseCSS');

function request(targetUrl, options) {
    options = typeof options === 'object' ? options : {};
    options.headers = typeof options.headers === 'object' ? options.headers : {};
    options.responseType = 'arraybuffer';
    options.headers['user-agent'] = options.headers['user-agent'] || consts.DEFAULT_UA;

    return axios.get(targetUrl, options).then(response => {
        const mimeType = response.headers['content-type'].toLowerCase().split(';').shift();
        switch (mimeType) {
            case 'text/html':
                return new Promise ((resolve, reject) => {
                    const page = parseHTML(targetUrl, response.data);
                    const componentsUrls = page.getComponentsUrls();

                    Promise.map(componentsUrls, componentUrl => {
                        return new Promise ((resolve, reject) => {
                            request(componentUrl, options).then(resolve).catch(e => resolve());
                        });
                    })
                    .then(page.embedComponents)
                    .then(html => {
                        response.data = html;
                        return response;
                    })
                    .then(resolve).catch(reject);
                });
            case 'text/css':
                return new Promise ((resolve, reject) => {
                    const css = parseCSS(targetUrl, response.data);
                    const componentsUrls = css.getComponentsUrls();

                    Promise.map(componentsUrls, componentUrl => {
                        return new Promise ((resolve, reject) => {
                            request(componentUrl, options).then(resolve).catch(e => resolve());
                        });
                    })
                    .then(css.embedComponents)
                    .then(css => {
                        response.data = css;
                        return response;
                    })
                    .then(resolve).catch(reject);
                });
            default:
                return response;
        }
    }).catch(e => {
        console.log(targetUrl, e.message);
    });
};

module.exports = request;
