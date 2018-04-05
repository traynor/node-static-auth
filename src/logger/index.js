import {
  createWriteStream,
  existsSync,
  mkdirSync
} from 'fs';
import morgan from 'morgan';
import path from 'path';
import rfs from 'rotating-file-stream';


/**
 * Logger service
 *
 */
const Logger = class {

  /**
   * init logger and file stream
   * @param  {Object} config paramas to create instance
   */
  constructor(config) {

    this.config = config;

    console.log(`Using log file: log type: '${this.config.type}', location:, '${path.resolve(this.config.folder, this.config.filename)}'`);

    this.logDirectory = path.normalize(path.resolve(this.config.folder));

    // ensure log directory exists
    let checkDir = existsSync(this.logDirectory) || mkdirSync(this.logDirectory)

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

      throw new Error(`Error creating log file: ${err}`);
    });
  }

  /**
   * log method that writes to a file
   * @param  {...[Object]} args middleware fn
   * @return {Function} middleware fn
   */
  log(...args) {

    let opts = this.config.options;
    // overwrite to make sure we always use
    // this stream, not some from opts
    opts.stream = this.stream;
    // create and return middleware
    return this.morgan(this.config.type, opts)(...args);
  }

  /**
   * method for closing stream, for testing mostly (due to fuse hidden blocking on some Linux)
   * @param  {Function} cb
   * @return {Function} cb
   */
  close(cb) {
    this.stream.end((err) => {
      if (err) {
        throw new Error(`Error closing stream: ${err}`);
      }
      return cb();
    });
  }
}

export default Logger;
