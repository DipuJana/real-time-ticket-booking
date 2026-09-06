import express from "express";

import {
  getShowSeats,
  holdSeats,
  releaseSeats,
} from "./inventory.controller.js";

import {
  validateShowId,
  validateHoldRequest,
  validateReleaseRequest,
} from "./inventory.validation.js";

const router = express.Router();

router.get(
  "/shows/:showId/seats",
  validateShowId,
  getShowSeats
);

router.post(
  "/inventory/hold",
  validateHoldRequest,
  holdSeats
);

router.post(
  "/inventory/release",
  validateReleaseRequest,
  releaseSeats
);

export default router;