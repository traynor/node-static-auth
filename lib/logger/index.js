'use strict';

var http = require('http');
var morgan = require('morgan');

var fs = require('fs');
var path = require('path');

var logger = function logger(config) {

	console.log('log conf:', config.logger.filename, path.dirname(process.mainModule.filename), path.resolve(config.logger.filename));

	// instead of: path.dirname(require.main.filename) or path.dirname(module.parent.parent.filename)
	var accessLogFile = path.normalize(path.resolve(config.logger.filename)); //path.join(path.dirname(process.mainModule.filename), config.logger.filename);

	// create a write stream (in append mode)
	var stream = fs.createWriteStream( /*config.logger.fileName ||*/accessLogFile, {
		'flags': 'a+',
		'encoding': 'utf8'
	});

	stream.on('error', function (err) {
		if (err.code === 'ENOENT') {
			console.log('log file path not found, make sure folder exists: ', err);
		} else {
			console.log('log file stream err', err);
		}
	});

	// create and return closure middleware
	return morgan('combined', {
		stream: stream
	});
};

module.exports = logger;
//# sourceMappingURL=index.js.map
