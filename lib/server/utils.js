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
 * server helper
 */
var Utils = function () {
  function Utils() {
    _classCallCheck(this, Utils);
  }

  _createClass(Utils, null, [{
    key: 'isHttp2Supported',
    value: function isHttp2Supported() {
      var supported = parseInt(process.versions.node.split('.')[0], 10) >= 9;
      return supported;
    }
  }, {
    key: 'redirect',
    value: function redirect(response, headers, port, url) {
      var host = headers.host.split(':')[0];
      response.writeHead(301, {
        "Location": 'https://' + host + ':' + port + url
      });
      response.end();
    }
  }, {
    key: 'sendForbidden',
    value: function sendForbidden(response, realm) {
      var head = {
        'WWW-Authenticate': 'Basic realm="Protected"' || 'Basic realm="' + realm + '"'
      };
      response.writeHead(401, head);
      response.end('Access denied');
    }
  }, {
    key: 'sendNotFound',
    value: function sendNotFound(response, err, host, url) {
      // Respond to the client
      response.writeHead(err.status, err.headers);

      //logger.log(null, request.connection.remoteAddress, "(credentials && credentials.name ? credentials.name : '-')", request.method, request.url, response.statusCode, response.socket._bytesDispatched/*response.headers['content-length']*/, request.headers['user-agent']);

      // todo: handle ie not serving small 404 pages
      // https://stackoverflow.com/questions/3970093/include-after-php-404-header-returning-oops-this-link-appears-to-be-broken
      response.end('<html><body align="center"><br>' + err.status + ' Not Found<br><p>Page <b>' + host + url + '</b> was not found on this server</p><p><a href="/">Home</a></p></body></html>');
    }
  }, {
    key: 'sendError',
    value: function sendError(response, err, url) {
      // Respond to the client
      response.writeHead(err.status, err.headers);
      //logger.log();
      response.end('<html><body align="center"><br>' + err.status + '<br><p>Error serving: "<b>' + url + '</b>"</p><p>' + err.message + '<p><a href="/">Home</a></p></body></html>');
    }
  }, {
    key: 'sendCustom',
    value: function sendCustom(request, response, type, file, fileServer, log) {

      var headers = {};
      if (type === 401) {
        headers = {
          'WWW-Authenticate': 'Basic realm="Protected"' || 'Basic realm="' + realm + '"'
        };
      }

      fileServer.serveFile(file, type, headers, request, response);

      request.addListener('end', function () {

        log(request, response, function () {
          /*console.log('logger logged');*/
        });
      });
    }
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
