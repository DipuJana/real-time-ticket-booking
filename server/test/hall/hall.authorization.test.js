import { expect, test } from "vitest";
import { requireAdmin } from "../../src/modules/hall/hall.authorization.js";

function createResponse() {
  return {
    statusCode: null,
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

test("rejects an unauthenticated request", () => {
  const res = createResponse();
  requireAdmin({}, res, () => {});
  expect(res.statusCode).toBe(401);
});

test("rejects a non-admin request", () => {
  const res = createResponse();
  requireAdmin({ user: { role: "customer" } }, res, () => {});
  expect(res.statusCode).toBe(403);
});

test("allows an admin request", () => {
  const res = createResponse();
  let nextCalled = false;
  requireAdmin({ user: { role: "admin" } }, res, () => {
    nextCalled = true;
  });
  expect(nextCalled).toBe(true);
  expect(res.statusCode).toBeNull();
});
