import mongoose from "mongoose";

export function validateShowId(req, res, next) {
  const { showId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(showId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid show ID",
    });
  }

  next();
}

export function validateHoldRequest(req, res, next) {
  const { showId, seatIds} = req.body;

  if (!showId) {
    return res.status(400).json({
      success: false,
      message: "showId is required",
    });
  }

  if (!mongoose.Types.ObjectId.isValid(showId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid show ID",
    });
  }

  if (!Array.isArray(seatIds) || seatIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: "seatIds must be a non-empty array",
    });
  }

  const invalidSeatId = seatIds.some(
    (seatId) => !mongoose.Types.ObjectId.isValid(seatId)
  );

  if (invalidSeatId) {
    return res.status(400).json({
      success: false,
      message: "One or more seat IDs are invalid",
    });
  }

  next();
}

export function validateReleaseRequest(req, res, next) {
  const { showId, seatIds } = req.body;

  if (!showId) {
    return res.status(400).json({
      success: false,
      message: "showId is required",
    });
  }

  if (!mongoose.Types.ObjectId.isValid(showId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid show ID",
    });
  }

  if (!Array.isArray(seatIds) || seatIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: "seatIds must be a non-empty array",
    });
  }

  const invalidSeatId = seatIds.some(
    (seatId) => !mongoose.Types.ObjectId.isValid(seatId)
  );

  if (invalidSeatId) {
    return res.status(400).json({
      success: false,
      message: "One or more seat IDs are invalid",
    });
  }

  next();
}