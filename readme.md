# `@synvox/router`

![Travis](https://img.shields.io/travis/Synvox/router.svg)
[![codecov](https://codecov.io/gh/Synvox/router/branch/master/graph/badge.svg)](https://codecov.io/gh/Synvox/router)

A tiny routing library to complement [micro](https://github.com/zeit/micro) inspired by the good and bad parts of `express.js`.

## Example

```js
import micro from "micro";
import Router from "@synvox/router";

const app = Router();

app.get("/", (_req, _res) => "Hello World!");

micro(app).listen(3000);
```

`@synvox/router` is different than other `micro` routers because it enables nesting. This is very nice when you are combining routers together:

```js
import micro from "micro";
import Router from "@synvox/router";

import AuthService from "./auth";
import PeopleService from "./people";

const app = Router();

app.use("/auth", AuthService);
app.use("/people", PeopleService);

micro(app).listen(3000);
```

`express.js` has a sharp knife called middleware. `@synvox/router` has a `use` method which will feel familiar:

```js
import micro from "micro";
import cors from "cors";
import Router from "@synvox/router";

const app = Router();

app.use(cors());

micro(app).listen(3000);
```

This is useful for adding things like `cors` headers or rate limiting, but painful when mutating custom properties of `req`. _In `synvox/router`, the req object is a vanilla `http.IncomingMessage` object._ There is no `req.body`, `req.params`, `req.query`, etc. Instead try this:

```js
import micro from "micro";
import Router, { params, query } from "@synvox/router";

const app = Router();

app.get("/:name", req => {
  const { name } = params(req);
  const { sort } = query(req);
  // do something with `name` and `sort`
  return { ok: true };
});

micro(app).listen(3000);
```

You may also write your own hooks using `WeakMap`:

```js
import micro from "micro";
import Router, { params, body } from "@synvox/router";

const userWeakMap = new WeakMap();
async function useUser(req) {
  if (userWeakMap.get(req)) return userWeakMap.get(req);

  const token = req.headers.token;
  const user = token ? await Users.get(token) : null;
  userWeakMap.set(req, user);

  return user;
}

const app = Router();

app.get("/", async req => {
  const user = await useUser(req);
  // do something with `user`
  return { ok: true };
});

micro(app).listen(3000);
```
