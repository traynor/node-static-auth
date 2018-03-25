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


var NodeStatic = function () {
  function NodeStatic(inputConfig) {
    var cb = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

    _classCallCheck(this, NodeStatic);

    // overwrite default confs with input
    this.config = _utils2.default.mergeDeep(_defaultConfig2.default, inputConfig);
    //this.config = Object.assign(defaultConfig, inputConfig);

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
          key: _fs2.default.readFileSync(_path2.default.resolve(this.config.server.ssl.key)),
          cert: _fs2.default.readFileSync(_path2.default.resolve(this.config.server.ssl.cert))
        };
      } catch (err) {
        //throw new Error('HTTPS certificate error', err);
        this.sslOpts = null;
        console.error(err, 'HTTPS certificate error -> fallback to HTTP server');
      }
    }

    this.supportsHttp2 = _utils2.default.isHttp2Supported();

    if (this.config.server.customPages && this.config.server.http2 && this.supportsHttp2) {
      console.log('\x1b[41m', 'cannot use custom err pages with HTTP/2 -> fallback to built in', '\x1b[0m');
    }

    this.fileServer = new _nodeStatic2.default.Server(this.config.nodeStatic.root, this.config.nodeStatic.options);

    if (this.config.server.http2 && this.supportsHttp2) {

      this.createServer(this.supportsHttp2);
    } else {

      this.createServer();
    }
  }

  _createClass(NodeStatic, [{
    key: 'createServer',
    value: function createServer() {
      var _this = this;

      var http2 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;


      if (http2) {

        // todo: handle 'import' and 'export' may only appear at the top level
        var _http = require('http2');

        // need to bind `this` to listener method
        this.sslOpts ? this.server = _http.createSecureServer(this.sslOpts, this.listener.bind(this)) : this.server = _http.createServer(this.listener.bind(this));
      } else {

        // todo: handle 'import' and 'export' may only appear at the top level
        var https = require('https');

        this.sslOpts ? this.server = https.createServer(this.sslOpts, this.listener.bind(this)) : this.server = _http3.default.createServer(this.listener.bind(this));
      }

      this.server.listen(this.config.server.port, function () {
        console.log('Using Basic auth protection: ' + (_this.config.auth.enabled ? 'Yes' : 'No'));
        console.log('HTTP/2 supported?', _this.supportsHttp2 ? 'Yes' : 'No');
        console.log('Node-static-auth ' + (_this.config.server.http2 && _this.supportsHttp2 ? 'HTTP/2 ' : '') + (_this.sslOpts ? 'secure ' : 'unsecure ') + 'server running on port ' + _this.config.server.port);
        // return server instance for closing
        if (_this.cb) {
          _this.cb(_this.server);
        }
      });

      // create listener to redirect from http port 80 to https
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
  }, {
    key: 'listener',
    value: function listener(request, response) {
      var _this2 = this;

      // ignore favicon request earyl
      if (request.url === '/favicon.ico') {

        return false;
      }

      var hostHeader = this.config.server.http2 && this.supportsHttp2 ? request.headers[':authority'] : request.headers.host;

      var host = request.connection.encrypted ? 'https://' + hostHeader : 'http://' + hostHeader;

      // handle auth first
      if (this.config.auth.enabled) {

        var credentials = (0, _basicAuth2.default)(request);

        if (!credentials || credentials.name !== this.config.auth.name || credentials.pass !== this.config.auth.pass) {
          if (this.config.server.customPages && !this.config.server.http2) {
            _utils2.default.sendCustom(request, response, 401, this.config.server.customPages.forbidden, this.fileServer, this.logger ? this.logger.log.bind(this.logger) : '');
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

      // if custom pages, pass server and logger an break
      if (this.config.server.customPages && !this.config.server.http2) {

        this.fileServer.serve(request, response, function (err /*, result*/) {
          // handle custom pages, log and finish response there
          if (err) {

            if (err.status === 404) {

              _utils2.default.sendCustom(request, response, 404, _this2.config.server.customPages.notFound, _this2.fileServer, _this2.logger ? _this2.logger.log.bind(_this2.logger) : '');
            } else {

              _utils2.default.sendCustom(request, response, 500, _this2.config.server.customPages.error, _this2.fileServer, _this2.logger ? _this2.logger.log.bind(_this2.logger) : '');
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
