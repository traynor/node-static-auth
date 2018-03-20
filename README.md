# 1st DRAFT
# node-static-auth
Serves static files with Basic auth protection and access logging service on top of Node.JS' `HTTP`/`HTTP2`/`HTTPS` modules.

# Features:

- static `HTTP` or `HTTP/2`server
- `HTTPS` support with `HTTP` server listener for HTTP->HTTPS redirect
- Basic auth protection
- access log file with log file rotation option
- error pages handler and custom error pages handler

___Note about HTTP2___

There are some bugs due to its experimental status, so they're going to be dealt with in time.

# Under the hood
It bundles [`node-static`](https://www.npmjs.com/package/node-static) [`basic-auth`](https://www.npmjs.com/package/basic-auth) and [`morgan`](https://www.npmjs.com/package/morgan) modules on top of Node.js built-in `HTTP`, `HTTP2`server and `HTTPS` support. Extends static server with error pages handler and custom error pages handler.

All features are customizable, which means you can pass same config/options for each module.

## node-static
- support all config/features


## basic auth
- add disable for dev


## logger
- access logger, config, 
- use all options except file streaming


# TODO

- [ ] extend tests

## node-static
- [ ] handle HTTP/2

## logger
- [ ] add print to stdout option
