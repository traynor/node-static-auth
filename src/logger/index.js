import {
  createWriteStream,
  existsSync,
  mkdirSync
} from 'fs';
import morgan from 'morgan';
import path from 'path';
import rfs from 'rotating-file-stream';


const Logger = class {

  constructor(config) {

    this.config = config;

    console.log('log file: type:', this.config.type, ' location:', path.resolve(this.config.folder));

    this.logDirectory = path.normalize(path.resolve(this.config.folder));

    // ensure log directory exists
    existsSync(this.logDirectory) || mkdirSync(this.logDirectory)

    if (this.config.logRotation.use) {

      this.rfs = rfs;

      // create a rotating write stream
      this.stream = this.accessLogStream = this.rfs(this.config.filename, this.config.logRotation.options);

    } else {

      //this.accessLogFile = path.normalize(path.resolve(this.config.logger.filename));
      this.accessLogFile = path.join(this.logDirectory, this.config.filename);

      // create a write stream (in append mode)
      this.stream = createWriteStream(this.accessLogFile, {
        'flags': 'a+',
        'encoding': 'utf8'
      });
    }

    this.morgan = morgan;


    this.stream.on('error', function(err) {

      if (err.code === 'ENOENT') {

        console.log('log file path not found, make sure folder exists: ', err);
      } else {

        console.log('log file stream err', err);
      }
    });

  }

  log(...args) {

    let opts = this.config.options;
    opts.stream = this.stream;
    // create and return closure middleware
    return this.morgan(this.config.type, opts)(...args);
  }
}

export default Logger;
