import { HallError } from "./hall.errors.js";

export class HallController {
  constructor(hallService) {
    this.hallService = hallService;
  }

  async createHall(req, res) {
    try {
      const hall = await this.hallService.createHall(req.params.venueId, req.body);
      return res.status(201).json({
        success: true,
        data: hall,
        message: "Hall created successfully",
      });
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  async updateHall(req, res) {
    try {
      const hall = await this.hallService.updateHall(req.params.id, req.body);
      return res.status(200).json({
        success: true,
        data: hall,
        message: "Hall updated successfully",
      });
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  handleError(res, error) {
    if (error instanceof HallError) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }

    console.error("Hall request failed", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}
