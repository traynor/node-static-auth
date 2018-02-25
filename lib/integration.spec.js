'use strict';

var _sourceMapSupport2 = require('source-map-support');

var _betterAssert = require('better-assert');

var _betterAssert2 = _interopRequireDefault(_betterAssert);

var _defaultConfig = require('./server/default-config');

var _defaultConfig2 = _interopRequireDefault(_defaultConfig);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

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
    port: 3009,
    http2: true,
    ssl: {
      enabled: true,
      httpListener: 3008,
      // enter path relative to project root
      key: 'example/server/localhost-test-privkey.pem',
      cert: 'example/server/localhost-test-cert.pem'
    }
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
    filename: 'example/server/test-access.log',
    type: 'combined',
    fields: []
  }
};

before(function (done) {
  // runs before all tests in this block

  var NodeStaticAuth = require('../lib');

  var nodeStaticAuth = new NodeStaticAuth(config, function (svr) {
    inst = svr;
    console.log('test svr running');
    done();
  });
});

describe('static-auth server', function () {

  if (config.server.ssl.enabled) {
    it('should have http listener that redirects to https', function (done) {

      _superagent2.default.get('http://localhost:3008').on('redirect', function (rs) {
        (0, _betterAssert2.default)(rs.headers.location === 'https://localhost:3009/');
        done();
      }).end();
    });
  } else {
    it.skip('serving plain http, so skipping http->https redirect');
  }
  var supportsHttp2 = parseInt(process.versions.node.split('.')[0], 10) >= 9;
  if (config.server.http2 && supportsHttp2) {

    // todo: add http2 test
    //https://github.com/visionmedia/superagent/issues/980
    it.skip('no http2 support for superagent..');
    console.log('\x1b[41m', 'browser-sync won\'t work if using HTTP/2, use `gulp no-bs` and test manually with browser', '\x1b[0m');
  } else {
    it('should login via Basic auth and access server', function (done) {

      _superagent2.default.get((config.server.ssl.enabled ? 'https://' : 'http://') + 'localhost:3009').auth('test', 'test', {
        type: 'auto'
      }).ca(cert).end(function (err, res) {
        (0, _betterAssert2.default)(res.ok);
        done();
      });
    });
    it('should not allow access if Basic auth is required', function (done) {

      if (config.auth.enabled) {
        _superagent2.default.get((config.server.ssl.enabled ? 'https://' : 'http://') + 'localhost:3009').auth('hack', 'hack', {
          type: 'auto'
        }).ca(cert).end(function (err, res) {
          (0, _betterAssert2.default)(res.status === 401);
          done();
        });
      } else {
        this.skip('no basic auth required');
      }
    });
  }
  it('should give 404 when page not found Basic auth', function (done) {

    if (config.server.http2 && supportsHttp2) {
      this.skip();
    } else {
      _superagent2.default.get((config.server.ssl.enabled ? 'https://' : 'http://') + 'localhost:3009/no-page-here').auth('test', 'test', {
        type: 'auto'
      }).ca(cert).end(function (err, res) {
        (0, _betterAssert2.default)(res.status === 404);
        done();
      });
    }
  });
  it('should have access logged to a file', function (done) {

    if (config.logger.use) {
      //console.log('>>>>>>log file:', fs.existsSync(__dirname + '/../' + config.logger.filename))
      try {
        _fs2.default.readFile(__dirname + '/../' + config.logger.filename, 'utf8', function (err, data) {
          if (err) {
            throw new Error(err);
          } else {
            done();
          }
        });
      } catch (err) {

        if (err.code === 'ENOENT') {
          throw new Error('File not found, location not valid: ' + err);
        } else {
          throw new Error(err);
        }
      }
    }
  });
});

// close svr: todo: close both servers
// gulp hangs otherwise
after(function () {
  _fs2.default.unlink(config.logger.filename);
  inst.close();
});
//# sourceMappingURL=integration.spec.js.map
