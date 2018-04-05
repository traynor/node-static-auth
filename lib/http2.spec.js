'use strict';

var _sourceMapSupport2 = require('source-map-support');

var _utils = require('./server/utils');

var _utils2 = _interopRequireDefault(_utils);

var _betterAssert = require('better-assert');

var _betterAssert2 = _interopRequireDefault(_betterAssert);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _nodeRunCmd = require('node-run-cmd');

var _nodeRunCmd2 = _interopRequireDefault(_nodeRunCmd);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

(0, _sourceMapSupport2.install)();


var config = void 0,
    inst = void 0;

/**
 * http2 server tests
 *
 */

// eslint-disable-next-line no-sync
var cert = _fs2.default.readFileSync(__dirname + '/../example/server/localhost-test-cert.pem');

config = {
  nodeStatic: {
    // all available node-static options https://www.npmjs.com/package/node-static: `new static.Server(root, options)`
    // use path relative to project root, i.e. process.cwd()
    root: 'example/public'
  },
  // our web server options
  server: {
    port: 3209,
    http2: true,
    ssl: {
      enabled: true,
      httpListener: 3208,
      // enter path relative to project root
      key: 'example/server/localhost-test-privkey.pem',
      cert: 'example/server/localhost-test-cert.pem'
    }
  },
  // basic auth credentials
  auth: {
    enabled: true,
    name: 'test',
    pass: 'test',
    realm: 'Private'
  },
  // logger file options
  logger: {
    use: true,
    filename: 'http2-test-access.log',
    folder: 'example/server/http2-logs2',
    type: 'combined'
  }

  // skip if no http2 support
};if (!_utils2.default.isHttp2Supported()) {
  describe('static-auth server', function () {
    it.skip('no http2 support, skip http/2 tests');
  });
} else {

  // load http2 here
  var http2 = require('http2');

  before(function (done) {
    // runs before all tests in this block

    var NodeStaticAuth = require('../lib');

    // eslint-disable-next-line no-unused-vars
    var nodeStaticAuth = new NodeStaticAuth(config, function (svr) {
      inst = svr;
      console.log('http2 svr running');
      done();
    });
  });

  var logs = [];

  var auth = 'Basic ' + Buffer.from(config.auth.name + ':' + config.auth.pass).toString('base64');

  var homePage = '<h1 class="red">RED-5 standing by</h1>';

  describe('http/2 static-auth server', function () {

    it('should login via Basic auth and access server', function (done) {

      var headers = {
        'Authorization': auth,
        ':path': '/?http2-login'
      };
      var status = false;

      var client = http2.connect((config.server.ssl.enabled ? 'https://' : 'http://') + 'localhost:' + config.server.port, {
        ca: cert
      });
      client.on('error', function (err) {
        return console.error(err);
      });

      var req = client.request(headers);

      req.on('response', function (headers) {

        status = headers[':status'];
      });

      req.setEncoding('utf8');
      var data = '';
      req.on('data', function (chunk) {
        data += chunk;
      });
      req.on('end', function () {
        (0, _betterAssert2.default)(status === 200);
        (0, _betterAssert2.default)(data.includes(homePage));
        client.close();
        logs.push('/?http2-login');
        done();
      });
      req.end();
    });

    it('should get other static files', function (done) {

      var headers = {
        'Authorization': auth,
        ':path': '/css.css'
      };
      var status = false;

      var client = http2.connect((config.server.ssl.enabled ? 'https://' : 'http://') + 'localhost:' + config.server.port, {
        ca: cert
      });
      client.on('error', function (err) {
        return console.error(err);
      });

      var req = client.request(headers);

      req.on('response', function (headers) {

        status = headers[':status'];
      });

      req.setEncoding('utf8');
      var data = '';
      req.on('data', function (chunk) {
        data += chunk;
      });
      req.on('end', function () {
        (0, _betterAssert2.default)(status === 200);
        client.close();
        logs.push('/css.css');
        done();
      });
      req.end();
    });

    it('should get 404', function (done) {

      var headers = {
        'Authorization': auth,
        ':path': '/no-such-page'
      };
      var status = false;

      var client = http2.connect((config.server.ssl.enabled ? 'https://' : 'http://') + 'localhost:' + config.server.port, {
        ca: cert
      });
      client.on('error', function (err) {
        return console.error(err);
      });

      var req = client.request(headers);

      req.on('response', function (headers) {

        status = headers[':status'];
      });

      req.setEncoding('utf8');
      var data = '';
      req.on('data', function (chunk) {
        data += chunk;
      });
      req.on('end', function () {
        (0, _betterAssert2.default)(status === 404);
        client.close();
        logs.push('/no-such-page');
        done();
      });
      req.end();
    });
    it('should not allow access if Basic auth is required', function (done) {
      var bogusAuth = 'Basic ' + Buffer.from('hack:hack').toString('base64');
      var headers = {
        'Authorization': bogusAuth,
        ':path': '/?forbidden'
      };
      var status = false;

      var client = http2.connect((config.server.ssl.enabled ? 'https://' : 'http://') + 'localhost:' + config.server.port, {
        ca: cert
      });
      client.on('error', function (err) {
        return console.error(err);
      });

      var req = client.request(headers);

      req.on('response', function (headers) {

        status = headers[':status'];
      });

      req.setEncoding('utf8');
      var data = '';
      req.on('data', function (chunk) {
        data += chunk;
      });
      req.on('end', function () {
        (0, _betterAssert2.default)(status === 401);
        client.close();
        logs.push('/?forbidden');
        done();
      });
      req.end();
    });
    it('should have access logged to a file', function (done) {

      if (config.logger.use) {
        try {
          _fs2.default.readFile(__dirname + '/../' + config.logger.folder + '/' + config.logger.filename, 'utf8', function (err, data) {
            if (err) {
              throw new Error(err);
            } else {
              var passing = false;
              logs.forEach(function (log) {
                if (data.includes(log)) {
                  passing = true;
                } else {
                  console.log('access failed:', log, 'data', data);
                  passing = false;
                  throw new Error('Access not logged');
                }
              });
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

  after(function (done) {

    var dataCallback = function dataCallback() {
      done();
    };
    _nodeRunCmd2.default.run('rm -rf ' + config.logger.folder, {
      onDone: dataCallback
    });
    inst.close();
  });
}
//# sourceMappingURL=http2.spec.js.map
