'use strict';

var _sourceMapSupport2 = require('source-map-support');

(0, _sourceMapSupport2.install)();
var request = require('superagent'),

//express = require('express'),
assert = require('better-assert'),

//app = express(),
//url = require('url'),
//https = require('https'),
fs = require('fs'),
    key = fs.readFileSync(__dirname + '/../example/server/localhost-test-privkey.pem'),
    cert = fs.readFileSync(__dirname + '/../example/server/localhost-test-cert.pem');
var config = void 0,
    nodeStaticAuth = void 0,
    inst = void 0;

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
};

before(function (done) {
  // runs before all tests in this block

  nodeStaticAuth = require('../lib');

  var server = nodeStaticAuth(config, function (svr) {
    inst = svr;
    console.log('test svr running');
    done();
  });
});

describe('static-auth server', function () {

  if (config.server.ssl.enabled) {
    it('should have http listener that redirects to https', function (done) {

      request.get('http://localhost:3008').on('redirect', function (rs) {
        console.log('agent redr', rs.headers);
        assert(rs.headers['location'] === 'https://localhost:3009/');
        done();
      }).end();
    });
  } else {
    it.skip('serving plain http, so skipping http->https redirect');
  }
  var supportsHttp2 = parseInt(process.versions.node.split('.')[0]) >= 9;
  if (config.server.http2 && supportsHttp2) {

    // todo: add http2 test
    //https://github.com/visionmedia/superagent/issues/980
    it.skip('no http2 support for superagent..');
    console.log('\x1b[41m', 'browser-sync won\'t work if using HTTP/2, use `gulp no-bs` and test manually with browser', '\x1b[0m');
  } else {
    it('should login via Basic auth and access server', function (done) {

      request.get((config.server.ssl.enabled ? 'https://' : 'http://') + 'localhost:3009').auth('test', 'test', {
        type: 'auto'
      }).ca(cert).end(function (err, res) {
        console.log('>>>>>agent response', res.text);
        assert(res.ok);
        //assert('Safe and secure!' === res.text);
        done();
      });
    });
  }
  it('should have access logged to a file', function (done) {

    if (config.logger.use) {
      console.log('>>>>>>fajla', fs.existsSync(__dirname + '/../' + config.logger.filename));
      try {
        var log = fs.readFile(__dirname + '/../' + config.logger.filename, 'utf8', function (err, data) {
          if (err) throw new Error(err);
          done();
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
  inst.close();
});
//# sourceMappingURL=integration.spec.js.map
