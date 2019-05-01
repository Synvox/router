//@ts-check
const url = require("url");
const qs = require("qs");
const { send } = require("micro");
const routeMatch = require("path-match")({
  sensitive: false,
  strict: false,
  end: false
});

module.exports = Router;
exports = Router;
exports.default = Router;
exports.Router = Router;

const mergeRoutersSym = Symbol("MergeRouters");

function Router() {
  const routes = [];

  function handle(method, path, handler) {
    const match = routeMatch(path);
    routes.push({ method, path, handler, match });
  }

  function use(path, handler) {
    const newRoutes = handler[mergeRoutersSym]();

    for (let route of newRoutes) {
      handle(route.method, path + route.path, route.handler);
    }
  }

  async function handler(req, res) {
    for (let route of routes) {
      if (route.method && route.method !== req.method) continue;

      const path = url.parse(req.url, true).pathname;
      const params = route.match(path);
      if (!params) continue;
      paramsMap.set(req, params);
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

  function mergeRouters() {
    return routes;
  }

  handler.use = use;
  handler[mergeRoutersSym] = mergeRouters;

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
exports.params = function params(req) {
  return paramsMap.get(req);
};

exports.query = createHook(function query(req) {
  const queryString = url.parse(req.url, true).search || "";
  const query = qs.parse(queryString.slice(1));
  return query;
});
