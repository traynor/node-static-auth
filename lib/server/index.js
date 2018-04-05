'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _sourceMapSupport2 = require('source-map-support');

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _logger = require('../logger');

var _logger2 = _interopRequireDefault(_logger);

var _utils = require('./utils');

var _utils2 = _interopRequireDefault(_utils);

var _basicAuth = require('basic-auth');

var _basicAuth2 = _interopRequireDefault(_basicAuth);

var _defaultConfig = require('./default-config');

var _defaultConfig2 = _interopRequireDefault(_defaultConfig);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _http2 = require('http');

var _http3 = _interopRequireDefault(_http2);

var _nodeStatic = require('node-static');

var _nodeStatic2 = _interopRequireDefault(_nodeStatic);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

(0, _sourceMapSupport2.install)();


/**
 * NodeStatic module
 *
 */
var NodeStatic = function () {

  /**
   * init server instance
   * @param  {Object}   inputConfig
   * @param  {Function} cb for testing mostly
   */
  function NodeStatic(inputConfig) {
    var cb = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

    _classCallCheck(this, NodeStatic);

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
      this.config = _utils2.default.mergeDeep(_defaultConfig2.default, inputConfig);
    }

    this.cb = cb;

    if (this.config.logger.use) {
      this.logger = new _logger2.default(this.config.logger);
    } else {
      console.log('Not using log file');
    }

    this.sslOpts = null;

    if (this.config.server.ssl.enabled) {

      try {
        this.sslOpts = {
          // eslint-disable-next-line no-sync
          key: _fs2.default.readFileSync(_path2.default.resolve(this.config.server.ssl.key)),
          // eslint-disable-next-line no-sync
          cert: _fs2.default.readFileSync(_path2.default.resolve(this.config.server.ssl.cert))
        };
      } catch (err) {
        throw new Error('HTTPS certificate error:\n' + err);
        //console.error(err, 'HTTPS certificate error -> fallback to HTTP server');
        //this.sslOpts = null;
      }
    }

    this.supportsHttp2 = _utils2.default.isHttp2Supported();

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
    this.fileServer = new _nodeStatic2.default.Server(this.config.nodeStatic.root, this.config.nodeStatic.options);

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


  _createClass(NodeStatic, [{
    key: 'createServer',
    value: function createServer() {
      var _this = this;

      var http2 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;


      if (http2) {

        // todo: handle 'import' and 'export' may only appear at the top level
        var _http = require('http2');

        // need to bind `this` to listener method for preserving scope
        // eslint-disable-next-line no-unused-expressions
        this.sslOpts ? this.server = _http.createSecureServer(this.sslOpts, this.listener.bind(this)) : this.server = _http.createServer(this.listener.bind(this));
      } else {

        // todo: handle 'import' and 'export' may only appear at the top level
        var https = require('https');

        // need to bind `this` to listener method for preserving scope
        // eslint-disable-next-line no-unused-expressions
        this.sslOpts ? this.server = https.createServer(this.sslOpts, this.listener.bind(this)) : this.server = _http3.default.createServer(this.listener.bind(this));
      }

      // init server
      this.server.listen(this.config.server.port, function () {
        console.log('Using Basic auth protection: ' + (_this.config.auth.enabled ? 'Yes' : 'No'));
        console.log('HTTP/2 supported?', _this.supportsHttp2 ? 'Yes' : 'No');
        console.log('Node-static-auth ' + (_this.config.server.http2 && _this.supportsHttp2 ? 'HTTP/2 ' : '') + (_this.sslOpts ? 'secure ' : 'unsecure ') + 'server running on port ' + _this.config.server.port);
        // return server instance for closing for testing
        if (_this.cb) {
          _this.cb(_this.server, _this.logger ? _this.logger : null);
        }
      });

      // create listener to redirect from http to https
      if (this.sslOpts) {

        _http3.default.createServer(function (request, response) {

          if (_this.logger) {
            _this.logger.log(request, response, function () {
              //console.log('http listener redirecting', this.sslOpts && !(/https/).test(request.protocol), request.url, request.headers.host);
              _utils2.default.redirect(response, request.headers, _this.config.server.port, request.url);
            });
          } else {
            _utils2.default.redirect(response, request.headers, _this.config.server.port, request.url);
          }
        }).listen(this.config.server.ssl.httpListener);
      }
    }

    /**
     * method that coordinates request/responses between modules
     * @param  {Object} request
     * @param  {Object} response
     */

  }, {
    key: 'listener',
    value: function listener(request, response) {
      var _this2 = this;

      // ignore favicon request early
      if (request.url === '/favicon.ico') {

        return false;
      }

      var hostHeader = this.config.server.http2 && this.supportsHttp2 ? request.headers[':authority'] : request.headers.host;

      var host = request.connection.encrypted ? 'https://' + hostHeader : 'http://' + hostHeader;

      // handle auth first
      if (this.config.auth.enabled) {

        var credentials = (0, _basicAuth2.default)(request);

        // check all svr-logger-custom combinations...
        if (!credentials || credentials.name !== this.config.auth.name || credentials.pass !== this.config.auth.pass) {
          if (this.config.nodeStatic.customPages && this.config.nodeStatic.customPages.forbidden && !this.config.server.http2) {
            _utils2.default.sendCustom(request, response, 401, this.config.nodeStatic.customPages.forbidden, this.fileServer, this.logger ? this.logger.log.bind(this.logger) : '', this.config.auth.realm);
          } else {
            if (this.logger) {
              this.logger.log(request, response, function () {
                _utils2.default.sendForbidden(response, _this2.config.auth.realm);
              });
            } else {
              _utils2.default.sendForbidden(response, this.config.auth.realm);
            }
          }
          return;
        }
      }

      // if custom pages, data and logger
      // check which custom page is set later
      if (this.config.nodeStatic.customPages && !this.config.server.http2) {

        this.fileServer.serve(request, response, function (err /*, result*/) {

          // handle custom pages, log and finish response there
          if (err) {

            if (err.status === 404) {

              // check if custom err page, else use default
              if (_this2.config.nodeStatic.customPages.notFound) {
                _utils2.default.sendCustom(request, response, 404, _this2.config.nodeStatic.customPages.notFound, _this2.fileServer, _this2.logger ? _this2.logger.log.bind(_this2.logger) : '');
              } else {
                _this2.logger.log(request, response, function () {
                  _utils2.default.sendNotFound(response, err, host, request.url);
                });
              }
            } else {

              if (_this2.config.nodeStatic.customPages.error) {

                _utils2.default.sendCustom(request, response, 500, _this2.config.nodeStatic.customPages.error, _this2.fileServer, _this2.logger ? _this2.logger.log.bind(_this2.logger) : '');
              } else {
                _this2.logger.log(request, response, function () {
                  _utils2.default.sendError(response, err, request.url);
                });
              }
            }
          } else {
            if (_this2.logger) {
              // log everything else, finish response
              _this2.logger.log(request, response, function () {});
            }
          }
        });
      } else {

        // handle serving and logging
        request.addListener('end', function () {

          _this2.fileServer.serve(request, response, function (err /*, result*/) {

            if (_this2.logger) {
              _this2.logger.log(request, response, function () {
                // There was an error serving the file
                if (err) {

                  if (err.status === 404) {

                    //console.error("Page not found " + request.url + " - " + err.message, host, response.headers);
                    _utils2.default.sendNotFound(response, err, host, request.url);
                  } else {

                    //console.error("Error serving " + request.url + " - " + err.message);
                    _utils2.default.sendError(response, err, request.url);
                  }
                }
              });
            } else {
              if (err) {

                if (err.status === 404) {

                  //console.error("Page not found " + request.url + " - " + err.message, host, response.headers);
                  _utils2.default.sendNotFound(response, err, host, request.url);
                } else {

                  //console.error("Error serving " + request.url + " - " + err.message);
                  _utils2.default.sendError(response, err, request.url);
                }
              }
            }
          });
        }).resume();
      }
    }
  }]);

  return NodeStatic;
}();

exports.default = NodeStatic;
module.exports = exports['default'];
//# sourceMappingURL=index.js.map
