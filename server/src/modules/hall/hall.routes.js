import { Router } from "express";
import { venueRepository } from "../event/repositories/venueRepository.js";
import * as seatRepository from "../inventory/seat.repository.js";
import { requireAdmin } from "./hall.authorization.js";
import { HallController } from "./hall.controller.js";
import { HallRepository } from "./hall.repository.js";
import { HallService } from "./hall.service.js";
import {
  validateCreateHall,
  validateHallId,
  validateUpdateHall,
  validateVenueId,
} from "./hall.validation.js";

const router = Router();
const hallService = new HallService({
  hallRepository: new HallRepository(),
  venueRepository: new venueRepository(),
  seatRepository,
});
const hallController = new HallController(hallService);

router.post(
  "/venues/:venueId/halls",
  requireAdmin,
  validateVenueId,
  validateCreateHall,
  (req, res) => hallController.createHall(req, res)
);

router.put(
  "/halls/:id",
  requireAdmin,
  validateHallId,
  validateUpdateHall,
  (req, res) => hallController.updateHall(req, res)
);

export default router;
