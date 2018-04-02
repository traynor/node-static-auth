import assert from 'better-assert';
import fs from 'fs';
import nrc from 'node-run-cmd';
import request from 'superagent';
import Utils from './server/utils';

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
}

// skip if no http2 support
if (!Utils.isHttp2Supported()) {
  describe('static-auth server', function() {
    it.skip('no http2 support, skip http/2 tests');
  });

} else {

  // load http2 here
  const http2 = require('http2');

  before(function(done) {
    // runs before all tests in this block

    const NodeStaticAuth = require('../lib');

    let nodeStaticAuth = new NodeStaticAuth(config, (svr) => {
      inst = svr;
      console.log('http2 svr running');
      done();
    });
  });

  let logs = [];

  const auth = 'Basic ' + Buffer.from(config.auth.name + ':' + config.auth.pass).toString('base64');

  const homePage = '<h1 class="red">RED-5 standing by</h1>';

  describe('http/2 static-auth server', function() {

    it('should login via Basic auth and access server', function(done) {

      const headers = {
        'Authorization': auth,
        ':path': '/?http2-login'
      };
      let status = false;

      const client = http2.connect(`${config.server.ssl.enabled ? 'https://' : 'http://'}localhost:${config.server.port}`, {
        ca: cert
      });
      client.on('error', (err) => console.error(err));

      const req = client.request(headers);

      req.on('response', (headers, flags) => {

        status = headers[':status'];
      });

      req.setEncoding('utf8');
      let data = '';
      req.on('data', (chunk) => {
        data += chunk;
      });
      req.on('end', () => {
        assert(status === 200);
        assert(data.includes(homePage));
        client.close();
        logs.push('/?http2-login');
        done();
      });
      req.end();
    });

    it('should get other static files', function(done) {

      const headers = {
        'Authorization': auth,
        ':path': '/css.css'
      };
      let status = false;

      const client = http2.connect(`${config.server.ssl.enabled ? 'https://' : 'http://'}localhost:${config.server.port}`, {
        ca: cert
      });
      client.on('error', (err) => console.error(err));

      const req = client.request(headers);

      req.on('response', (headers, flags) => {

        status = headers[':status'];
      });

      req.setEncoding('utf8');
      let data = '';
      req.on('data', (chunk) => {
        data += chunk;
      });
      req.on('end', () => {
        assert(status === 200);
        client.close();
        logs.push('/css.css');
        done();
      });
      req.end();
    });

    it('should get 404', function(done) {

      const headers = {
        'Authorization': auth,
        ':path': '/no-such-page'
      };
      let status = false;

      const client = http2.connect(`${config.server.ssl.enabled ? 'https://' : 'http://'}localhost:${config.server.port}`, {
        ca: cert
      });
      client.on('error', (err) => console.error(err));

      const req = client.request(headers);

      req.on('response', (headers, flags) => {

        status = headers[':status'];
      });

      req.setEncoding('utf8');
      let data = '';
      req.on('data', (chunk) => {
        data += chunk;
      });
      req.on('end', () => {
        assert(status === 404);
        client.close();
        logs.push('/no-such-page');
        done();
      });
      req.end();
    });
    it('should not allow access if Basic auth is required', function(done) {
      const bogusAuth = 'Basic ' + Buffer.from('hack:hack').toString('base64');
      const headers = {
        'Authorization': bogusAuth,
        ':path': '/?forbidden'
      };
      let status = false;

      const client = http2.connect(`${config.server.ssl.enabled ? 'https://' : 'http://'}localhost:${config.server.port}`, {
        ca: cert
      });
      client.on('error', (err) => console.error(err));

      const req = client.request(headers);

      req.on('response', (headers, flags) => {

        status = headers[':status'];
      });

      req.setEncoding('utf8');
      let data = '';
      req.on('data', (chunk) => {
        data += chunk;
      });
      req.on('end', () => {
        assert(status === 401);
        client.close();
        logs.push('/?forbidden');
        done();
      });
      req.end();
    });
    it('should have access logged to a file', function(done) {

      if (config.logger.use) {
        try {
          fs.readFile(__dirname + '/../' + config.logger.folder + '/' + config.logger.filename, 'utf8', (err, data) => {
            if (err) {
              throw new Error(err);
            } else {
              let passing = false;
              logs.forEach(log => {
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
            throw new Error(`File not found, location not valid: ${err}`);
          } else {
            throw new Error(err);
          }
        }
      }
    });


  });

  after(function(done) {

    const dataCallback = function() {
      done();
    };
    nrc.run('rm -rf ' + config.logger.folder, {
      onDone: dataCallback
    });
    inst.close();
  })
}
