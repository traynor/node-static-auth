import assert from 'better-assert';
import fs from 'fs';
import nrc from 'node-run-cmd';
import request from 'superagent';

let config, inst;

const cert = fs.readFileSync(`${__dirname}/../example/server/localhost-test-cert.pem`);

config = {
  nodeStatic: {
    // all available node-static options https://www.npmjs.com/package/node-static: `new static.Server(root, options)`
    // use path relative to project root, i.e. process.cwd()
    root: 'example/public'
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
      notFound: 'not-found.html',
      error: 'error.html'
    }
  },
  // basic auth credentials
  auth: {
    enabled: false,
  },
  // logger file options
  logger: {
    use: false,
    filename: 'disabled-access.log',
    folder: 'example/server/dlogs',
    type: 'combined',
    options: {}
  }
}


before(function(done) {
  // runs before all tests in this block

  const NodeStaticAuth3 = require('../lib');

  let disabled = new NodeStaticAuth3(config, (svr) => {
    inst = svr;
    done();
  });
});


describe('static-auth server with logger and auth disabled', function() {


  it('should get home page', function(done) {

    request
      .get(`http://localhost:${config.server.ssl.httpListener}/?redirect-2-secured`)
      .ca(cert)
      .end(function(err, res) {
        assert(res.ok);
        done();
      });
  });

  it('should get custom 404 page', function(done) {

    request
      .get(`${config.server.ssl.enabled ? 'https://' : 'http://'}localhost:${config.server.port}/no-page-here`)
      .ca(cert)
      .end(function(err, res) {
        assert(res.status === 404);
        assert(res.text.includes(`<h1>404</h1>`));
        done();
      });
  });

});

after(function(done) {

  inst.close();
  done();
})
