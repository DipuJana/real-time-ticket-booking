import { beforeEach, describe, expect, test, vi } from "vitest";
import { HallError } from "../../src/modules/hall/hall.errors.js";
import { ShowService } from "../../src/modules/event/services/showService.js";

const eventId = "507f1f77bcf86cd799439011";
const hallId = "507f1f77bcf86cd799439012";
const showId = "507f1f77bcf86cd799439013";
const otherHallId = "507f1f77bcf86cd799439014";

const createShowData = {
  eventId,
  hallId,
  startTime: "2026-10-01T10:00:00.000Z",
  endTime: "2026-10-01T12:00:00.000Z",
  price: 250,
};

const existingShow = {
  _id: showId,
  ...createShowData,
  startTime: new Date(createShowData.startTime),
  endTime: new Date(createShowData.endTime),
  status: "SCHEDULED",
};

let showRepository;
let eventRepository;
let hallRepository;
let service;

function allowCreate({ overlap = null } = {}) {
  eventRepository.findEventById.mockResolvedValue({ _id: eventId });
  hallRepository.findById.mockResolvedValue({ _id: hallId });
  showRepository.findOverlappingShow.mockResolvedValue(overlap);
}

function loadExistingShow(show = existingShow) {
  showRepository.findById.mockResolvedValue(show);
}

beforeEach(() => {
  showRepository = {
    create: vi.fn(),
    findById: vi.fn(),
    findByEventId: vi.fn(),
    updateById: vi.fn(),
    findOverlappingShow: vi.fn(),
    hasInventory: vi.fn(),
    delete: vi.fn(),
  };
  eventRepository = { findEventById: vi.fn() };
  hallRepository = { findById: vi.fn() };
  service = new ShowService({ showRepository, eventRepository, hallRepository });
});

describe("createShow", () => {
  test("creates a Show when references, time, price, and schedule are valid", async () => {
    const createdShow = { _id: showId, ...createShowData, status: "SCHEDULED" };
    allowCreate();
    showRepository.create.mockResolvedValue(createdShow);

    await expect(service.createShow(createShowData)).resolves.toEqual(createdShow);
    expect(eventRepository.findEventById).toHaveBeenCalledWith(eventId);
    expect(hallRepository.findById).toHaveBeenCalledWith(hallId);
    expect(showRepository.findOverlappingShow).toHaveBeenCalledWith(
      hallId,
      createShowData.startTime,
      createShowData.endTime
    );
    expect(showRepository.create).toHaveBeenCalledWith(createShowData);
  });

  test("rejects when the Event does not exist", async () => {
    eventRepository.findEventById.mockResolvedValue(null);

    await expect(service.createShow(createShowData)).rejects.toThrow("Event not found");
    expect(hallRepository.findById).not.toHaveBeenCalled();
  });

  test("rejects when the Hall does not exist", async () => {
    eventRepository.findEventById.mockResolvedValue({ _id: eventId });
    hallRepository.findById.mockResolvedValue(null);

    await expect(service.createShow(createShowData)).rejects.toMatchObject({
      name: "HallError",
      message: "Hall not found",
      statusCode: 404,
    });
  });

  test("rejects when startTime is not before endTime", async () => {
    allowCreate();

    await expect(
      service.createShow({
        ...createShowData,
        startTime: createShowData.endTime,
      })
    ).rejects.toThrow("endTime must be later than startTime");
    expect(showRepository.findOverlappingShow).not.toHaveBeenCalled();
  });

  test("rejects a negative price", async () => {
    allowCreate();

    await expect(
      service.createShow({ ...createShowData, price: -1 })
    ).rejects.toThrow("price must be a finite non-negative number");
    expect(showRepository.findOverlappingShow).not.toHaveBeenCalled();
  });

  test("rejects an overlapping Show in the same Hall", async () => {
    allowCreate({ overlap: { _id: "existing-show" } });

    await expect(service.createShow(createShowData)).rejects.toThrow(
      "Show overlaps with an existing show in this hall"
    );
    expect(showRepository.create).not.toHaveBeenCalled();
  });

  test("allows back-to-back Shows", async () => {
    const backToBackShow = {
      ...createShowData,
      startTime: "2026-10-01T12:00:00.000Z",
      endTime: "2026-10-01T14:00:00.000Z",
    };
    allowCreate();
    showRepository.create.mockResolvedValue(backToBackShow);

    await expect(service.createShow(backToBackShow)).resolves.toEqual(backToBackShow);
    expect(showRepository.findOverlappingShow).toHaveBeenCalledWith(
      hallId,
      backToBackShow.startTime,
      backToBackShow.endTime
    );
  });

  test("does not create inventory", async () => {
    allowCreate();
    showRepository.create.mockResolvedValue({ _id: showId, ...createShowData });

    await service.createShow(createShowData);

    expect(showRepository).not.toHaveProperty("createInventory");
    expect(showRepository.hasInventory).not.toHaveBeenCalled();
  });
});

describe("getShowById", () => {
  test("returns an existing Show", async () => {
    loadExistingShow();

    await expect(service.getShowById(showId)).resolves.toEqual(existingShow);
    expect(showRepository.findById).toHaveBeenCalledWith(showId);
  });

  test("rejects when the Show is absent", async () => {
    showRepository.findById.mockResolvedValue(null);

    await expect(service.getShowById(showId)).rejects.toThrow("Show not found");
  });
});

describe("getShowsByEventId", () => {
  test("delegates to the Show repository", async () => {
    const shows = [existingShow];
    showRepository.findByEventId.mockResolvedValue(shows);

    await expect(service.getShowsByEventId(eventId)).resolves.toEqual(shows);
    expect(showRepository.findByEventId).toHaveBeenCalledWith(eventId);
  });
});

describe("updateShow", () => {
  test("updates an ordinary allowed field", async () => {
    loadExistingShow();
    showRepository.updateById.mockResolvedValue({ ...existingShow, price: 300 });

    await expect(service.updateShow(showId, { price: 300 })).resolves.toMatchObject({
      price: 300,
    });
    expect(showRepository.updateById).toHaveBeenCalledWith(showId, { price: 300 });
    expect(showRepository.hasInventory).not.toHaveBeenCalled();
  });

  test.each([
    ["hallId", otherHallId],
    ["startTime", "2026-10-01T11:00:00.000Z"],
    ["endTime", "2026-10-01T13:00:00.000Z"],
  ])("rejects changing %s when inventory exists", async (field, value) => {
    loadExistingShow();
    showRepository.hasInventory.mockResolvedValue(true);

    await expect(service.updateShow(showId, { [field]: value })).rejects.toThrow(
      "Show hall and schedule cannot be changed after inventory has been created"
    );
    expect(showRepository.updateById).not.toHaveBeenCalled();
  });

  test("allows valid Hall and time changes when inventory does not exist", async () => {
    const updateData = {
      hallId: otherHallId,
      startTime: "2026-10-01T13:00:00.000Z",
      endTime: "2026-10-01T15:00:00.000Z",
    };
    loadExistingShow();
    showRepository.hasInventory.mockResolvedValue(false);
    showRepository.findOverlappingShow.mockResolvedValue(null);
    showRepository.updateById.mockResolvedValue({ ...existingShow, ...updateData });

    await expect(service.updateShow(showId, updateData)).resolves.toMatchObject(updateData);
    expect(showRepository.findOverlappingShow).toHaveBeenCalledWith(
      otherHallId,
      updateData.startTime,
      updateData.endTime,
      showId
    );
  });

  test("rejects an overlapping schedule change when inventory does not exist", async () => {
    loadExistingShow();
    showRepository.hasInventory.mockResolvedValue(false);
    showRepository.findOverlappingShow.mockResolvedValue({ _id: "overlapping-show" });

    await expect(
      service.updateShow(showId, { startTime: "2026-10-01T11:00:00.000Z" })
    ).rejects.toThrow("Show overlaps with an existing show in this hall");
    expect(showRepository.updateById).not.toHaveBeenCalled();
  });

  test("rejects an invalid final time range", async () => {
    loadExistingShow();
    showRepository.hasInventory.mockResolvedValue(false);

    await expect(
      service.updateShow(showId, { endTime: "2026-10-01T09:00:00.000Z" })
    ).rejects.toThrow("endTime must be later than startTime");
    expect(showRepository.findOverlappingShow).not.toHaveBeenCalled();
  });

  test("rejects a negative price update", async () => {
    loadExistingShow();

    await expect(service.updateShow(showId, { price: -1 })).rejects.toThrow(
      "price must be a finite non-negative number"
    );
    expect(showRepository.updateById).not.toHaveBeenCalled();
  });

  test("rejects an invalid status", async () => {
    loadExistingShow();

    await expect(service.updateShow(showId, { status: "ACTIVE" })).rejects.toThrow(
      "status must be SCHEDULED or CANCELLED"
    );
    expect(showRepository.updateById).not.toHaveBeenCalled();
  });
});

describe("cancelShow", () => {
  test("changes status to CANCELLED without calling delete", async () => {
    loadExistingShow();
    const cancelledShow = { ...existingShow, status: "CANCELLED" };
    showRepository.updateById.mockResolvedValue(cancelledShow);

    await expect(service.cancelShow(showId)).resolves.toEqual(cancelledShow);
    expect(showRepository.updateById).toHaveBeenCalledWith(showId, {
      status: "CANCELLED",
    });
    expect(showRepository.delete).not.toHaveBeenCalled();
  });

  test("is safely repeatable for an already CANCELLED Show", async () => {
    const cancelledShow = { ...existingShow, status: "CANCELLED" };
    loadExistingShow(cancelledShow);
    showRepository.updateById.mockResolvedValue(cancelledShow);

    await service.cancelShow(showId);
    await service.cancelShow(showId);

    expect(showRepository.updateById).toHaveBeenCalledTimes(2);
    expect(showRepository.updateById).toHaveBeenNthCalledWith(1, showId, {
      status: "CANCELLED",
    });
    expect(showRepository.updateById).toHaveBeenNthCalledWith(2, showId, {
      status: "CANCELLED",
    });
    expect(showRepository.delete).not.toHaveBeenCalled();
  });
});
