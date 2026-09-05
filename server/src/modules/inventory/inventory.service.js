import mongoose from "mongoose";
import * as seatRepository from "./seat.repository.js";
import * as showInventoryRepository from "./showInventory.repository.js";

export async function generateSeatsForHall(
  hallId,
  totalRows,
  seatsPerRow,
  premiumRows = []
) {
  const seats = [];

  for (let row = 0; row < totalRows; row++) {
    const rowLabel = String.fromCharCode(65 + row);

    const seatType = premiumRows.includes(rowLabel)
      ? "PREMIUM"
      : "REGULAR";

    for (let seatNumber = 1; seatNumber <= seatsPerRow; seatNumber++) {
      seats.push({
        hallId,
        rowLabel,
        seatNumber,
        seatType,
      });
    }
  }

  return seatRepository.createMany(seats);
}

export async function generateShowInventory(showId, hallId) {
  const seats = await seatRepository.findByHallId(hallId);

  if (seats.length === 0) {
    throw new Error("No seats found for this hall");
  }

  const inventory = seats.map((seat) => ({
    showId,
    seatId: seat._id,
    status: "AVAILABLE",
    holdUntil: null,
    version: 0,
  }));

  return showInventoryRepository.createMany(inventory);
}

export async function getShowSeats(showId) {
  await showInventoryRepository.releaseExpiredHolds(showId);

  const inventory =
    await showInventoryRepository.findByShowId(showId);

  return inventory.sort((a, b) => {
    const rowCompare = a.seatId.rowLabel.localeCompare(
      b.seatId.rowLabel
    );

    if (rowCompare !== 0) {
      return rowCompare;
    }

    return a.seatId.seatNumber - b.seatId.seatNumber;
  });
}

export async function holdSeats(showId, seatIds) {
  if (!seatIds || seatIds.length === 0) {
    throw new Error("At least one seat is required");
  }

  const uniqueSeatIds = [...new Set(seatIds)];

  if (uniqueSeatIds.length !== seatIds.length) {
    throw new Error("Duplicate seat IDs are not allowed");
  }

  const holdUntil = new Date(
    Date.now() + 5 * 60 * 1000
  );

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const result = await showInventoryRepository.holdSeats(
      showId,
      uniqueSeatIds,
      holdUntil,
      session
    );

    if (result.modifiedCount !== uniqueSeatIds.length) {
      throw new Error("One or more seats are not available");
    }

    await session.commitTransaction();

    return {
      success: true,
      seatIds: uniqueSeatIds,
      holdUntil,
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
}

export async function releaseSeats(showId, seatIds) {
  if (!seatIds || seatIds.length === 0) {
    throw new Error("At least one seat is required");
  }

  const uniqueSeatIds = [...new Set(seatIds)];

  if (uniqueSeatIds.length !== seatIds.length) {
    throw new Error("Duplicate seat IDs are not allowed");
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const result = await showInventoryRepository.releaseSeats(
      showId,
      uniqueSeatIds,
      session
    );

    if (result.modifiedCount !== uniqueSeatIds.length) {
      throw new Error("One or more seats are not held");
    }

    await session.commitTransaction();

    return {
      success: true,
      seatIds: uniqueSeatIds,
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
}

export async function releaseExpiredHolds(showId) {
  return showInventoryRepository.releaseExpiredHolds(showId);
}