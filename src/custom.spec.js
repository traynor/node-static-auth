import assert from 'better-assert';
import defaultConfig from './server/default-config';
import fs from 'fs';
import request from 'superagent';

let config, inst;

//const key = fs.readFileSync(__dirname + '/../' + defaultConfig.server.ssl.key);
const cert = fs.readFileSync(__dirname + '/../' + defaultConfig.server.ssl.cert);

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
      notFound: 'notFound.html',
      error: 'error.html'
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
    filename: 'example/server/custom-access.log',
    type: 'combined',
    fields: []
  }
}


before(function(done) {
  // runs before all tests in this block

  const NodeStaticAuth2 = require('../lib');

  let custom = new NodeStaticAuth2(config, (svr) => {
    inst = svr;
    console.log('custom svr running', config.server);
    done();
  });
});


// todo: read content
let forbidden = `<h1 style="color:red;">forbidden</h1>`;
let notFound = `<h1>404</h1>`;

describe('static-auth server', function() {


  it('should get custom forbidden page ', function(done) {
    request
      .get(`${config.server.ssl.enabled ? 'https://' : 'http://'}localhost:${config.server.port}/?forbidden`)
      .auth('hack', 'hack', {
        type: 'auto'
      })
      .ca(cert)
      .end(function(err, res) {
        assert(res.status === 401);
        assert(res.text.includes(forbidden));
        done();
      });
  });
  it('should get custom 404 page', function(done) {

    if (config.server.http2 && supportsHttp2) {
      this.skip();
    } else {
      request
        .get(`${config.server.ssl.enabled ? 'https://' : 'http://'}localhost:${config.server.port}/no-page-here`)
        .auth('test', 'test', {
          type: 'auto'
        })
        .ca(cert)
        .end(function(err, res) {
          assert(res.status === 404);
          assert(res.text.includes(notFound));
          done();
        });
    }
  });
  it('should get custom 500 page', function(done) {

    this.skip();

  });

});

// close svr: todo: close both servers
// gulp hangs otherwise
after(function() {
  fs.unlink(config.logger.filename);
  inst.close();
})
