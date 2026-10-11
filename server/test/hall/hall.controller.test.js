import { describe, expect, test, vi } from "vitest";
import { HallController } from "../../src/modules/hall/hall.controller.js";
import { HallError } from "../../src/modules/hall/hall.errors.js";

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

describe("HallController", () => {
  test("returns the normal success response when an admin creates a hall", async () => {
    const hall = { _id: "507f1f77bcf86cd799439012", name: "Screen 1", capacity: 6 };
    const hallService = { createHall: vi.fn().mockResolvedValue(hall) };
    const controller = new HallController(hallService);
    const res = createResponse();

    await controller.createHall(
      {
        params: { venueId: "507f1f77bcf86cd799439011" },
        body: { name: "Screen 1", totalRows: 2, seatsPerRow: 3 },
      },
      res
    );

    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({
      success: true,
      data: hall,
      message: "Hall created successfully",
    });
  });

  test("returns a safe error response for a missing hall", async () => {
    const hallService = {
      updateHall: vi.fn().mockRejectedValue(new HallError("Hall not found", 404)),
    };
    const controller = new HallController(hallService);
    const res = createResponse();

    await controller.updateHall(
      { params: { id: "507f1f77bcf86cd799439012" }, body: { name: "Screen 2" } },
      res
    );

    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ success: false, message: "Hall not found" });
  });
});
