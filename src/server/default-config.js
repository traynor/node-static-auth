import {
  dirname,
  join
} from 'path';
const config = {
  nodeStatic: {
    // all available node-static options https://www.npmjs.com/package/node-static: `new static.Server(root, options)`
    // use path relative to project root, i.e. process.cwd()
    root: './',
    options: {
      indexFile: 'index.html',
      gzip: true
    }
  },
  // our web server options
  server: {
    port: 3001,
    // (node:4200) ExperimentalWarning: The http2 module is an experimental API.
    // browser-sync proxy no http/2
    // https://github.com/BrowserSync/browser-sync/issues/1338
    http2: true,
    ssl: {
      enabled: true,
      httpListener: 3000,
      // enter path to real certificate relative to project root
      // otherwise use self-signed for testing
      /**
       * these are some bogus certificates for testing
       * create self-signed localhost testing certificate that expires in 10 years:
       * openssl req -x509 -newkey rsa:2048 -nodes -sha256 -days 3650 -subj //CN=localhost  -keyout localhost-test-privkey.pem -out localhost-test-cert.pem
       */
      key: 'example/server/localhost-test-privkey.pem',
      cert: 'example/server/localhost-test-cert.pem'
    },
    customPages: false
  },
  // basic auth credentials
  auth: {
    enabled: true, // false disable
    name: 'test' || process.env.NAME,
    pass: 'test' || process.env.PASS,
    realm: 'Private' || process.env.REALM
  },
  // logger file options
  logger: {
    use: true, // false disable
    // make sure directory exists first
    filename: 'access.log',
    folder: join(dirname(require.main.filename), 'logs'),
    logRotation: {
      use: false,
      options: {
        interval:'1d',
        path: join(dirname(require.main.filename), 'logs')
      }
    },
    type: 'combined',
    options: {}
  }
}

export default config;
