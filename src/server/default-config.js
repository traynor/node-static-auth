import {
    dirname,
    join
} from 'path';

const config = {
    nodeStatic: {
        root: './',
        options: {
            indexFile: 'index.html',
            gzip: true
        }
    },
    // our web server options
    server: {
        port: 3001,
        // ExperimentalWarning: The http2 module is an experimental API.
        http2: false,
        ssl: {
            enabled: false,
            httpListener: 3000,
            // enter path to real certificate relative to project root
            // otherwise use self-signed for testing
            /**
             * these are some bogus certificates for testing
             * create self-signed localhost testing certificate that expires in 10 years:
             * openssl req -x509 -newkey rsa:2048 -nodes -sha256 -days 3650 -subj //CN=localhost  -keyout localhost-test-privkey.pem -out localhost-test-cert.pem
             */
            key: '',
            cert: ''
        },
        customPages: false
    },
    // basic auth credentials
    auth: {
        enabled: true,
        name: process.env.NAME,
        pass: process.env.PASS,
        realm: process.env.REALM || 'Private'
    },
    // logger file options
    logger: {
        use: true,
        filename: 'access.log',
        folder: 'server-logs',
        logRotation: {
            use: false,
            options: {
                interval: '1d',
                path: 'server-logs'
            }
        },
        type: 'combined',
        options: {}
    }
}

export default config;
