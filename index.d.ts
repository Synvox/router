/// <reference types="node" />

import { IncomingMessage, ServerResponse } from "http";

type RequestHandler = (req: IncomingMessage, res: ServerResponse) => any;

type RoutePathHandler = (path: string, handler: RequestHandler) => void;

export interface Router {
  (req: IncomingMessage, res: ServerResponse): any;
  use: RoutePathHandler;
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

export function RouterConstructor(): Router;
export function useUrlParams<T>(req: IncomingMessage): T;
export function useQueryString<T>(req: IncomingMessage): T;
export function createHook<T>(
  fn: (req: IncomingMessage) => T
): (req: IncomingMessage) => T;

export default RouterConstructor;
