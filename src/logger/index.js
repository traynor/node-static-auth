import {
  createWriteStream
} from 'fs';
import morgan from 'morgan';
import path from 'path';

const Logger = class {

  constructor(config) {

    this.config = config;
    console.log('log file location:', path.resolve(this.config.logger.filename));

    this.accessLogFile = path.normalize(path.resolve(this.config.logger.filename));

    this.morgan = morgan;

    // create a write stream (in append mode)
    this.stream = createWriteStream(this.accessLogFile, {
      'flags': 'a+',
      'encoding': 'utf8'
    });

    this.stream.on('error', function(err) {

      if (err.code === 'ENOENT') {

        console.log('log file path not found, make sure folder exists: ', err);
      } else {

        console.log('log file stream err', err);
      }
    });

  }

  log(...args) {

    // create and return closure middleware
    return this.morgan('combined', {
      stream: this.stream
    })(...args);
  }
}

export default Logger;
