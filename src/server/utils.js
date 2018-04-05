import deepMerge from 'deepmerge';


/**
 * Helper service
 *
 */
const Utils = class {

  /**
   * check for http2 support
   *
   * @return {Boolean}
   */
  static isHttp2Supported() {
    let supported = parseInt(process.versions.node.split('.')[0], 10) >= 9;
    return supported;
  }

  /**
   * redirect to https method
   */
  static redirect(response, headers, port, url) {
    const host = headers.host.split(':')[0];
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
  static sendForbidden(response, realm) {
    const head = {
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
  static sendNotFound(response, err, host, url) {
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
  static sendError(response, err, url) {
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
  static sendCustom(request, response, type, file, fileServer, log, realm) {

    let headers = {};
    if (type === 401) {
      headers = {
        'WWW-Authenticate': 'Basic realm="' + realm + '"' || 'Basic realm="Protected"'
      };
    }

    fileServer.serveFile(file, type, headers, request, response);

    request.addListener('end', function() {

      if (log) {
        log(request, response, () => {
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
  static mergeDeep(target, source) {

    return deepMerge(target, source);
  }

}

export default Utils;
