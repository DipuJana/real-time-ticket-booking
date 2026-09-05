import ShowInventory from "./showInventory.model.js";

export async function findById(inventoryId) {
  return ShowInventory.findById(inventoryId);
}

export async function findByShowId(showId) {
  return ShowInventory.find({ showId }).populate("seatId");
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

export async function holdSeats(
  showId,
  seatIds,
  holdUntil,
  session
) {
  return ShowInventory.updateMany(
    {
      showId,
      seatId: { $in: seatIds },
      status: "AVAILABLE",
    },
    {
      $set: {
        status: "HELD",
        holdUntil,
      },
      $inc: {
        version: 1,
      },
    },
    { session }
  );
}

export async function releaseSeats(showId, seatIds, session) {
  return ShowInventory.updateMany(
    {
      showId,
      seatId: { $in: seatIds },
      status: "HELD",
    },
    {
      $set: {
        status: "AVAILABLE",
        holdUntil: null,
      },
      $inc: {
        version: 1,
      },
    },
    { session }
  );
}

export async function releaseExpiredHolds(showId) {
  return ShowInventory.updateMany(
    {
      showId,
      status: "HELD",
      holdUntil: { $lte: new Date() },
    },
    {
      $set: {
        status: "AVAILABLE",
        holdUntil: null,
      },
      $inc: {
        version: 1,
      },
    }
  );
}