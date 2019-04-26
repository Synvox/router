/**
 * eslint-env jest
 * @jest-environment node
 */

const micro = require("micro");
const testListen = require("test-listen");
const { get, post } = require("axios");

const { Router, params, query } = require("./");

let server = null;
beforeAll(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterAll(() => {
  console.error.mockRestore();
});

afterEach(() => {
  console.error.mockClear();
  if (server) server.close();
});

function listen(srv) {
  server = srv;
  return testListen(srv);
}

it("should handle requests", async () => {
  const app = Router();

  app.get("/:name", req => {
    const { name } = params(req);
    return `Hello ${name}`;
  });

  const url = await listen(micro(app));
  const { data: body } = await get(`${url}/bobby`);

  expect(body).toEqual("Hello bobby");
});

it("should handle multiple routes", async () => {
  const app = Router();

  app.get("/:name", req => {
    const { name } = params(req);
    return `Hello ${name}`;
  });

  app.post("/:name", req => {
    const { name } = params(req);
    return `Posted to ${name}`;
  });

  app.post("/", req => {
    return "post";
  });

  const url = await listen(micro(app));
  const { data: body } = await post(url);

  expect(body).toEqual("post");
});

it("should allow nesting routers", async () => {
  const subApp = Router();

  subApp.get("/:age", req => {
    const { age } = params(req);
    return `age is ${age}`;
  });

  const app = Router();

  app.use("/sub", subApp);

  const url = await listen(micro(app));
  const { data: body } = await get(`${url}/sub/123`);

  expect(body).toEqual("age is 123");
});

describe("middleware", () => {
  it("should allow request style middleware", async () => {
    const app = Router();

    app.use((req, _, next) => {
      req.thing = 123;
      next();
    });

    app.get("/", req => {
      const { thing } = req;
      return `thing is ${thing}`;
    });

    const url = await listen(micro(app));
    const { data: body } = await get(`${url}/sub/123`);

    expect(body).toEqual("thing is 123");
  });

  it("should throw on next(error)", async () => {
    const app = Router();

    app.use((_req, _res, next) => {
      next(new Error("error"));
    });

    const url = await listen(micro(app));
    const { status } = await get(url).catch(r => r.response);

    expect(status).toEqual(500);
  });
});

it("should 404 if no route is found", async () => {
  const app = Router();

  const url = await listen(micro(app));
  const { status } = await get(`${url}/bobby`).catch(r => r.response);

  expect(status).toEqual(404);
});

describe("search query", () => {
  it("should allow getting the search query", async () => {
    const app = Router();

    app.get("/", req => {
      const { name } = query(req);
      return `Hello ${name}`;
    });

    const url = await listen(micro(app));
    const { data: body } = await get(`${url}?name=bobby`);

    expect(body).toEqual("Hello bobby");
  });

  it("should cache requests to get the search query", async () => {
    const app = Router();

    app.get("/", req => {
      const query1 = query(req);
      const query2 = query(req);
      return query1 === query2 ? "equal" : "not-equal";
    });

    const url = await listen(micro(app));
    const { data: body } = await get(`${url}?name="bob`);

    expect(body).toEqual("equal");
  });
});
