'use strict';

var _sourceMapSupport2 = require('source-map-support');

var _betterAssert = require('better-assert');

var _betterAssert2 = _interopRequireDefault(_betterAssert);

var _defaultConfig = require('./server/default-config');

var _defaultConfig2 = _interopRequireDefault(_defaultConfig);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _nodeRunCmd = require('node-run-cmd');

var _nodeRunCmd2 = _interopRequireDefault(_nodeRunCmd);

var _superagent = require('superagent');

var _superagent2 = _interopRequireDefault(_superagent);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

(0, _sourceMapSupport2.install)();


var config = void 0,
    inst = void 0;

//const key = fs.readFileSync(__dirname + '/../' + defaultConfig.server.ssl.key);
var cert = _fs2.default.readFileSync(__dirname + '/../' + _defaultConfig2.default.server.ssl.cert);

config = {
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
    port: 4012,
    http2: false,
    ssl: {
      enabled: true,
      httpListener: 4010,
      // enter path relative to project root
      key: 'example/server/localhost-test-privkey.pem',
      cert: 'example/server/localhost-test-cert.pem'
    },
    customPages: {
      forbidden: 'forbidden.html',
      notFound: 'notFound.html',
      error: 'error.html'
    }
  },
  // basic auth credentials
  auth: {
    enabled: false, // false disable
    name: 'test' || process.env.NAME,
    pass: 'test' || process.env.PASS,
    realm: 'Private' || process.env.REALM
  },
  // logger file options
  // todo: enable morgan conf
  logger: {
    use: false, // false disable
    // make sure directory exists first
    filename: 'disabled-access.log',
    folder: 'example/server/dlogs',
    type: 'combined',
    options: {}
  }
};

before(function (done) {
  // runs before all tests in this block

  var NodeStaticAuth3 = require('../lib');

  var disabled = new NodeStaticAuth3(config, function (svr) {
    inst = svr;
    done();
  });
});

describe('static-auth server', function () {

  it('should get with logger and auth disabled', function (done) {

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
