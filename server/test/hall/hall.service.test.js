import { beforeEach, describe, expect, test, vi } from "vitest";
import { HallError } from "../../src/modules/hall/hall.errors.js";
import Hall from "../../src/modules/hall/hall.model.js";
import { HallService } from "../../src/modules/hall/hall.service.js";

const hallRepository = {
  create: vi.fn(),
  findById: vi.fn(),
  updateById: vi.fn(),
};
const venueRepository = { findVenueById: vi.fn() };
const seatRepository = { findByHallId: vi.fn() };

const hallService = new HallService({
  hallRepository,
  venueRepository,
  seatRepository,
});

const venueId = "507f1f77bcf86cd799439011";
const hallId = "507f1f77bcf86cd799439012";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createHall", () => {
  test("defaults premiumRows to an empty array", () => {
    const hall = new Hall({
      venueId,
      name: "Screen 1",
      totalRows: 2,
      seatsPerRow: 3,
      capacity: 6,
    });

    expect(hall.premiumRows).toEqual([]);
  });

  test("creates a valid hall with derived capacity", async () => {
    venueRepository.findVenueById.mockResolvedValue({ _id: venueId });
    hallRepository.create.mockImplementation(async (data) => data);

    const result = await hallService.createHall(venueId, {
      name: " Screen 1 ",
      totalRows: 4,
      seatsPerRow: 5,
      premiumRows: ["B", "D"],
    });

    expect(result).toEqual({
      venueId,
      name: "Screen 1",
      totalRows: 4,
      seatsPerRow: 5,
      premiumRows: ["B", "D"],
      capacity: 20,
    });
  });

  test("rejects a nonexistent venue", async () => {
    venueRepository.findVenueById.mockResolvedValue(null);

    await expect(
      hallService.createHall(venueId, {
        name: "Screen 1",
        totalRows: 2,
        seatsPerRow: 3,
      })
    ).rejects.toMatchObject({ statusCode: 404, message: "Venue not found" });
  });

  test("rejects an inconsistent capacity", async () => {
    venueRepository.findVenueById.mockResolvedValue({ _id: venueId });

    await expect(
      hallService.createHall(venueId, {
        name: "Screen 1",
        totalRows: 2,
        seatsPerRow: 3,
        capacity: 7,
      })
    ).rejects.toBeInstanceOf(HallError);
  });
});

describe("updateHall", () => {
  const existingHall = {
    _id: hallId,
    venueId,
    name: "Screen 1",
    totalRows: 2,
    seatsPerRow: 3,
    premiumRows: [],
    capacity: 6,
  };

  test("updates a hall and recalculates its capacity", async () => {
    hallRepository.findById.mockResolvedValue(existingHall);
    seatRepository.findByHallId.mockResolvedValue([]);
    hallRepository.updateById.mockImplementation(async (_id, data) => data);

    const result = await hallService.updateHall(hallId, { totalRows: 4 });

    expect(result).toEqual({ totalRows: 4, capacity: 12 });
  });

  test("rejects a nonexistent hall", async () => {
    hallRepository.findById.mockResolvedValue(null);

    await expect(hallService.updateHall(hallId, { name: "Screen 2" })).rejects.toMatchObject({
      statusCode: 404,
      message: "Hall not found",
    });
  });

  test("rejects a layout change after seats exist", async () => {
    hallRepository.findById.mockResolvedValue(existingHall);
    seatRepository.findByHallId.mockResolvedValue([{ _id: "seat-id" }]);

    await expect(hallService.updateHall(hallId, { seatsPerRow: 4 })).rejects.toMatchObject({
      statusCode: 409,
    });
  });

  test("rejects premiumRows changes after seats exist", async () => {
    hallRepository.findById.mockResolvedValue(existingHall);
    seatRepository.findByHallId.mockResolvedValue([{ _id: "seat-id" }]);

    await expect(
      hallService.updateHall(hallId, { premiumRows: ["B"] })
    ).rejects.toMatchObject({
      statusCode: 409,
      message: "Hall layout cannot be changed after seats have been created",
    });
  });

  test("allows premiumRows changes before seats exist without changing capacity", async () => {
    hallRepository.findById.mockResolvedValue(existingHall);
    seatRepository.findByHallId.mockResolvedValue([]);
    hallRepository.updateById.mockImplementation(async (_id, data) => data);

    const result = await hallService.updateHall(hallId, {
      premiumRows: ["B"],
    });

    expect(result).toEqual({ premiumRows: ["B"], capacity: 6 });
  });

  test("rejects an update capacity that does not match the layout", async () => {
    hallRepository.findById.mockResolvedValue(existingHall);

    await expect(hallService.updateHall(hallId, { capacity: 7 })).rejects.toBeInstanceOf(HallError);
  });
});
