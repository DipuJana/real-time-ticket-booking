import Seat from "./seat.model.js";

export async function findById(seatId) {
  return Seat.findById(seatId);
}

export async function findByHallId(hallId) {
  return Seat.find({ hallId }).sort({
    rowLabel: 1,
    seatNumber: 1,
  });
}

export async function findByIds(seatIds) {
  return Seat.find({
    _id: { $in: seatIds },
  });
}

export async function createMany(seats) {
  return Seat.insertMany(seats);
}