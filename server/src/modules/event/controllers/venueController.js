// import { Request, Response } from 'express';
import { venueService } from '../services/venueService.js';
import { venueRepository } from '../repositories/venueRepository.js';
import { handleError } from '../errors/handleError.js';
import { CreateVenueDto } from '../dtos/dto.js';

export class venueController {
  constructor(VenueService) {
    this.VenueService = VenueService;
  }

  async createVenue(req, res) {
    try {
      const venueData = req.body;
      const venue = await this.VenueService.createVenue(venueData);
      return res.status(201).json({
        success: true,
        data: venue,
        message: 'Venue created successfully',
      });
    }
    catch (error) {
      return handleError(res, error);
    }
  }

  async getAllVenues(req, res) {
    try {
      const venues = await this.VenueService.getAllVenues();
      return res.status(200).json({
        success: true,
        data: venues,
        message: 'Venues fetched successfully',
      });
    }
    catch (error) {
      return handleError(res, error);
    }
  }

  async updateVenue(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const updatedVenue = await this.VenueService.updateVenue(id, updateData);
      return res.status(200).json({
        success: true,
        data: updatedVenue,
        message: 'Venue updated successfully',
      });
    }
    catch (error) {
      return handleError(res, error);
    }
  }

  async deleteVenue(req, res) {
    try {
      const { id } = req.params;
      const deletedVenue = await this.VenueService.deleteVenue(id);
      return res.status(200).json({
        success: true,
        data: deletedVenue,
        message: 'Venue deleted successfully',
      });
    }
    catch (error) {
      return handleError(res, error);
    }
  }
}