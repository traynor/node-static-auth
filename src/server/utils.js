import deepMerge from 'deepmerge';


/**
 * server helper
 */
const Utils = class {

  static isHttp2Supported() {
    let supported = parseInt(process.versions.node.split('.')[0], 10) >= 9;
    return supported;
  }

  static redirect(response, headers, port, url) {
    const host = headers.host.split(':')[0];
    response.writeHead(301, {
      "Location": 'https://' + host + ':' + port + url
    });
    response.end();
  }

  static sendForbidden(response, realm) {
    const head = {
      'WWW-Authenticate': 'Basic realm="Protected"' || 'Basic realm="' + realm + '"'
    };
    response.writeHead(401, head);
    response.end('Access denied');
  }

  static sendNotFound(response, err, host, url) {
    // Respond to the client
    response.writeHead(err.status, err.headers);

    //logger.log(null, request.connection.remoteAddress, "(credentials && credentials.name ? credentials.name : '-')", request.method, request.url, response.statusCode, response.socket._bytesDispatched/*response.headers['content-length']*/, request.headers['user-agent']);

    // todo: handle ie not serving small 404 pages
    // https://stackoverflow.com/questions/3970093/include-after-php-404-header-returning-oops-this-link-appears-to-be-broken
    response.end('<html><body style="text-align:center;"><br>' + err.status + ' Not Found<br><p>Page <b>' + host + url + '</b> was not found on this server</p><p><a href="/">Home</a></p></body></html>');
  }

  static sendError(response, err, url) {
    // Respond to the client
    response.writeHead(err.status, err.headers);
    //logger.log();
    response.end('<html><body style="text-align:center;"><br>' + err.status + '<br><p>Error serving: "<b>' + url + '</b>"</p><p>' + err.message + '<p><a href="/">Home</a></p></body></html>');
  }

  static sendCustom(request, response, type, file, fileServer, log) {

    let headers = {};
    if (type === 401) {
      headers = {
        'WWW-Authenticate': 'Basic realm="Protected"' || 'Basic realm="' + realm + '"'
      };
    }

    fileServer.serveFile(file, type, headers, request, response);

    request.addListener('end', function() {

      if (log) {
        log(request, response, () => {
          /*console.log('logger logged');*/
        });
      }
    })
  }

  static mergeDeep(target, source) {

    return deepMerge(target, source);
  }


}

export default Utils;
