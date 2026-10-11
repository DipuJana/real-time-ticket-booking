import * as inventoryService from "./inventory.service.js";

export async function getShowSeats(req, res, next) {
  try {
    const { showId } = req.params;

    const seats = await inventoryService.getShowSeats(showId);

    res.status(200).json({
      success: true,
      data: seats,
    });
  } catch (error) {
    next(error);
  }
}

export async function holdSeats(req, res, next) {
  try {
    const { showId, seatIds } = req.body;

    const result = await inventoryService.holdSeats(
      showId,
      seatIds
    );

    res.status(200).json({
      success: true,
      message: "Seats held successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function releaseSeats(req, res, next) {
  try {
    const { showId, seatIds } = req.body;

    const result = await inventoryService.releaseSeats(
      showId,
      seatIds
    );

    res.status(200).json({
      success: true,
      message: "Seats released successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}