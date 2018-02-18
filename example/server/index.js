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
            enabled: false,
            // enter path relative to this script
            key: 'example/server/server.key',//example/server/server.key',
            cert: 'example/server/server.crt'//example/server/server.crt'
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
