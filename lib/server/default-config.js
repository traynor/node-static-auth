'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _sourceMapSupport2 = require('source-map-support');

var _path = require('path');

(0, _sourceMapSupport2.install)();

var config = {
  nodeStatic: {
    // all available node-static options https://www.npmjs.com/package/node-static: `new static.Server(root, options)`
    // use path relative to project root, i.e. process.cwd()
    root: './',
    options: {
      indexFile: 'index.html' || 'index.html'
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
  // todo: enable morgan conf
  logger: {
    use: true, // false disable
    // make sure directory exists first
    filename: 'access.log',
    folder: (0, _path.join)((0, _path.dirname)(require.main.filename), 'logs'),
    logRotation: {
      use: false,
      options: {
        interval: '1d',
        path: (0, _path.join)((0, _path.dirname)(require.main.filename), 'logs')
      }
    },
    type: 'combined',
    options: {}
  }
};

exports.default = config;
module.exports = exports['default'];
//# sourceMappingURL=default-config.js.map
