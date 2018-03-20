'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _sourceMapSupport2 = require('source-map-support');

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _fs = require('fs');

var _morgan = require('morgan');

var _morgan2 = _interopRequireDefault(_morgan);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _rotatingFileStream = require('rotating-file-stream');

var _rotatingFileStream2 = _interopRequireDefault(_rotatingFileStream);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

(0, _sourceMapSupport2.install)();


var Logger = function () {
  function Logger(config) {
    _classCallCheck(this, Logger);

    this.config = config;

    console.log('log file: type:', this.config.type, ' location:', _path2.default.resolve(this.config.folder));

    this.logDirectory = _path2.default.normalize(_path2.default.resolve(this.config.folder));

    // ensure log directory exists
    (0, _fs.existsSync)(this.logDirectory) || (0, _fs.mkdirSync)(this.logDirectory);

    if (this.config.logRotation.use) {

      this.rfs = _rotatingFileStream2.default;

      // create a rotating write stream
      this.stream = this.accessLogStream = this.rfs(this.config.filename, this.config.logRotation.options);
    } else {

      //this.accessLogFile = path.normalize(path.resolve(this.config.logger.filename));
      this.accessLogFile = _path2.default.join(this.logDirectory, this.config.filename);

      // create a write stream (in append mode)
      this.stream = (0, _fs.createWriteStream)(this.accessLogFile, {
        'flags': 'a+',
        'encoding': 'utf8'
      });
    }

    this.morgan = _morgan2.default;

    this.stream.on('error', function (err) {

      if (err.code === 'ENOENT') {

        console.log('log file path not found, make sure folder exists: ', err);
      } else {

        console.log('log file stream err', err);
      }
    });
  }

  _createClass(Logger, [{
    key: 'log',
    value: function log() {

      var opts = this.config.options;
      opts.stream = this.stream;
      // create and return closure middleware
      return this.morgan(this.config.type, opts).apply(undefined, arguments);
    }
  }]);

  return Logger;
}();

exports.default = Logger;
module.exports = exports['default'];
//# sourceMappingURL=index.js.map
