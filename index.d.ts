/// <reference types="node" />

import { IncomingMessage, ServerResponse } from "http";

type RequestHandler = (
  req: IncomingMessage,
  res: ServerResponse,
  next: (error?: Error) => void
) => any;

type RoutePathHandler = (path: string, handler: RequestHandler) => void;

interface App {
  (req: IncomingMessage, res: ServerResponse): any;
  use: ((router: App) => void) | RoutePathHandler;
  get: RoutePathHandler;
  head: RoutePathHandler;
  post: RoutePathHandler;
  put: RoutePathHandler;
  delete: RoutePathHandler;
  connect: RoutePathHandler;
  options: RoutePathHandler;
  trace: RoutePathHandler;
  patch: RoutePathHandler;
}

export function Router(): App;
export function params<T>(req: IncomingMessage): T;
export function query<T>(req: IncomingMessage): T;
export function createHook<T>(
  fn: (req: IncomingMessage) => T
): (req: IncomingMessage) => T;

export default Router;
