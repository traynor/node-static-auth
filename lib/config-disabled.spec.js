'use strict';

var _sourceMapSupport2 = require('source-map-support');

var _betterAssert = require('better-assert');

var _betterAssert2 = _interopRequireDefault(_betterAssert);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _superagent = require('superagent');

var _superagent2 = _interopRequireDefault(_superagent);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

(0, _sourceMapSupport2.install)();


/**
 * Features set as disabled tests
 *
 */
var config = void 0,
    inst = void 0;

// eslint-disable-next-line no-sync
var cert = _fs2.default.readFileSync(__dirname + '/../example/server/localhost-test-cert.pem');

config = {
  nodeStatic: {
    // all available node-static options https://www.npmjs.com/package/node-static: `new static.Server(root, options)`
    // use path relative to project root, i.e. process.cwd()
    root: 'example/public',
    customPages: {
      forbidden: 'forbidden.html',
      notFound: 'not-found.html',
      error: 'error.html'
    }
  },
  // our web server options
  server: {
    port: 4012,
    http2: false,
    ssl: {
      enabled: true,
      httpListener: 4010,
      // enter path relative to project root
      key: 'example/server/localhost-test-privkey.pem',
      cert: 'example/server/localhost-test-cert.pem'
    }
  },
  // basic auth credentials
  auth: {
    enabled: false
  },
  // logger file options
  logger: {
    use: false,
    filename: 'disabled-access.log',
    folder: 'example/server/dlogs',
    type: 'combined',
    options: {}
  }
};

before(function (done) {
  // runs before all tests in this block
  var NodeStaticAuth3 = require('../lib');

  // eslint-disable-next-line no-unused-vars
  var disabled = new NodeStaticAuth3(config, function (svr) {
    inst = svr;
    done();
  });
});

describe('static-auth server with logger and auth disabled', function () {

  it('should get home page', function (done) {

    _superagent2.default.get('http://localhost:' + config.server.ssl.httpListener + '/?redirect-2-secured').ca(cert).end(function (err, res) {
      (0, _betterAssert2.default)(res.ok);
      done();
    });
  });

  it('should get custom 404 page', function (done) {

    _superagent2.default.get((config.server.ssl.enabled ? 'https://' : 'http://') + 'localhost:' + config.server.port + '/no-page-here').ca(cert).end(function (err, res) {
      (0, _betterAssert2.default)(res.status === 404);
      (0, _betterAssert2.default)(res.text.includes('<h1>404</h1>'));
      done();
    });
  });
});

after(function (done) {

  inst.close();
  done();
});
//# sourceMappingURL=config-disabled.spec.js.map
