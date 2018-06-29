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
    const match = input.toString().match(/data:[^;]+;base64,([^"']+)/g);
    return (match || []).map(embed => embed.slice(embed.indexOf(',') + 1));
}

function removeSpaces (str) {
    return str.toString().replace(/\s+/g, '');
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
        const pageHTML = fs.readFileSync(path.join(__dirname, 'pages/empty.html'), { encoding: 'utf8' });

        request(url).then(response => {
            assert.equal(removeSpaces(response.data), removeSpaces(pageHTML));
            done();
        }).catch(done);
    });

    it('should get html with css embedded', done => {
        const url = [TEST_WEBSERVER_ADDRESS, 'style.html'].join('/');
        const cssContent = fs.readFileSync(path.join(__dirname, 'pages/style.css'), { encoding: 'utf8' });
        request(url).then(response => {
            const embeds = getEmbedded(response.data);
            assert.equal(embeds.length, 1);
            const embeddedCSS = atob(embeds[0]);
            assert.equal(removeSpaces(embeddedCSS), removeSpaces(cssContent));
            done();
        }).catch(done);
    });

    it('should get html with imported css embedded', done => {
        const url = [TEST_WEBSERVER_ADDRESS, 'import.html'].join('/');
        const cssContent = fs.readFileSync(path.join(__dirname, 'pages/style.css'), { encoding: 'utf8' });
        request(url).then(response => {
            const embeds = getEmbedded(response.data);
            assert.equal(embeds.length, 1);
            const embeddedEmbeds = getEmbedded(atob(embeds[0]));
            assert.equal(embeddedEmbeds.length, 1);
            const deepCSS = atob(embeddedEmbeds[0]);
            assert.equal(removeSpaces(deepCSS), removeSpaces(cssContent));
            done();
        }).catch(done);
    });

    it('should get html with script embedded', done => {
        const url = [TEST_WEBSERVER_ADDRESS, 'script.html'].join('/');
        const jsContent = fs.readFileSync(path.join(__dirname, 'pages/script.js'), { encoding: 'utf8' });
        request(url).then(response => {
            const embeds = getEmbedded(response.data);
            assert.equal(embeds.length, 1);
            const embeddedJS = atob(embeds[0]);
            assert.equal(removeSpaces(embeddedJS), removeSpaces(jsContent));
            done();
        }).catch(done);
    });

    it('should get html with image embedded', done => {
        const url = [TEST_WEBSERVER_ADDRESS, 'image.html'].join('/');
        const pngPath = path.join(__dirname, 'pages/image.png');
        const pngContent = fs.readFileSync(pngPath);
        const pngContentBase64 = btoa(pngContent);
        request(url).then(response => {
            const embeds = getEmbedded(response.data);
            assert.equal(embeds.length, 1);
            assert.equal(embeds[0], pngContentBase64);
            done();
        }).catch(done);
    });

    it('should get html with iframe embedded', done => {
        const url = [TEST_WEBSERVER_ADDRESS, 'iframe.html'].join('/');
        const iframePath = path.join(__dirname, 'pages/empty.html');
        const iframeContent = fs.readFileSync(iframePath, { encoding: 'utf8' });
        request(url).then(response => {
            const embeds = getEmbedded(response.data);
            assert.equal(embeds.length, 1);
            const embeddedIframe = atob(embeds[0]);
            assert.equal(removeSpaces(iframeContent), removeSpaces(embeddedIframe));
            done();
        }).catch(done);
    });
});
