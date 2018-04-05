import Utils from './server/utils';
import assert from 'better-assert';
import fs from 'fs';
import nrc from 'node-run-cmd';
import request from 'superagent';


let config, inst, logg;

/**
 * custom error pages tests
 *
 */

// eslint-disable-next-line no-sync
const cert = fs.readFileSync(`${__dirname}/../example/server/localhost-test-cert.pem`);

config = {
  nodeStatic: {
    // all available node-static options https://www.npmjs.com/package/node-static: `new static.Server(root, options)`
    // use path relative to project root, i.e. process.cwd()
    root: 'example/public',
    customPages: {
      forbidden: 'forbidden.html',
      notFound: 'not-found.html',
      error: 'error.html'
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
}


before(function(done) {
  // runs before all tests in this block

  const NodeStaticAuth2 = require('../lib');

  // eslint-disable-next-line no-unused-vars
  let custom = new NodeStaticAuth2(config, (svr, log) => {
    inst = svr;
    // get logger instance to close stream
    logg = log;
    console.log('custom test svr running');
    done();
  });
});


// todo: read content
let forbidden = `<h1 style="color:red;">Forbidden</h1>`;
let notFound = `<h1>404</h1>`;

describe('static-auth server with custom pages', function() {

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

    let supportsHttp2 = Utils.isHttp2Supported();

    if (config.server.http2 && supportsHttp2) {
      // eslint-disable-next-line no-invalid-this
      this.skip();
    } else {
      request
        .get(`${config.server.ssl.enabled ? 'https://' : 'http://'}localhost:${config.server.port}/no-page-here`)
        .auth(config.auth.name, config.auth.pass, {
          type: 'auto'
        })
        .ca(cert)
        .end(function(err, res) {
          assert(res.status === 404);
          assert(res.text.includes(notFound));
          // eslint-disable-next-line no-unused-vars
          done();
        });
    }
  });
  it('should get custom 500 page', function(done) {

    // eslint-disable-next-line no-unused-vars
    this.skip();
  });
});


after(function(done) {

  // clean up logs folders
  // need to close fs.stream manually
  // due to fuse hidden file preventing on some linux dist
  logg.close(() => {
    //console.log('logg closed');
    inst.close(() => {
      //console.log('svr closed');
      const dataCallback = function(data) {
        //console.log('done deleting files', data)
        done();
      };
      nrc.run(`rm -rf ${config.logger.folder}`, {
        onDone: dataCallback,
        onError: dataCallback
        //onData: dataCallback,
      });
    });
  });
});
