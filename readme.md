## axios-inline

Axios-like client for recursive fetching web resources.

### Install

```bash
npm i border-radius/axios-inline
```

### Require

```js
const axiosInline = require('axios-inline');
// or
import axiosInline from 'axios-line';
```

### Use

```js
axiosInline('http://website.com/some-page.html')
.then(response => {
    // response.data contain some-page.html with all resources included (images, styles, iframes) in one file
});
```

### Test

```bash
git clone https://github.com/border-radius/axios-inline
cd axios-inline
npm install
npm test
```
