//@ts-check
const url = require("url");
const { parse: parseQueryString } = require("querystring");
const { send } = require("micro");
const pathMatch = require("path-match");

const subAppMatch = pathMatch({
  sensitive: false,
  strict: false,
  end: false
});

const routeMatch = pathMatch({
  sensitive: false,
  strict: false,
  end: true
});

module.exports = Router;
exports = Router;
exports.default = Router;
exports.Router = Router;

const setBasePathSymbol = Symbol("BasePathSetter");

function Router() {
  let basePath = "";
  const routes = [];

  function handle(method, path, handler) {
    const match = routeMatch(basePath + path);
    routes.push({ method, path, handler, match });
  }

  function use(path, handler) {
    handler[setBasePathSymbol](basePath + path);
    const match = subAppMatch(basePath + path);
    routes.push({ method: null, path, handler, match });
  }

  async function handler(req, res) {
    for (let route of routes) {
      if (route.method && route.method !== req.method) continue;

      const path = url.parse(req.url, true).pathname;
      const params = route.match(path);

      if (!params) continue;
      paramsMap.set(req, params);
      basePathMap.set(req, basePath);
      return route.handler(req, res);
    }

    return send(res, 404);
  }

  const methods = [
    "GET",
    "HEAD",
    "POST",
    "PUT",
    "DELETE",
    "CONNECT",
    "OPTIONS",
    "TRACE",
    "PATCH"
  ];

  methods.forEach(method => {
    handler[method.toLowerCase()] = (path, handler) =>
      handle(method, path, handler);
  });

  function setBasePath(bp) {
    basePath = bp;
    for (let route of routes) {
      const match = routeMatch(basePath + route.path);
      route.match = match;
    }
  }

  handler.use = use;
  handler[setBasePathSymbol] = setBasePath;

  return handler;
}

function createHook(fn) {
  const weakMap = new WeakMap();
  return function(req) {
    const cache = weakMap.get(req);
    if (cache) return cache;

    const value = fn(req);
    if (value instanceof Promise) {
      return value.then(realValue => {
        weakMap.set(req, realValue);
        return realValue;
      });
    } else {
      weakMap.set(req, value);
      return value;
    }
  };
}

exports.createHook = createHook;

const paramsMap = new WeakMap();
exports.useUrlParams = function useUrlParams(req) {
  return paramsMap.get(req);
};

exports.useQueryString = createHook(function useQueryString(req) {
  const queryString = url.parse(req.url, true).search;
  const query = parseQueryString(queryString.slice(1));
  return query;
});

const basePathMap = new WeakMap();
exports.useBasePath = function(req) {
  return basePathMap.get(req);
};
