import { test, expect } from "vitest";

import {
  validateShowId,
  validateHoldRequest,
  validateReleaseRequest,
} from "../../src/modules/inventory/inventory.validation.js";

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

test("validateShowId calls next for a valid show ID", () => {
  const req = {
    params: {
      showId: "507f1f77bcf86cd799439011",
    },
  };

  const res = createResponse();
  let nextCalled = false;

  validateShowId(req, res, () => {
    nextCalled = true;
  });

  expect(nextCalled).toBe(true);
  expect(res.statusCode).toBeNull();
});

test("validateShowId returns 400 for an invalid show ID", () => {
  const req = {
    params: {
      showId: "invalid-id",
    },
  };

  const res = createResponse();
  let nextCalled = false;

  validateShowId(req, res, () => {
    nextCalled = true;
  });

  expect(nextCalled).toBe(false);
  expect(res.statusCode).toBe(400);
  expect(res.body.success).toBe(false);
});

test("validateHoldRequest calls next for a valid request", () => {
  const req = {
    body: {
      showId: "507f1f77bcf86cd799439011",
      seatIds: [
        "507f1f77bcf86cd799439012",
        "507f1f77bcf86cd799439013",
      ],
    },
  };

  const res = createResponse();
  let nextCalled = false;

  validateHoldRequest(req, res, () => {
    nextCalled = true;
  });

  expect(nextCalled).toBe(true);
  expect(res.statusCode).toBeNull();
});

test("validateHoldRequest rejects missing showId", () => {
  const req = {
    body: {
      seatIds: ["507f1f77bcf86cd799439012"],
    },
  };

  const res = createResponse();

  validateHoldRequest(req, res, () => {});

  expect(res.statusCode).toBe(400);
  expect(res.body.message).toBe("showId is required");
});

test("validateHoldRequest rejects an empty seatIds array", () => {
  const req = {
    body: {
      showId: "507f1f77bcf86cd799439011",
      seatIds: [],
    },
  };

  const res = createResponse();

  validateHoldRequest(req, res, () => {});

  expect(res.statusCode).toBe(400);
  expect(res.body.message).toBe(
    "seatIds must be a non-empty array"
  );
});

test("validateHoldRequest rejects an invalid seat ID", () => {
  const req = {
    body: {
      showId: "507f1f77bcf86cd799439011",
      seatIds: ["invalid-seat-id"],
    },
  };

  const res = createResponse();

  validateHoldRequest(req, res, () => {});

  expect(res.statusCode).toBe(400);
  expect(res.body.message).toBe(
    "One or more seat IDs are invalid"
  );
});

test("validateReleaseRequest calls next for a valid request", () => {
  const req = {
    body: {
      showId: "507f1f77bcf86cd799439011",
      seatIds: ["507f1f77bcf86cd799439012"],
    },
  };

  const res = createResponse();
  let nextCalled = false;

  validateReleaseRequest(req, res, () => {
    nextCalled = true;
  });

  expect(nextCalled).toBe(true);
  expect(res.statusCode).toBeNull();
});

test("validateReleaseRequest rejects missing seatIds", () => {
  const req = {
    body: {
      showId: "507f1f77bcf86cd799439011",
    },
  };

  const res = createResponse();

  validateReleaseRequest(req, res, () => {});

  expect(res.statusCode).toBe(400);
  expect(res.body.message).toBe(
    "seatIds must be a non-empty array"
  );
});