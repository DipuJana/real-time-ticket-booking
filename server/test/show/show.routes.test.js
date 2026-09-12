import { readFile } from "node:fs/promises";
import { describe, expect, test } from "vitest";
import { showRoutes } from "../../src/routes/showRoutes.js";
import {
  validateCreateShow,
  validateEventId,
  validateShowId,
  validateUpdateShow,
} from "../../src/modules/event/show.validation.js";
import { requireAdmin } from "../../src/modules/hall/hall.authorization.js";

function findRoute(method, path) {
  const layer = showRoutes.stack.find(
    (candidate) =>
      candidate.route?.path === path && candidate.route.methods[method] === true
  );

  if (!layer) {
    throw new Error(`Missing ${method.toUpperCase()} ${path} route`);
  }

  return layer.route.stack.map((handlerLayer) => handlerLayer.handle);
}

function expectControllerHandler(handler, methodName) {
  expect(handler.toString()).toContain(`showController.${methodName}`);
}

function createResponse() {
  return {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
  };
}

describe("Show routes", () => {
  test("wires GET /events/:eventId/shows to validation and getShowsByEventId", () => {
    const handlers = findRoute("get", "/events/:eventId/shows");

    expect(handlers).toHaveLength(2);
    expect(handlers[0]).toBe(validateEventId);
    expectControllerHandler(handlers[1], "getShowsByEventId");
  });

  test("wires POST /shows through requireAdmin, create validation, and createShow", () => {
    const handlers = findRoute("post", "/shows");

    expect(handlers).toHaveLength(3);
    expect(handlers[0]).toBe(requireAdmin);
    expect(handlers[1]).toBe(validateCreateShow);
    expectControllerHandler(handlers[2], "createShow");
  });

  test("wires GET /shows/:id to ID validation and getShowById", () => {
    const handlers = findRoute("get", "/shows/:id");

    expect(handlers).toHaveLength(2);
    expect(handlers[0]).toBe(validateShowId);
    expectControllerHandler(handlers[1], "getShowById");
  });

  test("wires PUT /shows/:id with authorization before validation and updateShow", () => {
    const handlers = findRoute("put", "/shows/:id");

    expect(handlers).toHaveLength(4);
    expect(handlers[0]).toBe(requireAdmin);
    expect(handlers[1]).toBe(validateShowId);
    expect(handlers[2]).toBe(validateUpdateShow);
    expectControllerHandler(handlers[3], "updateShow");
  });

  test("wires DELETE /shows/:id through authorization, ID validation, and cancelShow", () => {
    const handlers = findRoute("delete", "/shows/:id");

    expect(handlers).toHaveLength(3);
    expect(handlers[0]).toBe(requireAdmin);
    expect(handlers[1]).toBe(validateShowId);
    expectControllerHandler(handlers[2], "cancelShow");
  });

  test("preserves the existing unauthenticated requireAdmin behavior", () => {
    const [requireAdminHandler] = findRoute("post", "/shows");
    const res = createResponse();
    let nextCalled = false;

    requireAdminHandler({}, res, () => {
      nextCalled = true;
    });

    expect(nextCalled).toBe(false);
    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({
      success: false,
      message: "Authentication is required",
    });
  });

  test("mounts showRoutes exactly once at /api in app.js", async () => {
    const appSource = await readFile(new URL("../../src/app.js", import.meta.url), "utf8");
    const showRouteMounts = appSource.match(
      /app\.use\(\s*["']\/api["']\s*,\s*showRoutes\s*\)/g
    );

    expect(showRouteMounts).toHaveLength(1);
  });
});
