import Logger from '../logger';
import Utils from './utils';

import auth from 'basic-auth';
import defaultConfig from './default-config';
import fs from 'fs';
import http from 'http';
import nodeStatic from 'node-static';
import path from 'path';


/**
 * NodeStatic module
 *
 */
const NodeStatic = class {

  /**
   * init server instance
   * @param  {Object}   inputConfig
   * @param  {Function} cb for testing mostly
   */
  constructor(inputConfig, cb = null) {

    // validate input, we must have some config
    if (!inputConfig || !Object.keys(inputConfig).length) {
      //this.config = defaultConfig;
      throw new Error('Config is mandatory');
    } else {
      // check if credentials are not set right
      if (inputConfig.auth) {

        if (inputConfig.auth.enabled && (!inputConfig.auth.name || !inputConfig.auth.pass)) {
          throw new Error('Basic auth not configured correctly');
        }
      }
      // overwrite default confs with input
      this.config = Utils.mergeDeep(defaultConfig, inputConfig);
    }

    this.cb = cb;

    if (this.config.logger.use) {
      this.logger = new Logger(this.config.logger);
    } else {
      console.log('Not using log file');
    }

    this.sslOpts = null;

    if (this.config.server.ssl.enabled) {

      try {
        this.sslOpts = {
          // eslint-disable-next-line no-sync
          key: fs.readFileSync(path.resolve(this.config.server.ssl.key)),
          // eslint-disable-next-line no-sync
          cert: fs.readFileSync(path.resolve(this.config.server.ssl.cert))
        };
      } catch (err) {
        throw new Error(`HTTPS certificate error:\n${err}`);
        //console.error(err, 'HTTPS certificate error -> fallback to HTTP server');
        //this.sslOpts = null;
      }
    }

    this.supportsHttp2 = Utils.isHttp2Supported();

    // warn if http2 is set, but not supported
    if (this.config.server.http2 && !this.supportsHttp2) {
      console.log('\x1b[41m', 'You have no support for http/2, install Node.js version that supports HTTP/2 to use it', '\x1b[0m');
      this.config.server.http2 = false;
    }

    // warn about no support
    if (this.config.nodeStatic.customPages && this.config.server.http2 && this.supportsHttp2) {
      console.log('\x1b[41m', 'cannot use custom err pages with HTTP/2 -> fallback to built in', '\x1b[0m');
    }

    // start `node-static` and light up server
    this.fileServer = new nodeStatic.Server(this.config.nodeStatic.root, this.config.nodeStatic.options);

    if (this.config.server.http2 && this.supportsHttp2) {

      this.createServer(this.supportsHttp2);

    } else {

      this.createServer();
    }

  }

  /**
   * method that starts up server
   * @param  {Boolean} http2 triggers h2 usage
   */
  createServer(http2 = false) {

    if (http2) {

      // todo: handle 'import' and 'export' may only appear at the top level
      const http2 = require('http2');

      // need to bind `this` to listener method for preserving scope
      // eslint-disable-next-line no-unused-expressions
      this.sslOpts ? this.server = http2.createSecureServer(this.sslOpts, this.listener.bind(this)) : this.server = http2.createServer(this.listener.bind(this));
    } else {

      // todo: handle 'import' and 'export' may only appear at the top level
      const https = require('https');

      // need to bind `this` to listener method for preserving scope
      // eslint-disable-next-line no-unused-expressions
      this.sslOpts ? this.server = https.createServer(this.sslOpts, this.listener.bind(this)) : this.server = http.createServer(this.listener.bind(this));
    }

    // init server
    this.server.listen(this.config.server.port, () => {
      console.log(`Using Basic auth protection: ${this.config.auth.enabled ? 'Yes' : 'No'}`);
      console.log('HTTP/2 supported?', this.supportsHttp2 ? 'Yes' : 'No');
      console.log(`Node-static-auth ${this.config.server.http2 && this.supportsHttp2 ? 'HTTP/2 ' : ''}${this.sslOpts ? 'secure ' : 'unsecure '}server running on port ${this.config.server.port}`);
      // return server instance for closing for testing
      if (this.cb) {
        this.cb(this.server, this.logger ? this.logger : null);
      }
    });

    // create listener to redirect from http to https
    if (this.sslOpts) {

      http.createServer((request, response) => {

        if (this.logger) {
          this.logger.log(request, response, () => {
            //console.log('http listener redirecting', this.sslOpts && !(/https/).test(request.protocol), request.url, request.headers.host);
            Utils.redirect(response, request.headers, this.config.server.port, request.url);
          });
        } else {
          Utils.redirect(response, request.headers, this.config.server.port, request.url);
        }
      }).listen(this.config.server.ssl.httpListener);
    }
  }

  /**
   * method that coordinates request/responses between modules
   * @param  {Object} request
   * @param  {Object} response
   */
  listener(request, response) {

    // ignore favicon request early
    if (request.url === '/favicon.ico') {

      return false;
    }

    const hostHeader = this.config.server.http2 && this.supportsHttp2 ? request.headers[':authority'] : request.headers.host;

    const host = request.connection.encrypted ? `https://${hostHeader}` : `http://${hostHeader}`;


    // handle auth first
    if (this.config.auth.enabled) {

      const credentials = auth(request);

      // check all svr-logger-custom combinations...
      if (!credentials || credentials.name !== this.config.auth.name || credentials.pass !== this.config.auth.pass) {
        if (this.config.nodeStatic.customPages && this.config.nodeStatic.customPages.forbidden && !this.config.server.http2) {
          Utils.sendCustom(request, response, 401, this.config.nodeStatic.customPages.forbidden, this.fileServer, this.logger ? this.logger.log.bind(this.logger) : '', this.config.auth.realm);
        } else {
          if (this.logger) {
            this.logger.log(request, response, () => {
              Utils.sendForbidden(response, this.config.auth.realm);
            });
          } else {
            Utils.sendForbidden(response, this.config.auth.realm);
          }
        }
        return;
      }
    }

    // if custom pages, data and logger
    // check which custom page is set later
    if (this.config.nodeStatic.customPages && !this.config.server.http2) {

      this.fileServer.serve(request, response, (err /*, result*/ ) => {

        // handle custom pages, log and finish response there
        if (err) {

          if (err.status === 404) {

            // check if custom err page, else use default
            if (this.config.nodeStatic.customPages.notFound) {
              Utils.sendCustom(request, response, 404, this.config.nodeStatic.customPages.notFound, this.fileServer, this.logger ? this.logger.log.bind(this.logger) : '');
            } else {
              if (this.logger) {
                this.logger.log(request, response, () => {
                  Utils.sendNotFound(response, err, host, request.url);
                });
              } else {
                Utils.sendNotFound(response, err, host, request.url);
              }
            }

          } else {

            if (this.config.nodeStatic.customPages.error) {

              Utils.sendCustom(request, response, 500, this.config.nodeStatic.customPages.error, this.fileServer, this.logger ? this.logger.log.bind(this.logger) : '');
            } else {
              if (this.logger) {
                this.logger.log(request, response, () => {
                  Utils.sendError(response, err, request.url);
                });
              } else {
                Utils.sendError(response, err, request.url);
              }
            }
          }

        } else {
          if (this.logger) {
            // log everything else, finish response
            this.logger.log(request, response, () => {});
          }
        }
      });

    } else {

      // handle serving and logging
      request.addListener('end', () => {

        this.fileServer.serve(request, response, (err /*, result*/ ) => {

          if (this.logger) {
            this.logger.log(request, response, () => {
              // There was an error serving the file
              if (err) {

                if (err.status === 404) {

                  //console.error("Page not found " + request.url + " - " + err.message, host, response.headers);
                  Utils.sendNotFound(response, err, host, request.url);

                } else {

                  //console.error("Error serving " + request.url + " - " + err.message);
                  Utils.sendError(response, err, request.url);
                }
              }
            });
          } else {
            if (err) {

              if (err.status === 404) {

                //console.error("Page not found " + request.url + " - " + err.message, host, response.headers);
                Utils.sendNotFound(response, err, host, request.url);

              } else {

                //console.error("Error serving " + request.url + " - " + err.message);
                Utils.sendError(response, err, request.url);
              }
            }
          }

        });

      }).resume();
    }
  }
}

export default NodeStatic;
