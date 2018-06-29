const fs = require('fs');
const path = require('path');
const assert = require('assert');
const express = require('express');
const request = require('../index');

const TEST_WEBSERVER_PORT = 6565;
const TEST_WEBSERVER_ADDRESS = ['http://localhost', TEST_WEBSERVER_PORT].join(':');

function btoa (str) {
    return new Buffer(str).toString('base64');
}

function atob (str) {
    return Buffer.from(str, 'base64').toString();
}

function getEmbedded (input) {
    return input.toString()
    .match(/data:[^;]+;base64,([^"']+)/g)
    .map(embed => embed.slice(embed.indexOf(',')));
}

describe('Axios-inline', () => {
    let server;

    after('stop test webserver', done => server.close(done));

    it('should setup test web server', done => {
        const app = express();
        const staticPath = path.join(__dirname, 'pages');
        app.use(express.static(staticPath));
        server = app.listen(TEST_WEBSERVER_PORT, () => done());
    });

    it('should get empty html page', done => {
        const url = [TEST_WEBSERVER_ADDRESS, 'empty.html'].join('/');
        const pagePath = path.join(__dirname, 'pages/empty.html');
        const pageHTML = fs.readFileSync(pagePath, { encoding: 'utf8' });

        request(url).then(response => {
            assert.equal(response.data.replace(/\s+/g, ''), pageHTML.replace(/\s+/g, ''));
            done();
        }).catch(done);
    });

    it('should get html with css embedded', done => {
        const url = [TEST_WEBSERVER_ADDRESS, 'style.html'].join('/');
        const cssContentBase64 = btoa([
            'body:before {',
            '  content: \'style.css inner text\';',
            '}'
        ].join('\n'));
        request(url).then(response => {
            assert.equal(response.data.toString().indexOf(cssContentBase64) > -1, true);
            done();
        }).catch(done);
    });

    it('should get html with imported css embedded', done => {
        const url = [TEST_WEBSERVER_ADDRESS, 'import.html'].join('/');
        const cssContentBase64 = btoa([
            '@import \'data:text/css;base64,',
            '\';'
        ].join(btoa([
            'body:before {',
            '  content: \'style.css inner text\';',
            '}'
        ].join('\n'))));
        request(url).then(response => {
            assert.equal(response.data.toString().indexOf(cssContentBase64) > -1, true);
            done();
        }).catch(done);
    });

    it('should get html with script embedded', done => {
        const url = [TEST_WEBSERVER_ADDRESS, 'script.html'].join('/');
        const jsContentBase64 = btoa([
            'console.log(\'hello\');',
            ''
        ].join('\n'));
        request(url).then(response => {
            assert.equal(response.data.toString().indexOf(jsContentBase64) > -1, true);
            done();
        }).catch(done);
    });

    it('should get html with image embedded', done => {
        const url = [TEST_WEBSERVER_ADDRESS, 'image.html'].join('/');
        const pngPath = path.join(__dirname, 'pages/image.png');
        const pngContent = fs.readFileSync(pngPath);
        const pngContentBase64 = btoa(pngContent);
        request(url).then(response => {
            assert.equal(response.data.toString().indexOf(pngContentBase64) > -1, true);
            done();
        }).catch(done);
    });

    it('should get html with iframe embedded', done => {
        const url = [TEST_WEBSERVER_ADDRESS, 'iframe.html'].join('/');
        const iframePath = path.join(__dirname, 'pages/empty.html');
        const iframeContent = fs.readFileSync(iframePath, { encoding: 'utf8' }).replace(/\s+/g, '');
        request(url).then(response => {
            const embeds = getEmbedded(response.data);
            assert.equal(embeds.length, 1);
            const embeddedIframe = atob(embeds[0]).replace(/\s+/g, '');
            assert.equal(iframeContent, embeddedIframe);
            done();
        }).catch(done);
    });
});
