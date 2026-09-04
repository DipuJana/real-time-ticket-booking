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

