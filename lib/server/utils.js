'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _sourceMapSupport2 = require('source-map-support');

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _deepmerge = require('deepmerge');

var _deepmerge2 = _interopRequireDefault(_deepmerge);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

(0, _sourceMapSupport2.install)();


/**
 * Helper service
 *
 */
var Utils = function () {
  function Utils() {
    _classCallCheck(this, Utils);
  }

  _createClass(Utils, null, [{
    key: 'isHttp2Supported',


    /**
     * check for http2 support
     *
     * @return {Boolean}
     */
    value: function isHttp2Supported() {
      var supported = parseInt(process.versions.node.split('.')[0], 10) >= 9;
      return supported;
    }

    /**
     * redirect to https method
     */

  }, {
    key: 'redirect',
    value: function redirect(response, headers, port, url) {
      var host = headers.host.split(':')[0];
      response.writeHead(301, {
        "Location": 'https://' + host + ':' + port + url
      });
      response.end();
    }

    /**
     * send 401 response/page
     *
     * @param  {Object} response
     * @param  {String} realm
     */

  }, {
    key: 'sendForbidden',
    value: function sendForbidden(response, realm) {
      var head = {
        'WWW-Authenticate': 'Basic realm="Protected"' || 'Basic realm="' + realm + '"'
      };
      response.writeHead(401, head);
      response.end('Access denied');
    }

    /**
     * send 404 response/page
     *
     * @param  {Object} response
     * @param  {Object} err
     * @param  {String} host
     * @param  {String} url
     */

  }, {
    key: 'sendNotFound',
    value: function sendNotFound(response, err, host, url) {
      // Respond to the client
      response.writeHead(err.status, err.headers);

      //logger.log(null, request.connection.remoteAddress, "(credentials && credentials.name ? credentials.name : '-')", request.method, request.url, response.statusCode, response.socket._bytesDispatched/*response.headers['content-length']*/, request.headers['user-agent']);

      response.end('<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="text-align:center;"><br>' + err.status + ' Not Found<br><p>Page <b>' + host + url + '</b> was not found on this server</p><p><a href="/">Home</a></p></body></html>');
    }

    /**
     * send 500 response/page
     *
     * @param  {Object} response
     * @param  {Object} err
     * @param  {String} url
     */

  }, {
    key: 'sendError',
    value: function sendError(response, err, url) {
      // Respond to the client
      response.writeHead(err.status, err.headers);

      response.end('<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="text-align:center;"><br>' + err.status + '<br><p>Error serving: "<b>' + url + '</b>"</p><p>' + err.message + '<p><a href="/">Home</a></p></body></html>');
    }

    /**
     * sending custom error pages method
     *
     * @param  {Object} request
     * @param  {Object} response
     * @param  {String} type
     * @param  {String} file
     * @param  {Object} fileServer
     * @param  {Function} log logger service instance, to manually log here
     */

  }, {
    key: 'sendCustom',
    value: function sendCustom(request, response, type, file, fileServer, log, realm) {

      var headers = {};
      if (type === 401) {
        headers = {
          'WWW-Authenticate': 'Basic realm="' + realm + '"' || 'Basic realm="Protected"'
        };
      }

      fileServer.serveFile(file, type, headers, request, response);

      request.addListener('end', function () {

        if (log) {
          log(request, response, function () {
            /*console.log('logger logged');*/
          });
        }
      });
    }

    /**
     * merge object helper method
     *
     * @param  {Object} target
     * @param  {Object} source
     * @return {Object} deep merged/overwritten target
     */

  }, {
    key: 'mergeDeep',
    value: function mergeDeep(target, source) {

      return (0, _deepmerge2.default)(target, source);
    }
  }]);

  return Utils;
}();

exports.default = Utils;
module.exports = exports['default'];
//# sourceMappingURL=utils.js.map
