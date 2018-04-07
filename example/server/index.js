const NodeStaticAuth = require('../../lib');

console.log('>>node-static-auth example go');
const config = {
    // set static server
    // https://www.npmjs.com/package/node-static: `new static.Server(root, options)`
    nodeStatic: {
        // use path relative to project root, i.e. `process.cwd()`
        root: 'example/public',
        // pass the native opts for node-static here
        options: {
            indexFile: 'index.html'
        },
        // set your custom pages here to be served on 401, 404 and 500
        // relative to `nodeStatic.root` property, i.e. your public folder
        // NOTE: you cannot use them with HTTP2 for now, it will
        // fallback to default pages (less pretty)
        customPages: {
            forbidden: 'forbidden.html',
            notFound: 'not-found.html',
            error: 'error.html'
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
            /**
             * these are some bogus certificates for testing
             * create self-signed localhost testing certificate that expires in 10 years:
             * openssl req -x509 -newkey rsa:2048 -nodes -sha256 -days 3650 -subj //CN=localhost  -keyout localhost-test-privkey.pem -out localhost-test-cert.pem
             */
            key: 'example/server/localhost-test-privkey.pem',
            cert: 'example/server/localhost-test-cert.pem'
        }
    },
    // set basic auth credentials
    auth: {
        enabled: true, // set `false` to disable
        name: process.env.NAME || 'test',
        pass: process.env.PASS || 'test',
        realm: process.env.REALM || 'Restricted content'
    },
    // set logger file options
    logger: {
        use: true, // set `false` to disable
        // NOTE: directory will be created if it doesn't exist
        // use path relative to project root, i.e. `process.cwd()`
        filename: 'access.log',
        folder: 'example/server/logs', // here is path relative to this project
        // setup log rotation:
        // `https://www.npmjs.com/package/rotating-file-stream`
        // logs will be created within given folder
        logRotation: {
            use: false, // set `true` to enable
            // pass the native opts for `rfs` here
            options: {}
        },
        // pass the native opts for `morgan`:
        // https://www.npmjs.com/package/morgan
        type: 'combined',
        options: {}
    }
};

// start the server
const server = new NodeStaticAuth(config);
