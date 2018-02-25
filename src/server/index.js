import Logger from '../logger';
import Utils from './utils';

import auth from 'basic-auth';
import defaultConfig from './default-config';
import fs from 'fs';
import http from 'http';
import nodeStatic from 'node-static';
import path from 'path';


const NodeStatic = class {

  constructor(inputConfig, cb = null) {

    // overwrite default confs with input
    this.config = Object.assign(defaultConfig, inputConfig);
    this.cb = cb;
    this.logger = new Logger(this.config);


    this.sslOpts = null;

    if (this.config.server.ssl.enabled) {

      try {
        this.sslOpts = {
          key: fs.readFileSync(path.resolve(this.config.server.ssl.key)),
          cert: fs.readFileSync(path.resolve(this.config.server.ssl.cert))
        };
      } catch (err) {
        //throw new Error('HTTPS certificate error', err);
        this.sslOpts = null;
        console.error(err, 'HTTPS certificate error -> fallback to http server');
      }

    }

    this.fileServer = new nodeStatic.Server(this.config.nodeStatic.root);

    this.supportsHttp2 = Utils.isHttp2Supported();

    if (this.config.server.http2 && this.supportsHttp2) {

      this.createServer(this.supportsHttp2);

    } else {

      this.createServer();
    }

  }

  createServer(http2 = false) {

    if (http2) {

      // todo: handle 'import' and 'export' may only appear at the top level
      const http2 = require('http2');

      // need to bind `this` to listener method
      this.sslOpts ? this.server = http2.createSecureServer(this.sslOpts, this.listener.bind(this)) : this.server = http2.createServer(this.listener.bind(this));
    } else {

      // todo: handle 'import' and 'export' may only appear at the top level
      const https = require('https');

      this.sslOpts ? this.server = https.createServer(this.sslOpts, this.listener.bind(this)) : this.server = http.createServer(this.listener.bind(this));
    }


    this.server.listen(this.config.server.port, () => {

      console.log(`Node-static-auth ${this.supportsHttp2 ? 'HTTP/2 ' : ''}${this.sslOpts ? 'secure ' : 'unsecure '}server running on port ${this.config.server.port}`);
      // return server instance for closing
      if (this.cb) this.cb(this.server);
    });

    // create listener to redirect from http port 80 to https
    if (this.sslOpts) {

      http.createServer((request, response) => {

        this.logger.log(request, response, (next) => {
          console.log('http listener redirecting', this.sslOpts && !(/https/).test(request.protocol), request.url, request.headers.host)
          Utils.redirect(response, request.headers, this.config.server.port, request.url);
        });
      }).listen(this.config.server.ssl.httpListener);
    }
  }

  listener(request, response) {


    const hostHeader = this.supportsHttp2 ? request.headers[':authority'] : request.headers.host;

    const host = request.connection.encrypted ? `https://${hostHeader}` : `http://${hostHeader}`;

    this.logger.log(request, response, (next) => {

      if (this.config.auth.enabled) {

        const credentials = auth(request);

        if (!credentials || credentials.name !== this.config.auth.name && credentials.pass !== this.config.auth.pass) {

          Utils.sendForbidden(response, this.config.auth.realm);
          return;
        }
      }

      request.addListener('end', () => {

        this.fileServer.serve(request, response, function(err, result) {

          // There was an error serving the file
          if (err) {
            // ignore favicon request
            if (request.url === '/favicon.ico') {

              return;
            }
            if (err.status === 404) {

              console.error("Page not found " + request.url + " - " + err.message, host, response.headers);
              Utils.sendNotFound(response, err, host, request.url);

            } else {

              console.error("Error serving " + request.url + " - " + err.message);
              Utils.sendError(response, err, request.url);
            }
          }
        });
      }).resume();

    });
  }
}

export default NodeStatic;
