'use strict';

var _sourceMapSupport2 = require('source-map-support');

var _betterAssert = require('better-assert');

var _betterAssert2 = _interopRequireDefault(_betterAssert);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _nodeRunCmd = require('node-run-cmd');

var _nodeRunCmd2 = _interopRequireDefault(_nodeRunCmd);

var _superagent = require('superagent');

var _superagent2 = _interopRequireDefault(_superagent);

var _utils = require('./server/utils');

var _utils2 = _interopRequireDefault(_utils);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

(0, _sourceMapSupport2.install)();


var config = void 0,
    inst = void 0,
    logg = void 0;

var cert = _fs2.default.readFileSync(__dirname + '/../example/server/localhost-test-cert.pem');

config = {
  nodeStatic: {
    // all available node-static options https://www.npmjs.com/package/node-static: `new static.Server(root, options)`
    // use path relative to project root, i.e. process.cwd()
    root: 'example/public'
  },
  // our web server options
  server: {
    port: 5012,
    http2: false,
    ssl: {
      enabled: true,
      httpListener: 3010,
      // enter path relative to project root
      key: 'example/server/localhost-test-privkey.pem',
      cert: 'example/server/localhost-test-cert.pem'
    },
    customPages: {
      forbidden: 'forbidden.html',
      notFound: 'not-found.html',
      error: 'error.html'
    }
  },
  // basic auth credentials
  auth: {
    enabled: true, // false disable
    name: 'test',
    pass: 'test',
    realm: 'Private'
  },
  logger: {
    use: true, // false disable
    // make sure directory exists first
    filename: 'custom-access.log',
    folder: 'example/server/clogs',
    type: 'combined'
  }
};

before(function (done) {
  // runs before all tests in this block

  var NodeStaticAuth2 = require('../lib');

  var custom = new NodeStaticAuth2(config, function (svr, log) {
    inst = svr;
    // get logger instance to close stream
    logg = log;
    console.log('custom test svr running');
    done();
  });
});

// todo: read content
var forbidden = '<h1 style="color:red;">Forbidden</h1>';
var notFound = '<h1>404</h1>';

describe('static-auth server with custom pages', function () {

  it('should get custom forbidden page ', function (done) {
    _superagent2.default.get((config.server.ssl.enabled ? 'https://' : 'http://') + 'localhost:' + config.server.port + '/?forbidden').auth('hack', 'hack', {
      type: 'auto'
    }).ca(cert).end(function (err, res) {
      (0, _betterAssert2.default)(res.status === 401);
      (0, _betterAssert2.default)(res.text.includes(forbidden));
      done();
    });
  });
  it('should get custom 404 page', function (done) {

    var supportsHttp2 = _utils2.default.isHttp2Supported();

    if (config.server.http2 && supportsHttp2) {
      this.skip();
    } else {
      _superagent2.default.get((config.server.ssl.enabled ? 'https://' : 'http://') + 'localhost:' + config.server.port + '/no-page-here').auth(config.auth.name, config.auth.pass, {
        type: 'auto'
      }).ca(cert).end(function (err, res) {
        (0, _betterAssert2.default)(res.status === 404);
        (0, _betterAssert2.default)(res.text.includes(notFound));
        done();
      });
    }
  });
  it('should get custom 500 page', function (done) {

    // todo
    this.skip();
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
//# sourceMappingURL=custom.spec.js.map
