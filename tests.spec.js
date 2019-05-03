/**
 * eslint-env jest
 * @jest-environment node
 */

const micro = require("micro");
const testListen = require("test-listen");
const { get, post } = require("axios");

const {
  Router,
  useUrlParams,
  useQueryString,
  createHook,
  useBasePath
} = require("./");

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
    const { name } = useUrlParams(req);
    return `Hello ${name}`;
  });

  const url = await listen(micro(app));
  const { data: body } = await get(`${url}/bobby`);

  expect(body).toEqual("Hello bobby");
});

it("should handle multiple routes", async () => {
  const app = Router();

  app.get("/:name", req => {
    const { name } = useUrlParams(req);
    return `Hello ${name}`;
  });

  app.post("/:name", req => {
    const { name } = useUrlParams(req);
    return `Posted to ${name}`;
  });

  app.post("/", req => {
    return "post";
  });

  const url = await listen(micro(app));
  const { data: body } = await post(url);

  expect(body).toEqual("post");
});

it("should hit the first qualified route", async () => {
  const app = Router();

  app.get("/", req => {
    return `first`;
  });

  app.get("/abc", req => {
    return `last`;
  });

  const url = await listen(micro(app));
  const { data: body } = await get(`${url}/abc`);

  expect(body).toEqual("last");
});

it("should allow nesting routers", async () => {
  const subApp = Router();

  subApp.get("/:age", req => {
    const { age } = useUrlParams(req);
    return `age is ${age}`;
  });

  const app = Router();

  app.use("/sub", subApp);

  const url = await listen(micro(app));
  const { data: body } = await get(`${url}/sub/123`);

  expect(body).toEqual("age is 123");
});

it("should allow nesting deep routers", async () => {
  const subApp2 = Router();

  subApp2.get("/3rd", () => {
    return "3rd";
  });

  const subApp1 = Router();

  const app = Router();

  subApp1.use("/2nd", subApp2);

  app.use("/1st", subApp1);

  const url = await listen(micro(app));
  const { data: body } = await get(`${url}/1st/2nd/3rd`);

  expect(body).toEqual("3rd");
});

it("should 404 if no route is found", async () => {
  const app = Router();

  const url = await listen(micro(app));
  const { status } = await get(`${url}/bobby`).catch(r => r.response);

  expect(status).toEqual(404);
});

it("should allow getting the search query", async () => {
  const app = Router();

  app.get("/", req => {
    const { name } = useQueryString(req);
    return `Hello ${name}`;
  });

  const url = await listen(micro(app));
  const { data: body } = await get(`${url}?name=bobby`);

  expect(body).toEqual("Hello bobby");
});

it("should allow getting the base path", async () => {
  const subApp = Router();

  subApp.get("/", req => {
    return useBasePath(req);
  });

  const app = Router();

  app.use("/sub", subApp);

  const url = await listen(micro(app));
  const { data: body } = await get(`${url}/sub`);

  expect(body).toEqual("/sub");
});

describe("custom hooks", () => {
  const useUrl = createHook(req => req.url);
  const useUrlAsync = createHook(async req => await req.url);

  it("should allow sync hooks", async () => {
    const app = Router();

    app.get("/", req => {
      return useUrl(req);
    });

    const url = await listen(micro(app));
    const { data: body } = await get(url);

    expect(typeof body === "string").toEqual(true);
  });

  it("should allow async hooks", async () => {
    const app = Router();

    app.get("/", async req => {
      return await useUrlAsync(req);
    });

    const url = await listen(micro(app));
    const { data: body } = await get(url);

    expect(typeof body === "string").toEqual(true);
  });

  it("should cache requests to get the hooks", async () => {
    const app = Router();

    app.get("/", req => {
      const query1 = useQueryString(req);
      const query2 = useQueryString(req);
      return query1 === query2 ? "equal" : "not-equal";
    });

    const url = await listen(micro(app));
    const { data: body } = await get(`${url}?name="bob`);

    expect(body).toEqual("equal");
  });
});
