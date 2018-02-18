const nodeStaticAuth = require('../../lib');

console.log('>>example go');
const config = {
    nodeStatic: {
        // all available node-static options https://www.npmjs.com/package/node-static: `new static.Server(root, options)`
        // use path relative to project root, i.e. process.cwd()
        root: 'example/public',
        options: {
            indexFile: 'index.html' || 'index.html'
        }
    },
    // our web server options
    server: {
        port: 3001,
        ssl: {
            enabled: true,
            httpListener: 3000,
            // enter path relative to project root
            key: 'example/server/localhost-test-privkey.pem',
            cert: 'example/server/localhost-test-cert.pem'
            /**
             * create self-signed localhost testing certificate that expires in 10 years:
             * openssl req -x509 -newkey rsa:2048 -nodes -sha256 -days 3650 -subj //CN=localhost  -keyout localhost-test-privkey.pem -out localhost-test-cert.pem
             */

        }
    },
    // basic auth credentials
    auth: {
        use: true, // false disable
        name: 'test' || process.env.NAME,
        pass: 'test' || process.env.PASS,
        realm: 'Private' || process.env.REALM
    },
    // logger file options
    // todo: enable morgan conf
    logger: {
        use: true, // false disable
        // make sure directory exists first
        filename: 'example/server/access.log',
        type: 'combined',
        fields: []
    }
}

const server = nodeStaticAuth(config);
