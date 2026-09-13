import { Router } from "express";
import { ShowController } from "../modules/event/controllers/showController.js";
import { ShowRepository } from "../modules/event/repositories/showRepository.js";
import { eventRepository } from "../modules/event/repositories/eventRepositry.js";
import { ShowService } from "../modules/event/services/showService.js";
import {
  validateCreateShow,
  validateEventId,
  validateShowId,
  validateUpdateShow,
} from "../modules/event/show.validation.js";
import { requireAdmin } from "../modules/hall/hall.authorization.js";
import { HallRepository } from "../modules/hall/hall.repository.js";

const router = Router();
const showService = new ShowService({
  showRepository: new ShowRepository(),
  eventRepository: new eventRepository(),
  hallRepository: new HallRepository(),
});
const showController = new ShowController(showService);

router.get(
  "/events/:eventId/shows",
  validateEventId,
  (req, res) => showController.getShowsByEventId(req, res)
);

router.post(
  "/shows",
  requireAdmin,
  validateCreateShow,
  (req, res) => showController.createShow(req, res)
);

router.get(
  "/shows/:id",
  validateShowId,
  (req, res) => showController.getShowById(req, res)
);

router.put(
  "/shows/:id",
  requireAdmin,
  validateShowId,
  validateUpdateShow,
  (req, res) => showController.updateShow(req, res)
);

router.delete(
  "/shows/:id",
  requireAdmin,
  validateShowId,
  (req, res) => showController.cancelShow(req, res)
);

export const showRoutes = router;
