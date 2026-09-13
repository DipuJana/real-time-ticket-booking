import { expect, test } from "vitest";
import {
  validateCreateHall,
  validateHallId,
  validateUpdateHall,
  validateVenueId,
} from "../../src/modules/hall/hall.validation.js";

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

function expectValidationFailure(validation, req) {
  const res = createResponse();
  let nextCalled = false;
  validation(req, res, () => {
    nextCalled = true;
  });
  expect(nextCalled).toBe(false);
  expect(res.statusCode).toBe(400);
  expect(res.body.success).toBe(false);
}

test("accepts a valid create hall request", () => {
  const res = createResponse();
  let nextCalled = false;
  validateCreateHall(
    { body: { name: "Screen 1", totalRows: 2, seatsPerRow: 3 } },
    res,
    () => {
      nextCalled = true;
    }
  );
  expect(nextCalled).toBe(true);
  expect(res.statusCode).toBeNull();
});

test("rejects an invalid venue ID", () => {
  expectValidationFailure(validateVenueId, { params: { venueId: "bad-id" } });
});

test("rejects an invalid hall ID", () => {
  expectValidationFailure(validateHallId, { params: { id: "bad-id" } });
});

test("rejects empty hall names and invalid layout values", () => {
  expectValidationFailure(validateCreateHall, {
    body: { name: " ", totalRows: 0, seatsPerRow: 3 },
  });
  expectValidationFailure(validateCreateHall, {
    body: { name: "Screen 1", totalRows: 2, seatsPerRow: -1 },
  });
});

test("rejects empty and unsupported update payloads", () => {
  expectValidationFailure(validateUpdateHall, { body: {} });
  expectValidationFailure(validateUpdateHall, { body: { venueId: "507f1f77bcf86cd799439011" } });
});
