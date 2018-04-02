# node-static-auth
Serve static files with Basic auth protection and access file logging service on top of Node.JS' native `HTTP`/`HTTP2` server with `HTTPS` support.

# Features:

- static `HTTP` or `HTTP/2`server
- `HTTPS` support with `HTTP` server listener for `HTTP`->`HTTPS` redirect
- `Basic auth` protection
- access log file with log file rotation option
- serve your custom error pages (401, 404, 500), defaults to built-in ones
- pass native config to [`node-static`](https://www.npmjs.com/package/node-static), [`morgan`](https://www.npmjs.com/package/morgan) and [`rotating-file-stream`](https://npmjs.com/package/rotating-file-stream) modules
- disable/enable/customize features

___Note about HTTP2___

You must install node `>= 9.x` to use it.

There could probably be some bugs due to its experimental status, and no support from other used modules, so they're going to be dealt with in time.

# Under the hood

It bundles [`node-static`](https://www.npmjs.com/package/node-static) [`basic-auth`](https://www.npmjs.com/package/basic-auth), [`morgan`](https://www.npmjs.com/package/morgan) and [`rotating-file-stream`](https://npmjs.com/package/rotating-file-stream) modules on top of Node.js built-in `HTTP`, `HTTP2`server, as well as `HTTPS` server. It extends static server with error pages handler with custom error pages handler option.

You can pass the same config/options for each module, as you would normaly do (except for creating write stream with `morgan`).


# Usage

- __Install:__

```bash
npm i -S node-static-auth
```

- __Load module__

```js
const NodeStaticAuth = require('node-static-auth');
```

- __Setup config__

Usage consists of setting up config object and passing it to `node-static-auth` instance.

There are 4 main settings areas/properties in config object you set up, according to what features you want:

```js
const config = {
	nodeStatic: {
		// set static server options (root, index file etc.)
	},
	server {
		// set web server options (ports, enable/disable http/2, https, http->https, custom pages etc.)
	},
	auth: {
		// set Basic auth protection (enable/disable etc.)
	},
	logger: {
		// set logger options (enable/disable, file path, log type, log rotation etc.)
	}
}
```

# Example

## HTTP/2 static server with HTTPS, logger and basic auth

```js
const NodeStaticAuth = require('node-static-auth');

const config = {
    // set static server
    nodeStatic: {
        // use path relative to project root, i.e. `process.cwd()`
        root: 'path-to-public-directory',
        // pass the native opts for node-static here
        options: {
            indexFile: 'index.html'
        }
    },
    // set web server options
    server: {
        port: 3001,
        // `ExperimentalWarning: The http2 module is an experimental API.`
        http2: false, // set `true` to enable, disables custom pages if set
        ssl: {
            enabled: true, // set `false` to disable
            httpListener: 3000, // set HTTP listener for HTTP->HTTPS redirect
            // enter path to certificate relative to project root
            // note that if reading certificate fails it will fallback to HTTP server
            key: 'path-to-your-privkey',
            cert: 'path-to-your-cert'
        },
        // set your custom pages here to be served on 401, 404 and 500
        // relative to `root` property
        // NOTE: you cannot use them with HTTP2 for now, it will
        // fallback to default pages (not so pretty)
        customPages: {
            forbidden: 'forbidden.html',
            notFound: 'not-found.html',
            error: 'error.html'
        }
    },
    // set basic auth credentials
    auth: {
        enabled: true, // set `false` to disable
        name: process.env.NAME,
        pass: process.env.PASS,
        realm: process.env.REALM
    },
    // set logger file options
    logger: {
        use: true, // set `false` to disable
        // directory will be created if it doesn't exist
        // use path relative to project root, i.e. `process.cwd()`
        filename: 'access.log',
        folder: 'path-to-logs-directory',
        // setup log rotation: https://registry.npmjs.org/rotating-file-stream
        logRotation: {
            use: false, // set `true` to enable
            // pass the native opts for rfs here
            options: {}
        },
        // pass the native opts for morgan here
        type: 'combined',        
        options: {}
    }
};

// start the server
const server = new NodeStaticAuth(config);
```

Or inspect it here: [example](example/app.js).

Also, check out [test files (.spec.js)](src/) for more combinations.

___NOTE___:

If you omit some settings, it may fallback to [default config](src/server/default-config.js), similar to ones in the example above.


## run example locally
```bash
npm i
npm start
```

## test
```bash
npm i
gulp test
```

## develop
```bash
npm i
# to test without http/2:
gulp
# to test with http/2:
# browser-sync doesn't work well with http/2 so you need
# to test manually in that case, and run:
gulp no-bs
```

# TODO

- [ ] fix lint errors;
- [ ] feat(logger): add print to stdout option;

# License
MIT
