import { describe, expect, test, vi } from "vitest";
import { ShowController } from "../../src/modules/event/controllers/showController.js";
import { HallError } from "../../src/modules/hall/hall.errors.js";

const eventId = "507f1f77bcf86cd799439011";
const showId = "507f1f77bcf86cd799439012";

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

function createShowService() {
  return {
    getShowsByEventId: vi.fn(),
    createShow: vi.fn(),
    getShowById: vi.fn(),
    updateShow: vi.fn(),
    cancelShow: vi.fn(),
    deleteShow: vi.fn(),
  };
}

describe("ShowController", () => {
  test("gets Shows by Event ID and returns the success response", async () => {
    const shows = [{ _id: showId, eventId }];
    const showService = createShowService();
    showService.getShowsByEventId.mockResolvedValue(shows);
    const controller = new ShowController(showService);
    const res = createResponse();

    await controller.getShowsByEventId({ params: { eventId } }, res);

    expect(showService.getShowsByEventId).toHaveBeenCalledWith(eventId);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      success: true,
      data: shows,
      message: "Shows fetched successfully",
    });
  });

  test("creates a Show with the request body and returns HTTP 201", async () => {
    const showData = { eventId, hallId: "507f1f77bcf86cd799439013", price: 250 };
    const createdShow = { _id: showId, ...showData };
    const showService = createShowService();
    showService.createShow.mockResolvedValue(createdShow);
    const controller = new ShowController(showService);
    const res = createResponse();

    await controller.createShow({ body: showData }, res);

    expect(showService.createShow).toHaveBeenCalledWith(showData);
    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({
      success: true,
      data: createdShow,
      message: "Show created successfully",
    });
  });

  test("gets a Show by ID and returns HTTP 200", async () => {
    const show = { _id: showId };
    const showService = createShowService();
    showService.getShowById.mockResolvedValue(show);
    const controller = new ShowController(showService);
    const res = createResponse();

    await controller.getShowById({ params: { id: showId } }, res);

    expect(showService.getShowById).toHaveBeenCalledWith(showId);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      success: true,
      data: show,
      message: "Show fetched successfully",
    });
  });

  test("updates a Show with its ID and request body", async () => {
    const updateData = { price: 300 };
    const updatedShow = { _id: showId, ...updateData };
    const showService = createShowService();
    showService.updateShow.mockResolvedValue(updatedShow);
    const controller = new ShowController(showService);
    const res = createResponse();

    await controller.updateShow({ params: { id: showId }, body: updateData }, res);

    expect(showService.updateShow).toHaveBeenCalledWith(showId, updateData);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      success: true,
      data: updatedShow,
      message: "Show updated successfully",
    });
  });

  test("cancels a Show without invoking a delete operation", async () => {
    const cancelledShow = { _id: showId, status: "CANCELLED" };
    const showService = createShowService();
    showService.cancelShow.mockResolvedValue(cancelledShow);
    const controller = new ShowController(showService);
    const res = createResponse();

    await controller.cancelShow({ params: { id: showId } }, res);

    expect(showService.cancelShow).toHaveBeenCalledWith(showId);
    expect(showService.deleteShow).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      success: true,
      data: cancelledShow,
      message: "Show cancelled successfully",
    });
  });

  test("maps a HallError to its status and message", async () => {
    const showService = createShowService();
    showService.createShow.mockRejectedValue(new HallError("Hall not found", 404));
    const controller = new ShowController(showService);
    const res = createResponse();

    await controller.createShow({ body: {} }, res);

    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ success: false, message: "Hall not found" });
  });

  test("uses the shared Event error handler for generic service errors", async () => {
    const showService = createShowService();
    showService.getShowById.mockRejectedValue(new Error("Show not found"));
    const controller = new ShowController(showService);
    const res = createResponse();
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await controller.getShowById({ params: { id: showId } }, res);

    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({
      success: false,
      message: "Show not found",
    });
    errorSpy.mockRestore();
  });
});
