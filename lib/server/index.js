'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _nodeStatic = require('node-static');

var _nodeStatic2 = _interopRequireDefault(_nodeStatic);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

//var nodeStatic = require('node-static');
var fs = require('fs');
var auth = require('basic-auth');
var path = require('path');

var http = require('http');
var https = require('https');

var log = require('../logger');

var server = void 0;

var NodeStatic = function NodeStatic(config) {
  var cb = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;


  var logger = log(config);

  var sslOpts = null;

  if (config.server.ssl.enabled) {
    //server = https;
    try {
      sslOpts = {
        // get parent directory relative to the script calling this module
        //key: fs.readFileSync(path.join(path.dirname(module.parent.filename), config.server.ssl.key)),
        //cert: fs.readFileSync(path.join(path.dirname(module.parent.filename), config.server.ssl.cert))
        key: fs.readFileSync(path.resolve(config.server.ssl.key)),
        cert: fs.readFileSync(path.resolve(config.server.ssl.cert))
      };
    } catch (err) {
      //throw new Error('HTTPS certificate error', err);
      sslOpts = null;
      console.error(err, 'HTTPS certificate error -> fallback to http server');
      console.log('>>>>>>>>>>> path relative to caller module', module.parent.filename, config.server.ssl.key, path.join(path.dirname(module.parent.filename), path.resolve(config.server.ssl.key), process.cwd()));
      //server = http;
    }
  } else {
      //server = http;
    }

  var fileServer = new _nodeStatic2.default.Server(config.nodeStatic.root);

  function listener(request, response) {

    var host = request.connection.encrypted ? 'https://' + request.headers.host : 'http://' + request.headers.host;

    // todo: fix favicon
    /*
     "GET /favicon.ico HTTP/1.1" 404
     */

    logger(request, response, function (err) {

      var credentials = auth(request);

      if (!credentials || credentials.name !== config.auth.name || credentials.password !== config.auth.password) {
        var head = {
          'WWW-Authenticate': 'Basic realm="Protected"' || 'Basic realm="' + config.auth.realm + '"'
        };
        response.writeHead(401, head);
        response.end('Access denied');
        return;
      }

      request.addListener('end', function () {

        fileServer.serve(request, response, function (err, result) {

          console.log('static res', err, result);

          // There was an error serving the file
          if (err) {

            if (err.status === 404) {

              console.error("Page not found " + request.url + " - " + err.message, request.headers.host, response.headers);

              // Respond to the client
              response.writeHead(err.status, err.headers);

              //logger.log(null, request.connection.remoteAddress, "(credentials && credentials.name ? credentials.name : '-')", request.method, request.url, response.statusCode, response.socket._bytesDispatched/*response.headers['content-length']*/, request.headers['user-agent']);

              response.end('<html><body align="center"><br>' + err.status + ' Not Found<br><p>Page <b>' + host + request.url + '</b> was not found on this server</p><p><a href="/">Home</a></p></body></html>');
            } else {
              console.error("Error serving " + request.url + " - " + err.message);

              // Respond to the client
              response.writeHead(err.status, err.headers);
              //logger.log();
              response.end('<html><body align="center"><br>' + err.status + '<br><p>Error serving: "<b>' + request.url + '</b>"</p><p>' + err.message + '<p><a href="/">Home</a></p></body></html>');
            }
          } else {
            //logger.log();
          }
        });
      }).resume();
    });
  }
  //let svr;
  sslOpts ? server = https.createServer(sslOpts, listener) : server = http.createServer(listener);

  server.listen(config.server.port || 3001, function () {
    console.log('Node-static-auth server running on port', config.server.port || 3001);if (cb) cb(server);
  });

  if (sslOpts) {

    // Redirect from http port 80 to https
    http.createServer(function (req, res) {
      logger(req, res, function (err) {
        console.log('redr>>>>>>', sslOpts && !/https/.test(req.protocol), req.url, req.headers.host);
        var host = req.headers['host'].split(':')[0];
        res.writeHead(301, {
          "Location": 'https://' + host + ':' + config.server.port + req.url
        });
        res.end();
      });
    }).listen(config.server.ssl.httpListener || 3000);
  }
};

exports.default = NodeStatic;
module.exports = exports['default'];
//# sourceMappingURL=index.js.map
