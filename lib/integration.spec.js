'use strict';

var _sourceMapSupport2 = require('source-map-support');

var _lib = require('../lib');

var _lib2 = _interopRequireDefault(_lib);

var _utils = require('./server/utils');

var _utils2 = _interopRequireDefault(_utils);

var _betterAssert = require('better-assert');

var _betterAssert2 = _interopRequireDefault(_betterAssert);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _nodeRunCmd = require('node-run-cmd');

var _nodeRunCmd2 = _interopRequireDefault(_nodeRunCmd);

var _superagent = require('superagent');

var _superagent2 = _interopRequireDefault(_superagent);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

(0, _sourceMapSupport2.install)();


var config = void 0,
    inst = void 0,
    logg = void 0;

/**
 * Integration tests
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
    port: 3009,
    http2: false,
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
    // hardcode credentials for testing
    enabled: true, // false disable
    name: 'test' || process.env.NAME,
    pass: 'test' || process.env.PASS,
    realm: 'Private' || process.env.REALM
  },
  // logger file options
  logger: {
    use: true, // false disable
    // make sure directory exists first
    filename: 'test-access.log',
    folder: 'example/server/logs2',
    type: 'combined'
  }
};

before(function (done) {
  // runs before all tests in this block

  var nodeStaticAuth = new _lib2.default(config, function (svr, log) {
    inst = svr;
    // get logger instance to close stream
    logg = log;
    console.log('integ test svr running');
    done();
  });
});

var logs = [];

describe('static-auth server', function () {

  it('should not instantiate without config', function (done) {

    try {
      var noConf = new _lib2.default({});
    } catch (err) {
      (0, _betterAssert2.default)(err.message.includes('Config is mandatory') === true);
      done();
    }
  });
  if (config.server.ssl.enabled) {
    it('should have http listener that redirects to https', function (done) {

      _superagent2.default.get('http://localhost:' + config.server.ssl.httpListener + '/?redirect-2-secured').on('redirect', function (rs) {
        (0, _betterAssert2.default)(rs.headers.location === 'https://localhost:' + config.server.port + '/?redirect-2-secured');
        logs.push('/?redirect-2-secured');
        done();
      }).end();
    });
  } else {
    it.skip('serving plain http, so skipping http->https redirect');
  }

  var supportsHttp2 = _utils2.default.isHttp2Supported();

  if (config.server.http2 && supportsHttp2) {
    it.skip('no http2 support for superagent..');
  } else {
    it('should login via Basic auth and access server', function (done) {

      _superagent2.default.get((config.server.ssl.enabled ? 'https://' : 'http://') + 'localhost:' + config.server.port + '/?successful-login').auth(config.auth.name, config.auth.pass, {
        type: 'auto'
      }).ca(cert).end(function (err, res) {
        (0, _betterAssert2.default)(res.ok);
        logs.push('/?successful-login');
        done();
      });
    });
    it('should get other static files', function (done) {

      _superagent2.default.get((config.server.ssl.enabled ? 'https://' : 'http://') + 'localhost:' + config.server.port + '/css.css').auth(config.auth.name, config.auth.pass, {
        type: 'auto'
      }).ca(cert).end(function (err, res) {
        (0, _betterAssert2.default)(res.ok);
        logs.push('/css.css');
        done();
      });
    });
    it('should not allow access if Basic auth is required', function (done) {

      if (config.auth.enabled) {
        _superagent2.default.get((config.server.ssl.enabled ? 'https://' : 'http://') + 'localhost:' + config.server.port + '/?forbidden').auth('hack', 'hack', {
          type: 'auto'
        }).ca(cert).end(function (err, res) {
          (0, _betterAssert2.default)(res.status === 401);
          logs.push('/?forbidden');
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
      _superagent2.default.get((config.server.ssl.enabled ? 'https://' : 'http://') + 'localhost:' + config.server.port + '/no-page-here').auth(config.auth.name, config.auth.pass, {
        type: 'auto'
      }).ca(cert).end(function (err, res) {
        (0, _betterAssert2.default)(res.status === 404);
        logs.push('/no-page-here');
        done();
      });
    }
  });
  it('should have access logged to a file', function (done) {

    if (config.logger.use) {
      //console.log('>>>>>>log file:', fs.existsSync(__dirname + '/../' + config.logger.filename))
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

  // clean up logs folders
  // need to close fs.stream manually
  // due to fuse hidden file preventing on some linux dist
  logg.close(function () {
    //console.log('logg closed');
    inst.close(function () {
      //console.log('svr closed');
      var dataCallback = function dataCallback(data) {
        //console.log('done deleting files', data)
        done();
      };
      _nodeRunCmd2.default.run('rm -rf ' + config.logger.folder, {
        onDone: dataCallback,
        onError: dataCallback
        //onData: dataCallback,
      });
    });
  });
});
//# sourceMappingURL=integration.spec.js.map
