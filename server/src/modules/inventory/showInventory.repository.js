import ShowInventory from "./showInventory.model.js";

export async function findById(inventoryId) {
  return ShowInventory.findById(inventoryId);
}

export async function findByShowId(showId) {
  return ShowInventory.find({ showId })
    .populate("seatId")
    .sort({
      "seatId.rowLabel": 1,
      "seatId.seatNumber": 1,
    });
}

export async function findByShowAndSeat(showId, seatId) {
  return ShowInventory.findOne({
    showId,
    seatId,
  });
}

export async function findByShowAndSeats(showId, seatIds) {
  return ShowInventory.find({
    showId,
    seatId: { $in: seatIds },
  });
}

export async function createMany(inventoryData) {
  return ShowInventory.insertMany(inventoryData);
}