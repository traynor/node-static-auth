# 1st DRAFT
# node-static-auth
Serve static files with Basic auth protection and access file logging service on top of Node.JS' native `HTTP`/`HTTP2` server with `HTTPS` support.

# Features:

- static `HTTP` or `HTTP/2`server
- `HTTPS` support with `HTTP` server listener for `HTTP`->`HTTPS` redirect
- `Basic auth` protection
- access log file with log file rotation option
- serve your custom error pages (401, 404, 500), defaults to built-in ones
- pass native config to `node-static` and `morgan` modules
- disable/enable/customize features

___Note about HTTP2___

You must install node `>= 9.x` to use it.

There could probably be some bugs due to its experimental status, so they're going to be dealt with in time.

# Usage

- __Install:__

```bash
npm i -S node-static-auth
```

- __load module__

```js
import nodeStaticAuth from 'node-static-auth';
```

- __setup config__

Usage consists of setting up config object and passing it to `node-static-auth` instance.

There are 4 main settings areas/properties in config object you set up:

```js
const config = {
	nodeStatic: {
		// set static server options (root, index file etc.)
	},
	server {
		// set web server options (ports, enable/disable http/2, https, http->https, custom pages etc.)
	},
	auth: {
		// set Basic auth protection (enable/disable etc.)
	},
	logger: {
		// set logger options (enable/disable, file path, log type, log rotation etc.)
	}
}
```

## Examples

### static server


# Under the hood
It bundles [`node-static`](https://www.npmjs.com/package/node-static) [`basic-auth`](https://www.npmjs.com/package/basic-auth) and [`morgan`](https://www.npmjs.com/package/morgan) modules on top of Node.js built-in `HTTP`, `HTTP2`server, as well as `HTTPS` server. It extends static server with error pages handler with custom error pages handler option.

You can pass the same config/options for each module.

## node-static
- supports all native config/features

## basic auth
- can be disabled

## logger
- use all native config except file streaming


# TODO

- [ ] fix lint error
- [ ] logger: add print to stdout option
