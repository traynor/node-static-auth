const request = require('superagent'),
  //express = require('express'),
  assert = require('better-assert'),
  //app = express(),
  //url = require('url'),
  //https = require('https'),
  fs = require('fs'),
  key = fs.readFileSync(__dirname + '/../example/server/mykeyfile.pem'),
  cert = fs.readFileSync(__dirname + '/../example/server/mycertfile.cer');
let nodeStaticAuth, inst;


before(function(done) {
  // runs before all tests in this block

  nodeStaticAuth = require('../lib');
  const config = {
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
      ssl: {
        enabled: false,
        httpListener: 3008,
        // enter path relative to this script
        key: 'example/server/mykeyfile.pem', //example/server/server.key',
        cert: 'example/server/mycertfile.cer' //example/server/server.crt'
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

  const server = nodeStaticAuth(config, (svr) => {
    inst = svr;
    console.log('test svr running');
    done();
  });
});


describe('static-auth server', function() {

  it.skip('should redirect to https', function(done) {

    request
      .get('http://localhost:3008')
      .on('redirect', (rs) => {
        console.log('agent redr', rs.headers);
        assert(rs.headers['location'] === 'https://localhost:3009/');
        done();
      })
      .end();

  });
  it('should get https', function(done) {

    request
      .get('http://localhost:3009')
      .auth('test', 'test')
      .ca(cert)
      .end(function(err, res) {
        console.log('>>>>>agent response', res.text)
        assert(res.ok);
        //assert('Safe and secure!' === res.text);
        done();
      });
  });
});

// close svr: todo: close both servers
// gulp hangs otherwise
after(function() {
  inst.close();
})
