import { describe, test, expect, vi, beforeEach } from "vitest";

const mockStartSession = vi.fn();

const mockSeatRepository = {
  createMany: vi.fn(),
  findByHallId: vi.fn(),
};

const mockShowInventoryRepository = {
  createMany: vi.fn(),
  findByShowId: vi.fn(),
  releaseExpiredHolds: vi.fn(),
  holdSeats: vi.fn(),
  releaseSeats: vi.fn(),
};

vi.mock("mongoose", () => ({
  default: {
    startSession: mockStartSession,
  },
}));

vi.mock("../../src/modules/inventory/seat.repository.js", () => ({
  createMany: mockSeatRepository.createMany,
  findByHallId: mockSeatRepository.findByHallId,
}));

vi.mock(
  "../../src/modules/inventory/showInventory.repository.js",
  () => ({
    createMany: mockShowInventoryRepository.createMany,
    findByShowId: mockShowInventoryRepository.findByShowId,
    releaseExpiredHolds:
      mockShowInventoryRepository.releaseExpiredHolds,
    holdSeats: mockShowInventoryRepository.holdSeats,
    releaseSeats: mockShowInventoryRepository.releaseSeats,
  })
);

const {
  generateSeatsForHall,
  generateShowInventory,
  getShowSeats,
  holdSeats,
  releaseSeats,
  releaseExpiredHolds,
} = await import(
  "../../src/modules/inventory/inventory.service.js"
);

function createSession() {
  return {
    startTransaction: vi.fn(),
    commitTransaction: vi.fn().mockResolvedValue(),
    abortTransaction: vi.fn().mockResolvedValue(),
    endSession: vi.fn().mockResolvedValue(),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("generateSeatsForHall", () => {
  test("generates the correct number of seats", async () => {
    mockSeatRepository.createMany.mockResolvedValue([]);

    await generateSeatsForHall("hall-1", 2, 3);

    expect(mockSeatRepository.createMany).toHaveBeenCalledOnce();

    const seats =
      mockSeatRepository.createMany.mock.calls[0][0];

    expect(seats).toHaveLength(6);

    expect(seats[0]).toEqual({
      hallId: "hall-1",
      rowLabel: "A",
      seatNumber: 1,
      seatType: "REGULAR",
    });

    expect(seats[1]).toEqual({
      hallId: "hall-1",
      rowLabel: "A",
      seatNumber: 2,
      seatType: "REGULAR",
    });

    expect(seats[3]).toEqual({
      hallId: "hall-1",
      rowLabel: "B",
      seatNumber: 1,
      seatType: "REGULAR",
    });
  });

  test("marks configured rows as premium", async () => {
    mockSeatRepository.createMany.mockResolvedValue([]);

    await generateSeatsForHall(
      "hall-1",
      3,
      2,
      ["B"]
    );

    const seats =
      mockSeatRepository.createMany.mock.calls[0][0];

    const rowA = seats.filter(
      (seat) => seat.rowLabel === "A"
    );

    const rowB = seats.filter(
      (seat) => seat.rowLabel === "B"
    );

    const rowC = seats.filter(
      (seat) => seat.rowLabel === "C"
    );

    expect(rowA.every(
      (seat) => seat.seatType === "REGULAR"
    )).toBe(true);

    expect(rowB.every(
      (seat) => seat.seatType === "PREMIUM"
    )).toBe(true);

    expect(rowC.every(
      (seat) => seat.seatType === "REGULAR"
    )).toBe(true);
  });
});

describe("generateShowInventory", () => {
  test("creates inventory for every hall seat", async () => {
    mockSeatRepository.findByHallId.mockResolvedValue([
      { _id: "seat-1" },
      { _id: "seat-2" },
    ]);

    mockShowInventoryRepository.createMany.mockResolvedValue([]);

    await generateShowInventory(
      "show-1",
      "hall-1"
    );

    expect(
      mockSeatRepository.findByHallId
    ).toHaveBeenCalledWith("hall-1");

    expect(
      mockShowInventoryRepository.createMany
    ).toHaveBeenCalledOnce();

    const inventory =
      mockShowInventoryRepository.createMany.mock.calls[0][0];

    expect(inventory).toEqual([
      {
        showId: "show-1",
        seatId: "seat-1",
        status: "AVAILABLE",
        holdUntil: null,
        version: 0,
      },
      {
        showId: "show-1",
        seatId: "seat-2",
        status: "AVAILABLE",
        holdUntil: null,
        version: 0,
      },
    ]);
  });

  test("rejects a hall with no seats", async () => {
    mockSeatRepository.findByHallId.mockResolvedValue([]);

    await expect(
      generateShowInventory("show-1", "hall-1")
    ).rejects.toThrow("No seats found for this hall");

    expect(
      mockShowInventoryRepository.createMany
    ).not.toHaveBeenCalled();
  });
});

describe("getShowSeats", () => {
  test("releases expired holds and returns seats sorted by row and number", async () => {
    mockShowInventoryRepository.releaseExpiredHolds
      .mockResolvedValue();

    mockShowInventoryRepository.findByShowId
      .mockResolvedValue([
        {
          seatId: {
            rowLabel: "B",
            seatNumber: 2,
          },
        },
        {
          seatId: {
            rowLabel: "A",
            seatNumber: 2,
          },
        },
        {
          seatId: {
            rowLabel: "A",
            seatNumber: 1,
          },
        },
        {
          seatId: {
            rowLabel: "B",
            seatNumber: 1,
          },
        },
      ]);

    const result = await getShowSeats("show-1");

    expect(
      mockShowInventoryRepository.releaseExpiredHolds
    ).toHaveBeenCalledWith("show-1");

    expect(
      mockShowInventoryRepository.findByShowId
    ).toHaveBeenCalledWith("show-1");

    expect(
      result.map(
        (item) =>
          `${item.seatId.rowLabel}${item.seatId.seatNumber}`
      )
    ).toEqual(["A1", "A2", "B1", "B2"]);
  });
});

describe("holdSeats", () => {
  test("rejects an empty seat list", async () => {
    await expect(
      holdSeats("show-1", [])
    ).rejects.toThrow(
      "At least one seat is required"
    );

    expect(mockStartSession).not.toHaveBeenCalled();
  });

  test("rejects duplicate seat IDs", async () => {
    await expect(
      holdSeats("show-1", [
        "seat-1",
        "seat-1",
      ])
    ).rejects.toThrow(
      "Duplicate seat IDs are not allowed"
    );

    expect(mockStartSession).not.toHaveBeenCalled();
  });

  test("holds seats and commits the transaction", async () => {
    const session = createSession();

    mockStartSession.mockResolvedValue(session);

    mockShowInventoryRepository.holdSeats
      .mockResolvedValue({
        modifiedCount: 2,
      });

    const result = await holdSeats(
      "show-1",
      ["seat-1", "seat-2"]
    );

    expect(result.success).toBe(true);

    expect(result.seatIds).toEqual([
      "seat-1",
      "seat-2",
    ]);

    expect(result.holdUntil).toBeInstanceOf(Date);

    expect(session.startTransaction)
      .toHaveBeenCalledOnce();

    expect(session.commitTransaction)
      .toHaveBeenCalledOnce();

    expect(session.abortTransaction)
      .not.toHaveBeenCalled();

    expect(session.endSession)
      .toHaveBeenCalledOnce();

    expect(
      mockShowInventoryRepository.holdSeats
    ).toHaveBeenCalledOnce();

    const args =
      mockShowInventoryRepository.holdSeats.mock.calls[0];

    expect(args[0]).toBe("show-1");

    expect(args[1]).toEqual([
      "seat-1",
      "seat-2",
    ]);

    expect(args[2]).toBeInstanceOf(Date);

    expect(args[3]).toBe(session);
  });

  test("aborts the transaction when not all seats are available", async () => {
    const session = createSession();

    mockStartSession.mockResolvedValue(session);

    mockShowInventoryRepository.holdSeats
      .mockResolvedValue({
        modifiedCount: 1,
      });

    await expect(
      holdSeats("show-1", [
        "seat-1",
        "seat-2",
      ])
    ).rejects.toThrow(
      "One or more seats are not available"
    );

    expect(session.startTransaction)
      .toHaveBeenCalledOnce();

    expect(session.commitTransaction)
      .not.toHaveBeenCalled();

    expect(session.abortTransaction)
      .toHaveBeenCalledOnce();

    expect(session.endSession)
      .toHaveBeenCalledOnce();
  });
});

describe("releaseSeats", () => {
  test("rejects an empty seat list", async () => {
    await expect(
      releaseSeats("show-1", [])
    ).rejects.toThrow(
      "At least one seat is required"
    );

    expect(mockStartSession).not.toHaveBeenCalled();
  });

  test("rejects duplicate seat IDs", async () => {
    await expect(
      releaseSeats("show-1", [
        "seat-1",
        "seat-1",
      ])
    ).rejects.toThrow(
      "Duplicate seat IDs are not allowed"
    );

    expect(mockStartSession).not.toHaveBeenCalled();
  });

  test("releases seats and commits the transaction", async () => {
    const session = createSession();

    mockStartSession.mockResolvedValue(session);

    mockShowInventoryRepository.releaseSeats
      .mockResolvedValue({
        modifiedCount: 2,
      });

    const result = await releaseSeats(
      "show-1",
      ["seat-1", "seat-2"]
    );

    expect(result).toEqual({
      success: true,
      seatIds: [
        "seat-1",
        "seat-2",
      ],
    });

    expect(session.startTransaction)
      .toHaveBeenCalledOnce();

    expect(session.commitTransaction)
      .toHaveBeenCalledOnce();

    expect(session.abortTransaction)
      .not.toHaveBeenCalled();

    expect(session.endSession)
      .toHaveBeenCalledOnce();

    expect(
      mockShowInventoryRepository.releaseSeats
    ).toHaveBeenCalledWith(
      "show-1",
      ["seat-1", "seat-2"],
      session
    );
  });

  test("aborts the transaction when not all seats are held", async () => {
    const session = createSession();

    mockStartSession.mockResolvedValue(session);

    mockShowInventoryRepository.releaseSeats
      .mockResolvedValue({
        modifiedCount: 1,
      });

    await expect(
      releaseSeats("show-1", [
        "seat-1",
        "seat-2",
      ])
    ).rejects.toThrow(
      "One or more seats are not held"
    );

    expect(session.commitTransaction)
      .not.toHaveBeenCalled();

    expect(session.abortTransaction)
      .toHaveBeenCalledOnce();

    expect(session.endSession)
      .toHaveBeenCalledOnce();
  });
});

describe("releaseExpiredHolds", () => {
  test("delegates to the repository", async () => {
    mockShowInventoryRepository.releaseExpiredHolds
      .mockResolvedValue({
        modifiedCount: 3,
      });

    const result =
      await releaseExpiredHolds("show-1");

    expect(result).toEqual({
      modifiedCount: 3,
    });

    expect(
      mockShowInventoryRepository.releaseExpiredHolds
    ).toHaveBeenCalledWith("show-1");
  });
});