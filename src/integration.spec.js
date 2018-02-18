const request = require('superagent'),
  //express = require('express'),
  assert = require('better-assert'),
  //app = express(),
  //url = require('url'),
  //https = require('https'),
  fs = require('fs'),
  key = fs.readFileSync(__dirname + '/../example/server/localhost-test-privkey.pem'),
  cert = fs.readFileSync(__dirname + '/../example/server/localhost-test-cert.pem');
let config, nodeStaticAuth, inst;


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
}


before(function(done) {
  // runs before all tests in this block

  nodeStaticAuth = require('../lib');

  const server = nodeStaticAuth(config, (svr) => {
    inst = svr;
    console.log('test svr running');
    done();
  });
});


describe('static-auth server', function() {

  if (config.server.ssl.enabled) {
    it('should have http listener that redirects to https', function(done) {

      request
        .get('http://localhost:3008')
        .on('redirect', (rs) => {
          console.log('agent redr', rs.headers);
          assert(rs.headers['location'] === 'https://localhost:3009/');
          done();
        })
        .end();

    });
  } else {
    it.skip('serving plain http, so skipping http->https redirect')
  }
  if (config.server.http2) {

    // todo: add http2 test
    //https://github.com/visionmedia/superagent/issues/980
    it.skip('no http2 support for superagent..')
  } else {
    it('should login via Basic auth and access server', function(done) {

      request
        .get(`${config.server.ssl.enabled ? 'https://' : 'http://'}localhost:3009`)
        .auth('test', 'test', {
          type: 'auto'
        })
        .ca(cert)
        .end(function(err, res) {
          console.log('>>>>>agent response', res.text)
          assert(res.ok);
          //assert('Safe and secure!' === res.text);
          done();
        });
    });
  }
  it('should have access logged to a file', function(done) {

    if (config.logger.use) {
      console.log('>>>>>>fajla', fs.existsSync(__dirname + '/../' + config.logger.filename))
      try {
        let log = fs.readFile(__dirname + '/../' + config.logger.filename, 'utf8', (err, data) => {
          if (err) throw new Error(err);
          done();
        });
      } catch (err) {

        if (err.code === 'ENOENT') {
          throw new Error(`File not found, location not valid: ${err}`);
        } else {
          throw new Error(err);
        }
      }
    }
  });
});

// close svr: todo: close both servers
// gulp hangs otherwise
after(function() {
  inst.close();
})
