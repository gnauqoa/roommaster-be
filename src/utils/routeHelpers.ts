/**
 * Route Helper Utilities
 * Provides helper functions for lazy-loading controllers in routes
 */

import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Creates a lazy-loaded route handler that instantiates the controller on each request
 * This ensures the DI container is fully initialized before resolving dependencies
 *
 * @param getController - Function that returns a controller instance
 * @param method - Controller method name to call
 * @returns Express request handler
 */
export function lazyHandler<T>(getController: () => T, method: keyof T): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const controller = getController();
    const handler = controller[method] as unknown as (
      req: Request,
      res: Response,
      next: NextFunction
    ) => void | Promise<void>;

    return handler.call(controller, req, res, next);
  };
}
