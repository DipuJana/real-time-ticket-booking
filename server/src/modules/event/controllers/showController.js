import { HallError } from "../../hall/hall.errors.js";
import { handleError } from "../errors/handleError.js";

export class ShowController {
  constructor(showService) {
    this.showService = showService;
  }

  async getShowsByEventId(req, res) {
    try {
      const { eventId } = req.params;
      const shows = await this.showService.getShowsByEventId(eventId);

      return res.status(200).json({
        success: true,
        data: shows,
        message: "Shows fetched successfully",
      });
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  async createShow(req, res) {
    try {
      const show = await this.showService.createShow(req.body);

      return res.status(201).json({
        success: true,
        data: show,
        message: "Show created successfully",
      });
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  async getShowById(req, res) {
    try {
      const show = await this.showService.getShowById(req.params.id);

      return res.status(200).json({
        success: true,
        data: show,
        message: "Show fetched successfully",
      });
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  async updateShow(req, res) {
    try {
      const show = await this.showService.updateShow(req.params.id, req.body);

      return res.status(200).json({
        success: true,
        data: show,
        message: "Show updated successfully",
      });
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  async cancelShow(req, res) {
    try {
      const show = await this.showService.cancelShow(req.params.id);

      return res.status(200).json({
        success: true,
        data: show,
        message: "Show cancelled successfully",
      });
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  handleError(res, error) {
    if (error instanceof HallError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message === "Show not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    return handleError(res, error);
  }
}
